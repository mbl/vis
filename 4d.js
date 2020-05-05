// My macbook is 2560 x 1600 retina, but the browser chrome takes some space
// and for streaming I only use part of my window. So 600 x 600 is a reasonable default
// canvas size.
function init(elementId = 'container', width = 600, height = 600) {
  const div = document.getElementById(elementId);

  const canvas = document.createElement("canvas");

  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  // canvas.style.willChange = 'content';
  canvas.style.backgroundColor = 'black';
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.imageRendering = 'pixelated';

  div.appendChild(canvas);

  const context = canvas.getContext('2d', { alpha: false });

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

  for (let i = 0; i < num; i += 1) {
    x.push(sigmoid(Math.random() - 0.5));
    y.push(sigmoid(Math.random() - 0.5));
    z.push(sigmoid(Math.random() - 0.5));
    const wv = sigmoid(Math.random() - 0.5);
    w.push(wv);

    color.push(`rgb(${i % 256}, ${(i / 15) % 150}, ${(wv + 0.5) * 255})`);
  }

  return {
    x,
    y,
    z,
    w,
    color,
  };
}

function draw(ctx, data) {
  const time = Date.now();

  const timeSeconds = time / 10000;

  const c = ctx.context;
  c.fillStyle = '#000000';
  c.fillRect(0, 0, ctx.width, ctx.height);
  c.fillStyle = 'red';

  const length = data.x.length;
  const { x, y, z, w, color } = data;

  const width2 = ctx.width / 2;
  const height2 = ctx.height / 2;

  const dz = 1.5;

  xzAngle = timeSeconds * Math.PI;
  xwAngle = timeSeconds * Math.PI * 0.3;
  ywAngle = timeSeconds * Math.PI * 1.2;

  for (let i = 0; i < length; i += 1) {
    c.fillStyle = color[i];

    const ox = x[i];
    const oy = y[i];
    const oz = z[i];
    const ow = w[i];

    // XZ rotation
    let tx = ox * Math.cos(xzAngle) - oz * Math.sin(xzAngle);
    let ty = oy;
    let tz = ox * Math.sin(xzAngle) + oz * Math.cos(xzAngle);
    let tw = ow;

    // XW rotation
    let t = tx * Math.cos(xwAngle) - tw * Math.sin(xwAngle);
    ty = ty;
    tz = tz;
    tw = tx * Math.sin(xwAngle) + tw * Math.cos(xwAngle);
    tx = t;

    // YW rotation
    tx = tx;
    t = ty * Math.cos(ywAngle) - tw * Math.sin(ywAngle);
    tz = tz;
    tw = ty * Math.sin(ywAngle) + tw * Math.cos(ywAngle);
    ty = t;


    tz += dz;

    const px = tx / tz * width2 + width2;
    const py = ty / tz * height2 + height2;

    c.fillRect(
      (px | 0),
      (py | 0),
      6, 6);
  }

  const endTime = Date.now();
  frameInMs += endTime - time;
  numMeasurements += 1;

  if (numMeasurements % 60 === 0) {
    console.log(frameInMs / numMeasurements);
    numMeasurements = 0;
    frameInMs = 0;
  }
}

function run() {
  const numRectangles = 5000;

  const ctx = init('container', 600, 600);
  const data = generateData(ctx, numRectangles);

  function loop() {
    // Take inputs from user

    // Do whatever updates necessary

    // Update screen
    draw(ctx, data);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

run();
