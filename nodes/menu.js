import { Context } from './context.js';
import { types } from './types.js';
import { distancePointToRectangle } from './tools/distance.js';
import { addNode, nodes } from './nodes.js';

export const menuState = {
    displayed: false,
    x: 0,
    y: 0
};

let searchString = {
    value: ''
};

let menuHeight = 30;

export function menuBox(ctx, x, y, w, h) {
    ctx.nineSlicePlane(x - 13, y - 13, w + 26, h + 26, 'assets/RegularNode_shadow.png', 21, 21, 21, 21);
    ctx.nineSlicePlane(x, y, w, h, 'assets/RegularNode_body.png', 14, 14, 14, 14);
}

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
    const h = menuHeight;
    const rowHeight = 20;

    if(!ctx.hitTestRect(x, y, w, h) && ctx.mouse.mouseDown) {
        menuState.displayed = false;
        return;
    }

    menuBox(ctx, x, y, w,h);

    let cy = y + 5;
    const pad = 5;

    ctx.inputText(searchString,
        x + pad, cy, w - pad * 2, rowHeight, 'string'); 

    cy += rowHeight;

    for (let i=0; i<types.length; i++) {
        const typeInfo = types[i];
        if (searchString.value === '' || typeInfo.title.includes(searchString.value)) {
            if (ctx.hitTestRect(x, cy, w, rowHeight)) {
                ctx.recordHitTest('typeButton', i, 
                    distancePointToRectangle(ctx.mouse, x, cy, w, rowHeight),
                    w * rowHeight);
            }
            const hot = ctx.hitTestResult && ctx.hitTestResult.type === 'typeButton' && ctx.hitTestResult.obj === i;
            if (hot) {
                ctx.nineSlicePlane(x + 1, cy, w - 2, rowHeight, 'assets/RegularNode_color_spill.png', 6, 6, 1, 1, 0x80ccddcc);
            }
            ctx.drawText(x + 2*pad, cy + 2, w - pad * 4, rowHeight, typeInfo.title);
            cy += rowHeight;

            if (ctx.mouse.mouseDown && hot) {
                menuState.displayed = false;
                addNode(nodes, typeInfo, x, y);
            }
        }
    }

    menuHeight = cy - y + pad;
}