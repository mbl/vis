import { generateData } from "../generateData.js";

fetch("math.wasm").then(reponse =>
    reponse.arrayBuffer()
).then(bytes =>
    WebAssembly.instantiate(bytes, {})
).then(result =>
    result.instance
).then(main);

function main(wasm) {
    const screenWidth = 600;
    const screenHeight = 600;
    const width = screenWidth * window.devicePixelRatio;
    const height = screenHeight * window.devicePixelRatio;
    const frameSize = width * height * 4;
    const pageSize = 65536;

    const numRectangles = 1000000;
    const data = generateData(numRectangles);

    const bytesNeeded = frameSize 
        + data.byteLength;

    // Get enough memory
    const currentBytes = wasm.exports.memory.buffer.byteLength;
    if (bytesNeeded > currentBytes) {
        wasm.exports.memory.grow(Math.ceil((bytesNeeded - currentBytes)  / pageSize));
    }

    // Fill data into wasm memory
    let currentPointer = 0;
    const dataOffset = 0;

    const mem = new Float32Array(wasm.exports.memory.buffer);
    const buf = new Float32Array(data.buffer);
    mem.set(buf);
    currentPointer += data.byteLength;

    const frameOffset = currentPointer;

    const canvas = document.getElementById('picture');
    const context = canvas.getContext('2d'); // TODO: bitmaprenderer
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${screenWidth}px`;
    canvas.style.height = `${screenHeight}px`;
    
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
            dataOffset, // X, Y, Z, W, R, G, B, A packed

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
