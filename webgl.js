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

function sigmoid(x) {
  const ax = x * 50;

  const ex = Math.exp(ax);
  return ex / (ex + 1) - 0.5;
}

function generateData(ctx, num = 1) {
  const x = new Float32Array(num);
  const y = new Float32Array(num);
  const z = new Float32Array(num);
  const w = new Float32Array(num);
  const color = new Uint8Array(num * 4);

  const num2 = (num / 2) | 0;

  for (let i = 0; i < num2; i += 1) {
    const xv = sigmoid(Math.random() - 0.5);
    const yv = sigmoid(Math.random() - 0.5);
    const zv = sigmoid(Math.random() - 0.5);
    const wv = sigmoid(Math.random() - 0.5);

    x[i] = xv;
    z[i] = yv;
    y[i] = zv;
    w[i] = wv;

    // Original
    // ${i % 256}, ${(i / 15) % 150}, ${(wv + 0.5) * 255})`);
    color[i * 4 + 0] = i % 256; // R
    color[i * 4 + 1] = ((i / 15) % 150) | 0 // G
    color[i * 4 + 2] = ((wv + 0.5) * 255) | 0; // B
    color[i * 4 + 3] = 0xff;

    // Pretty
    // color[i * 4 + 0] = ((xv + 0.5) * 255) | 0; // R
    // color[i * 4 + 1] = ((yv + 0.5) * 255) | 0; // G
    // color[i * 4 + 2] = ((wv + 0.5) * 255) | 0; // B
    // color[i * 4 + 3] = 0xff;
  }

  for (let i = 0; i < num; i += 2) {
    const xv = Math.sin(i / num * Math.PI * 41) * 0.5;
    const yv = Math.sin(i / num * Math.PI * 87) * 0.5;
    const zv = Math.sin(i / num * Math.PI * 29) * 0.5;
    const wv = Math.sin(i / num * Math.PI * 131) * 0.5;

    const iN = i;

    const fuzz1 = (Math.sin(i / num * Math.PI * 2 * 50.0) + 1.0) * 0.5;
    let fuzz = fuzz1 * 0.03;

    x[iN] = xv + Math.random() * fuzz;
    z[iN] = yv + Math.random() * fuzz;
    y[iN] = zv + Math.random() * fuzz;
    w[iN] = wv + Math.random() * fuzz;

    // Original
    // ${i % 256}, ${(i / 15) % 150}, ${(wv + 0.5) * 255})`);
    color[iN * 4 + 0] = fuzz1 * 255;
    color[iN * 4 + 1] = (xv + 0.5) * 255;
    color[iN * 4 + 2] = (wv + 0.5) * 255;
    color[iN * 4 + 3] = 0xff;

    // Pretty
    // color[i * 4 + 0] = ((xv + 0.5) * 255) | 0; // R
    // color[i * 4 + 1] = ((yv + 0.5) * 255) | 0; // G
    // color[i * 4 + 2] = ((wv + 0.5) * 255) | 0; // B
    // color[i * 4 + 3] = 0xff;
  }

  return {
    x,
    y,
    z,
    w,
    color,
  };
}

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
      
      attribute float aX; // 4D coordinate where to place the point
      attribute float aY;
      attribute float aZ;
      attribute float aW;
      attribute vec4 aColor;

      uniform mat4 uMatrix;
      uniform mat4 uTranslationMatrix;
      
      uniform float uXzAngle;
      uniform float uXwAngle;
      uniform float uYwAngle;

      varying vec4 vColor;

      void main() {
          vColor = aColor;

          float tx = aX * cos(uXzAngle) - aZ * sin(uXzAngle);
          float ty = aY;
          float tz = aX * sin(uXzAngle) + aZ * cos(uXzAngle);
          float tw = aW;

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

  const buffers = {};
  const attributes = {};
  for (let coord of ['x', 'y', 'z', 'w', 'color']) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data[coord], gl.STATIC_DRAW);
    buffers[coord] = buf;

    const attributeName = `a${coord.charAt(0).toUpperCase()}${coord.substr(1)}`;
    const attribute = gl.getAttribLocation(shaderProgram, attributeName);
    gl.enableVertexAttribArray(attribute);

    attributes[coord] = attribute;
  }

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
    buffers,
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

  for (let coord of ['x', 'y', 'z', 'w']) {
    gl.bindBuffer(gl.ARRAY_BUFFER, g.buffers[coord]);
    gl.vertexAttribPointer(g.attributes[coord], 1, gl.FLOAT, false, 0, 0);
    g.ext.vertexAttribDivisorANGLE(g.attributes[coord], 6);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, g.buffers.color);
  gl.vertexAttribPointer(g.attributes.color, 4, gl.UNSIGNED_BYTE, true, 0, 0);
  g.ext.vertexAttribDivisorANGLE(g.attributes.color, 6);

  // const time = Date.now() / 1000.0;
  // const dx = Math.cos(time) * 0.5;
  // const dy = Math.sin(time) * 0.5;
  //
  // g.transformMatrix[12] = dx;
  // g.transformMatrix[13] = dy;

  gl.uniformMatrix4fv(g.uMatrix, false, g.transformMatrix);

  g.ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, data.x.length);
}

function run() {
  const numRectangles = 1000000;

  const ctx = init('container', 600, 600);
  const data = generateData(ctx, numRectangles);
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
