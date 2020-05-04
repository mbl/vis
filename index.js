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

function generateData(ctx, num = 1) {
  const x = [];
  const y = [];
  const o = [];
  const color = [];

  for (let i = 0; i < num; i += 1) {
    x.push(Math.random() * ctx.width);
    y.push(Math.random() * ctx.height);
    o.push(Math.random() * Math.PI * 2);
    color.push(`rgb(${i % 256}, ${(i/15) % 150}, 0)`);
  }

  return {
    x,
    y,
    o,
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
  const { x, y, o, color } = data;

  for (let i = 0; i < length; i += 1) {
    c.fillStyle = color[i];
    const xi = x[i];
    const yi = y[i];
    const oi = o[i];

    const dx = Math.sin(timeSeconds + oi) * 100;
    const dy = Math.cos(timeSeconds + oi) * 100;

    c.fillRect(
      xi + dx,
      yi + dy,
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
  const numRectangles = 20000;

  const ctx = init();
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
