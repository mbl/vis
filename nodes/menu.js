import { Context } from './context.js';
import { types } from './types.js';
import { distancePointToRectangle } from './tools/distance.js';
import { addNode, nodes } from './nodes.js';

export const menuState = {
    displayed: false,
    x: 0,
    y: 0
};

let searchString = '';

/**
 * 
 * @param {Context} ctx 
 */
export function menu(ctx) {
    if (!menuState.displayed) {
        return;
    }
    const x = menuState.x;
    const y = menuState.y;
    const w = 150;
    const h = 300;
    const rowHeight = 20;

    ctx.inputText(-1, 
        (id, value) => value === undefined ? searchString : searchString=value,
        x, y, w, rowHeight, 'string'); 

    let cy = y + rowHeight;

    for (let i=0; i<types.length; i++) {
        const typeInfo = types[i];
        if (searchString === '' || typeInfo.title.includes(searchString)) {
            if (ctx.hitTestRect(x, cy, w, rowHeight)) {
                ctx.recordHitTest('typeButton', i, 
                    distancePointToRectangle(ctx.mouse, x, cy, w, rowHeight),
                    w * rowHeight);
            }
            const hot = ctx.hitTestResult && ctx.hitTestResult.type === 'typeButton' && ctx.hitTestResult.id === i;
            ctx.drawRect(x, cy, w, rowHeight, hot ? 'blue' : 'darkblue');
            ctx.drawText(x, cy, w, rowHeight, typeInfo.title);
            cy += rowHeight;

            if (ctx.mouse.mouseDown && hot) {
                menuState.displayed = false;
                addNode(nodes, typeInfo.type, x, y);
            }
        }
    }
}