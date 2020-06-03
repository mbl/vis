import { Context } from './context.js';
import { distancePointToRectangle } from './tools/distance.js';
import { ports } from './ports.js';

export const titleHeight = 30;
export const portHeight = 25;

/**
 * Draws a shaded box with a title bar and optionally highlighted
 * rectangle around it.
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
export function drawBox(ctx, id, x, y, w, h, color, selected=false, label='') {
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

    ctx.drawText(x + 20, y + 20, label);
}

/**
 * @param {Context} ctx 
 */
export function drawPort(ctx, nodeId, portId, x, y, color, connected) {
    ctx.positionPort(portId, x + 7.5, y + 5.5);

    if (connected) {
        ctx.sprite(x, y, 'assets/Pin_connected_VarA.png', color);
    }
    else {
        ctx.sprite(x, y, 'assets/Pin_disconnected_VarA.png', color);
    }
}

export function drawConnection(ctx, portFromId, portToId) {
    const p1 = portFromId;
    const p2 = portToId;

    // Weird heuristic attempting to make the result look good
    let dx = ports.x[p2] - ports.x[p1]; // Delta x
    if (Math.abs(dx) < 1e-3) {
        dx = Math.sign(dx) * 1e-3;
    }

    const h = 40; // "overhang" in pixels
    const offsetA = Math.max(Math.min(dx / 2, h * 4), h * 2);

    // Experimental values that roughly approximate exact solution to compute overhang based on offset
    // hRel ~= (0.2979 * x + 0.1398)
    // hRel ~= (0.0686 * x + 0.4438)

    const x1 = (h - 0.1398 * dx) / 0.2979;
    const x2 = (h - 0.4438 * dx) / 0.0686;
    
    const offsetB = Math.min(x1, x2);
    
    const offset = Math.max(offsetA, offsetB);
    
    ctx.drawBezier(
        ports.x[p1], ports.y[p1],
        ports.x[p1] + offset, ports.y[p1],
        ports.x[p2] - offset, ports.y[p2],
        ports.x[p2], ports.y[p2],
        'white',
        3
    );
}