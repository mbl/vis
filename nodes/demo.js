import { node } from './node.js';
import { Context } from './context.js';

/**
 * 
 * @param {Context} ctx 
 */
function draw(ctx) {
    ctx.drawRect(0, 0, 1000, 600, '#2a2a2a');

    const cellSize = 16;
    const fullCellSize = 1000;

    for (var i = 0; i < fullCellSize; i += cellSize) {
        ctx.drawLine(i, 0, i, fullCellSize, (i % (8 * cellSize)) !== 0 ? '#353535' : '#1c1c1c');
    }

    for (var i = 0; i < fullCellSize; i += cellSize) {
        ctx.drawLine(0, i, fullCellSize, i, (i % (8 * cellSize) !== 0) ? '#353535' : '#1c1c1c');
    }

    const time = Date.now();
    for (let i = 0; i < 100; i++) {
        node(ctx, 
            10 + (i % 10) * 90 + Math.sin(i + time / 500.0) * 20, 
            Math.trunc(i / 10) * 85 + 100 + Math.sin(time / 1000.0) * 100, 
            80 + Math.sin(0.7 * i + time/ 200) * 5,
            70 + Math.sin(0.3 * i + time/ 200) * 5,
            `hsl(${i * 4}, 100%, 50%)`);
    }
    node(ctx, 400, 50, 100, 100);
    ctx.requestRedraw();
}

const ctx = new Context('container', 1000, 600, () => draw(ctx));
ctx.requestRedraw();