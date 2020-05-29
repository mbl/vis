import { node } from './nodes/node.js';
import { Context } from './nodes/context.js';

const w = 200;
const h = 130;

function draw() {
    ctx.ctx.clearRect(0,0, w, h);

    const time = Date.now();
    const ox = Math.cos(time / 400.0) * 5;
    const oy = Math.sin(time / 400.0) * 5;

    node(ctx, 10 + ox, 10 + oy, w-50, h-25, 'red');
    node(ctx, w - 90 - ox, 30 - oy, 80, 65, 'orange');
    ctx.requestRedraw();
}

const ctx = new Context('editorDemo', w, h, () => draw(), 'nodes/');
ctx.requestRedraw();