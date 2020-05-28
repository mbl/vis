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

    node(ctx, 10, 10, 300, 150);
    node(ctx, 400, 50, 100, 100);
}

const canvas = document.getElementById('container');
const ctx = new Context(canvas.getContext('2d', { alpha: false }));
draw(ctx);