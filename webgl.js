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

  var contextAttributes = {
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
  const ax = x * 25;

  const ex = Math.exp(ax);
  return ex / (ex + 1) - 0.5;
}

function generateData(ctx, num = 1) {
  const x = [];
  const y = [];
  const z = [];
  const w = [];
  const color = [];

  const num2 = num / 2;

  for (let i = 0; i < num2; i += 1) {
    x.push(sigmoid(Math.random() - 0.5));
    y.push(sigmoid(Math.random() - 0.5));
    z.push(sigmoid(Math.random() - 0.5));
    const wv = sigmoid(Math.random() - 0.5);
    w.push(wv);

    color.push(`rgb(${i % 256}, ${(i / 15) % 150}, ${(wv + 0.5) * 255})`);
  }

  const twopi = Math.PI * 20;

  for (let i = 0; i < num2; i += 1) {
    const xv = Math.sin(i / num2 * twopi) * 0.5;
    x.push(xv);
    const yv = Math.sin(i / num2 * twopi * 0.41) * 0.5;
    y.push(yv);
    z.push(Math.sin(i / num2 * twopi * 1.32) * 0.5);
    const wv = Math.sin(i / num2 * twopi * 0.8) * 0.5;
    // const wv = 0.5;
    w.push(wv);

    color.push(`rgb(${(xv + 0.5) * 255},${(yv + 0.5) * 255},${(wv + 0.5) * 255})`);
  }

  return {
    x,
    y,
    z,
    w,
    color,
  };
}

function initGl(ctx) {
  const gl = ctx.context;

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Near things obscure far things
  gl.depthFunc(gl.LEQUAL);
  // Clear the color as well as the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // language=GLSL
  const vertexShaderCode = `
      attribute vec2 aPos;

      uniform mat4 uMatrix;
      
      varying vec2 vPos;
      varying vec2 vScreenPos;

      void main() {
          gl_Position = uMatrix * vec4(aPos, 0.0, 1.0);
          vPos = aPos;
          vScreenPos = (gl_Position.xy + vec2(1.0, 1.0)) / 2.0;
      }
  `;

  // language=GLSL
  const fragmentShaderCode = `
      precision mediump float;
    
      varying vec2 vPos;
      varying vec2 vScreenPos;
    
      void main() {
          gl_FragColor = vec4((vPos.x + 1.0) / 2.0, (vPos.y + 1.0) / 2.0, (sin(vScreenPos.y * 50.0) + 1.0) / 2.0, 1.0);
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

  // Initalize uniforms
  const transformMatrixInit = [
    0.5, 0, 0, 0, // x
    0, 0.5, 0, 0, // y
    0, 0, 1, 0, // z
    dx, dy, 0, 1  // w
  ];

  const uMatrix = gl.getUniformLocation(shaderProgram, "uMatrix");
  const transformMatrix = new Float32Array(transformMatrixInit);
  gl.uniformMatrix4fv(uMatrix, false, transformMatrix);


  // Initialize vertex buffers
  const squareVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

  var vertices = [
    1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  return {
    squareVerticesBuffer,
    posAttribute,
    shaderProgram,
    squareVerticesBuffer,
    uMatrix,
    transformMatrix,
  }
}

function draw(ctx, g, data) {
  const gl = ctx.context;

  gl.bindBuffer(gl.ARRAY_BUFFER, g.squareVerticesBuffer);
  gl.vertexAttribPointer(g.posAttribute, 2, gl.FLOAT, false, 0, 0);

  const time = Date.now() / 1000.0;
  const dx = Math.cos(time) * 0.5;
  const dy = Math.sin(time) * 0.5;

  g.transformMatrix[12] = dx;
  g.transformMatrix[13] = dy;

  gl.uniformMatrix4fv(g.uMatrix, false, g.transformMatrix);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function run() {
  const numRectangles = 5000;

  const ctx = init('container', 600, 600);
  const glCtx = initGl(ctx);
  const data = generateData(ctx, numRectangles);

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
