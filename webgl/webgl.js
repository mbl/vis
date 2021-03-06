import { generateData } from '../generateData.js';

// My macbook is 2560 x 1600 retina, but the browser chrome takes some space
// and for streaming I only use part of my window. So 600 x 600 is a reasonable default
// canvas size.
function init(elementId = 'container', width = 600, height = 600) {
  const div = document.getElementById(elementId);

  const canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');

  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  // canvas.style.willChange = 'content';
  canvas.style.backgroundColor = 'black';
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.imageRendering = 'pixelated';

  div.appendChild(canvas);

  const contextAttributes = {
    alpha: false,
    depth: true,
    stencil: false,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: true,
    xrCompatible: false,
  };

  // TODO: webglcontextlost, webglcontextrestored

  let context = canvas.getContext('webgl', contextAttributes);

  if (!context) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    context = null;
  }

  return {
    canvas,
    context,
    width: width * window.devicePixelRatio,
    height: height * window.devicePixelRatio,
  };
}

let numMeasurements = 0;
let frameInMs = 0;

// Normal 3D rotations
let xzAngle = 0.0; // Rotation around YW
let xyAngle = 0.0; // Rotation around ZW
let yzAngle = 0.0; // Rotation around XW

// "4D" rotations
let xwAngle = 0.0; // Rotation around YZ
let ywAngle = 0.0; // Rotation around XZ
let zwAngle = 0.0; // Rotation around XY

