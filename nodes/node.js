import { Context } from './context.js';
import { distancePointToRectangle } from './tools/distance.js';
import { ports } from './ports.js';

/**
 * 
 * @param {Context} ctx 
 * @param {number} id Node id
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {number} color
 * @param {boolean} selected
 */
export function node(ctx, id, x, y, w, h, color, selected=false) {
    const titleHeight = 30;

    if(ctx.hitTestRect(x, y, w, h)) {
        ctx.recordHitTest('node', id, 
            distancePointToRectangle(ctx.mouse, x, y, w, h),
            w * h
        );
    }

    if (selected || 
        (ctx.hitTestResult && 
            ctx.hitTestResult.type === 'node' && 
            ctx.hitTestResult.id === id
            )
        ) {
        ctx.nineSlicePlane(x - 13, y - 13, w + 26, h + 26, 'assets/RegularNode_shadow_selected.png', 21, 21, 21, 21);
    }
    else {
        ctx.nineSlicePlane(x - 13, y - 13, w + 26, h + 26, 'assets/RegularNode_shadow.png', 21, 21, 21, 21);
    }
    ctx.nineSlicePlane(x, y, w, h, 'assets/RegularNode_body.png', 14, 14, 14, 14);
    ctx.nineSlicePlane(x, y, w, titleHeight, 'assets/RegularNode_title_gloss.png', 7, 7, 7, 7);
    ctx.nineSlicePlane(x, y, w, titleHeight, 'assets/RegularNode_title_highlight.png', 7, 7, 7, 7);
    ctx.nineSlicePlane(x, y, w, titleHeight, 'assets/RegularNode_color_spill.png', 6, 6, 1, 1, color);

    for (let i = 1; i <= ports.num; i++) { // TODO fix this is insane
        if (ports.nodeId[i] === id) {
            const px = x + 10;
            const py = y + 60 + Math.sin(id * Math.PI + ctx.time / 300.0) * 20;
            ctx.positionPort(i, px + 7.5, py + 5.5);
            ctx.sprite(px, py, 'assets/Pin_connected_VarA.png');
        }
    }
}