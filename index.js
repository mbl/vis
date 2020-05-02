// Context for drawing operations
let ctx = {
  canvas: null,
  context: null,
  width: 0,
  height: 0,
};

function init(elementId = 'container', width = 600, height = 800) {
  const div = document.getElementById(elementId);

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  div.appendChild(canvas);

  const context = canvas.getContext('2d');

  return {
    canvas,
    context,
    width,
    height
  };
}

let numMeasurements = 0;
let frameInMs = 0;

function generateData(ctx, num = 1) {
  const x = [];
  const y = [];
  const o = [];

  for (let i = 0; i < num; i += 1) {
    x.push(Math.random() * ctx.width);
    y.push(Math.random() * ctx.height);
    o.push(Math.random() * Math.PI * 2);
  }

  return {
    x,
    y,
    o,
  };
}

function draw(ctx, data) {
  const time = Date.now();

  const timeSeconds = time / 10000;

  const c = ctx.context;
  c.clearRect(0, 0, ctx.width, ctx.height);
  c.fillStyle = 'red';

  for (let i = 0; i < data.x.length; i += 1) {
    // c.fillStyle = `rgb(${i % 256}, ${(i/15) % 150}, 0)`;
    const x = data.x[i];
    const y = data.y[i];
    const o = data.o[i];

    const dx = Math.sin(timeSeconds + o) * 100;
    const dy = Math.cos(timeSeconds + o) * 100;

    c.fillRect(
      x + dx,
      y + dy,
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

const numRectangles = 20000;

ctx = init();
const data = generateData(ctx, numRectangles);

function loop() {
  // Take inputs from user

  // Do whatever updates necessary

  // Update screen
  draw(ctx, data);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