function initGl(ctx, data) {
  const gl = ctx.context;

  // Initialize ANGLE_instanced_arrays extension
  const ext = gl.getExtension('ANGLE_instanced_arrays');
  if (!ext) {
    throw new Error('need ANGLE_instanced_arrays');
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Near things obscure far things
  gl.depthFunc(gl.LEQUAL);
  // Clear the color as well as the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // language=GLSL
  const vertexShaderCode = `
      attribute vec2 aPos; // Corner of triangle, -1..1 range in X and Y (ANGLE divisor 6)

      attribute vec4 aCoord; // 4D coordinate where to place the point
      attribute vec4 aColor;

      uniform mat4 uMatrix;
      uniform mat4 uTranslationMatrix;
      
      uniform float uXzAngle;
      uniform float uXwAngle;
      uniform float uYwAngle;

      varying vec4 vColor;

      void main() {
          vColor = aColor;

          float tx = aCoord.x * cos(uXzAngle) - aCoord.z * sin(uXzAngle);
          float ty = aCoord.y;
          float tz = aCoord.x * sin(uXzAngle) + aCoord.z * cos(uXzAngle);
          float tw = aCoord.w;

          // XW rotation
          float t = tx * cos(uXwAngle) - tw * sin(uXwAngle);
          ty = ty;
          tz = tz;
          tw = tx * sin(uXwAngle) + tw * cos(uXwAngle);
          tx = t;

          // YW rotation
          tx = tx;
          t =  ty * cos(uYwAngle) - tw * sin(uYwAngle);
          tz = tz;
          tw = ty * sin(uYwAngle) + tw * cos(uYwAngle);
          ty = t;

          gl_Position = uMatrix * uTranslationMatrix * vec4(tx, ty, tz, 1.0) + vec4(aPos / 600.0, 0.0, 0.0);
      }
  `;

  // language=GLSL
  const fragmentShaderCode = `
      precision mediump float;
      
      varying vec4 vColor;
    
      void main() {
          gl_FragColor = vColor;
      }
  `;

  function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert("An error occurred compiling the shader: " + gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(vertexShaderCode, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(fragmentShaderCode, gl.FRAGMENT_SHADER);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
  }

  gl.useProgram(shaderProgram);

  const posAttribute = gl.getAttribLocation(shaderProgram, "aPos");
  gl.enableVertexAttribArray(posAttribute);

  const dx = 0;
  const dy = 0;

  // Initialize uniforms

  // 1) add constant value to z
  // 2) divide x and y by z
  // note, webgl displays [x, y, z, w] -> [x/w, y/w, z/w]

  const translationMatrixInit = new Float32Array([
  //x  y  z  w
    1, 0, 0, 0, // x
    0, 1, 0, 0, // y
    0, 0, 1, 0, // z
    0, 0, 1.5, 1, // w == 1
  ]);

  const uTranslationMatrix = gl.getUniformLocation(shaderProgram, "uTranslationMatrix");
  const translationMatrix = new Float32Array(translationMatrixInit);
  gl.uniformMatrix4fv(uTranslationMatrix, false, translationMatrix);

  const transformMatrixInit = [
//  x  , y  , z  , w
    1  , 0  , 0  , 0, // x is multiplied by <---
    0  , 1  , 0  , 0, // y
    0  , 0  , 0  , 1, // z
    0  , 0  , 0 ,  0  // w = 1.0
  ];

  const uMatrix = gl.getUniformLocation(shaderProgram, "uMatrix");
  const transformMatrix = new Float32Array(transformMatrixInit);
  gl.uniformMatrix4fv(uMatrix, false, transformMatrix);

  const uXzAngle = gl.getUniformLocation(shaderProgram, "uXzAngle");
  const uXwAngle = gl.getUniformLocation(shaderProgram, "uXwAngle");
  const uYwAngle = gl.getUniformLocation(shaderProgram, "uYwAngle");

  // Initialize vertex buffers
  var vertices = [
    1.0, 1.0, // Triangle 1
    -1.0, 1.0,
    1.0, -1.0,

    -1.0, 1.0, // Triangle 2
    1.0, -1.0,
    -1.0, -1.0
  ];

  const squareVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  const attributes = {};
  
  const coord = gl.getAttribLocation(shaderProgram, 'aCoord');
  gl.enableVertexAttribArray(coord);
  attributes['aCoord'] = coord;
  const color = gl.getAttribLocation(shaderProgram, 'aColor');
  gl.enableVertexAttribArray(color);
  attributes['aColor'] = color;

  return {
    posAttribute,
    shaderProgram,
    squareVerticesBuffer,
    uMatrix,
    uXzAngle,
    uXwAngle,
    uYwAngle,
    transformMatrix,
    ext,
    buffer,
    attributes,
  }
}

function draw(ctx, g, data) {
  const time = Date.now();
  const timeSeconds = time / 10000;

  const gl = ctx.context;

  // Update uniforms
  xzAngle = (timeSeconds * Math.PI) % (Math.PI * 2);
  xwAngle = (timeSeconds * Math.PI * 0.3) % (Math.PI * 2);
  ywAngle = (timeSeconds * Math.PI * 1.2) % (Math.PI * 2);

  gl.uniform1f(g.uXzAngle, xzAngle);
  gl.uniform1f(g.uXwAngle, xwAngle);
  gl.uniform1f(g.uYwAngle, ywAngle);

  gl.bindBuffer(gl.ARRAY_BUFFER, g.squareVerticesBuffer);
  gl.vertexAttribPointer(g.posAttribute, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, g.buffer);
  gl.vertexAttribPointer(g.attributes['aCoord'], 4, gl.FLOAT, false, 8 * 4, 0);
  g.ext.vertexAttribDivisorANGLE(g.attributes['aCoord'], 6);

  gl.bindBuffer(gl.ARRAY_BUFFER, g.buffer);
  gl.vertexAttribPointer(g.attributes['aColor'], 4, gl.FLOAT, true, 8 * 4, 4 * 4);
  g.ext.vertexAttribDivisorANGLE(g.attributes['aColor'], 6);

  // const time = Date.now() / 1000.0;
  // const dx = Math.cos(time) * 0.5;
  // const dy = Math.sin(time) * 0.5;
  //
  // g.transformMatrix[12] = dx;
  // g.transformMatrix[13] = dy;

  gl.uniformMatrix4fv(g.uMatrix, false, g.transformMatrix);

  g.ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, data.length / 8 * 6);
}

function run() {
  const numRectangles = 150000;

  const ctx = init('container', 600, 600);
  const data = generateData(numRectangles);
  const glCtx = initGl(ctx, data);

  function loop() {
    // Take inputs from user

    // Do whatever updates necessary

    // Update screen
    draw(ctx, glCtx, data);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

run();
