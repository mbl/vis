export function grid(ctx) {
    ctx.drawRect(0, 0, 1000, 600, '#2a2a2a');

    const cellSize = 16;
    const fullCellSize = 1000;

    for (var i = 0; i < fullCellSize; i += cellSize) {
        ctx.drawLine(i, 0, i, fullCellSize, (i % (8 * cellSize)) !== 0 ? '#353535' : '#1c1c1c');
    }

    for (var i = 0; i < fullCellSize; i += cellSize) {
        ctx.drawLine(0, i, fullCellSize, i, (i % (8 * cellSize) !== 0) ? '#353535' : '#1c1c1c');
    }
}