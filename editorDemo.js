import { drawBox } from './nodes/nodes.js';
import { Context } from './nodes/context.js';

const w = 200;
const h = 130;

function draw() {
    ctx.ctx.clearRect(0,0, w, h);

    const time = Date.now();
    const ox = Math.cos(time / 400.0) * 5;
    const oy = Math.sin(time / 400.0) * 5;

    drawBox(ctx, 1, 10 + ox, 10 + oy, w-50, h-25, 0xffff0000);
    drawBox(ctx, 2, w - 90 - ox, 30 - oy, 80, 65, 0xffff8800);
    ctx.requestRedraw();
}

const ctx = new Context('editorDemo', () => draw(), 'nodes/');
ctx.requestRedraw();