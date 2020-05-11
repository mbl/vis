fetch("math.wasm").then(reponse =>
    reponse.arrayBuffer()
).then(bytes =>
    WebAssembly.instantiate(bytes, {})
).then(result =>
    result.instance
).then(main);

function sigmoid(x) {
    const ax = x * 50;
  
    const ex = Math.exp(ax);
    return ex / (ex + 1) - 0.5;
}

function generateData(num = 1) {
    const x = new Float32Array(num);
    const y = new Float32Array(num);
    const z = new Float32Array(num);
    const w = new Float32Array(num);
    const color = new Uint8Array(num * 4);
  
    const num2 = Math.trunc(num / 2);
  
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
  
    for (let i = num2; i < num; i += 1) {
      const iN = i;
      const iO = i;
      const xv = Math.sin(iO / num * Math.PI * 41) * 0.5;
      const yv = Math.sin(iO / num * Math.PI * 87) * 0.5;
      const zv = Math.sin(iO / num * Math.PI * 29) * 0.5;
      const wv = Math.sin(iO / num * Math.PI * 131) * 0.5;
  
      const fuzz1 = (Math.sin(iO / num * Math.PI * 2 * 50.0) + 1.0) * 0.5;
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

function main(wasm) {
    const width = 600;
    const height = 600;
    const frameSize = width * height * 4;
    const pageSize = 65536;

    const numRectangles = 1000000;
    const data = generateData(numRectangles);

    const bytesNeeded = frameSize 
        + data.x.byteLength * 5; // For data.xyzw + color

    // Get enough memory
    const currentBytes = wasm.exports.memory.buffer.byteLength;
    if (bytesNeeded > currentBytes) {
        wasm.exports.memory.grow(Math.ceil((bytesNeeded - currentBytes)  / pageSize));
    }

    // Fill data into wasm memory
    let currentPointer = 0;
    const dataOffsets = {};

    for(coord of ['x', 'y', 'z', 'w', 'color']) {
        const l = data[coord].byteLength;
        const mem = new Uint8Array(wasm.exports.memory.buffer);
        const buf = new Uint8Array(data[coord].buffer);
        for(let i=0; i < l; i++) {
            mem[currentPointer + i] = buf[i];
        }
        dataOffsets[coord] = currentPointer;
        currentPointer += data[coord].byteLength;
    }
    const frameOffset = currentPointer;

    const canvas = document.getElementById('picture');
    const context = canvas.getContext('2d'); // TODO: bitmaprenderer
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    var idata = context.createImageData(width, height);

    function draw() {
        const time = Date.now() % 1000000;
        const timeSeconds = time / 10000;

        const xzAngle = (timeSeconds * Math.PI);
        const xwAngle = (timeSeconds * Math.PI * 0.3);
        const ywAngle = (timeSeconds * Math.PI * 1.2);

        const sinXzAngle = Math.sin(xzAngle);
        const cosXzAngle = Math.cos(xzAngle);
        const sinXwAngle = Math.sin(xwAngle);
        const cosXwAngle = Math.cos(xwAngle);
        const sinYwAngle = Math.sin(ywAngle);
        const cosYwAngle = Math.cos(ywAngle);

        wasm.exports.frame(
            time, // time
            numRectangles,
            dataOffsets['x'], // X pointer
            dataOffsets['y'], // Y pointer
            dataOffsets['z'], // Z pointer
            dataOffsets['w'], // W pointer
            dataOffsets['color'], // Color pointer 

            sinXzAngle,
            cosXzAngle,
            sinXwAngle,
            cosXwAngle,
            sinYwAngle,
            cosYwAngle,
        
            width,
            height,
            frameOffset
        );
        
        const frameBuffer = wasm.exports.memory.buffer.slice(frameOffset, frameOffset + frameSize);
        const frameArray = new Uint8ClampedArray(frameBuffer);
        idata.data.set(frameArray);

        // context.transferFromImageBitmap(bitmap);
        context.putImageData(idata, 0, 0);

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}
