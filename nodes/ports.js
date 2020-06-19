import { distancePointToRectangle } from './tools/distance.js';
import { Context } from "./context.js";
import { Node } from './nodes.js';

export class Port {
    /**
     * 
     * @param {Node} node
     * @param {PortType} type 
     * @param {Port} connectedTo 
     */
    constructor(node, type, connectedTo = null) {
        this.node = node;
        this.x = NaN;
        this.y = NaN;
        this.type = type;
        this.connectedTo = null; // For input
        this.numConnections = 0; // For output
        this.value = null;
    }
}

/**
 * @param {Context} ctx
 * @param {Port} port
 * @param {number} x Left
 * @param {number} y Top
 * @param {number} color How to color the port
 * @param {boolean} connected If true, display port as filled
 */
export function drawPort(ctx, port, x, y, color, connected) {
    port.x = x;
    port.y = y;
    const w = 15;
    const h = 15;
    if(ctx.hitTestRect(x, y, w, h)) {
        ctx.recordHitTest('port', port, 
            distancePointToRectangle(ctx.mouse, x, y, w, h),
            w * h
        );
    }

    let actualColor = color;

    if (ctx.hitTestResult && ctx.hitTestResult.type === 'port' && port === ctx.hitTestResult.obj) {
        // actualColor = 0xffffdd00;
        connected = true;
    }

    if (connected) {
        ctx.sprite(x, y, 'assets/Pin_connected_VarA.png', actualColor);
    }
    else {
        ctx.sprite(x, y, 'assets/Pin_disconnected_VarA.png', actualColor);
    }
    // ctx.drawText(x, y, 10, 10, portId.toString(), 'white', 10);
}
