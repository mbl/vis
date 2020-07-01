export function grid(ctx) {
    ctx.drawRect(0, 0, ctx.width, ctx.height, '#2a2a2a');

    const cellSize = 16;

    for (var i = 0; i < ctx.width; i += cellSize) {
        ctx.drawLine(i, 0, i, ctx.height, (i % (8 * cellSize)) !== 0 ? 0xff353535 : 0xff1c1c1c);
    }

    for (var i = 0; i < ctx.height; i += cellSize) {
        ctx.drawLine(0, i, ctx.width, i, (i % (8 * cellSize) !== 0) ? 0xff353535 : 0xff1c1c1c);
    }
}