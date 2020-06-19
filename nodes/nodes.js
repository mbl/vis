/**
 * Describes all the nodes in the scene
 */

import { drawPort, Port } from "./ports.js";
import { getType } from "./types.js";
import { distancePointToRectangle } from "./tools/distance.js"; 
import { removeConnections } from "./connections.js";
import { Context } from "./context.js";
import { NodeType } from "./types.js";

export const nodes = [];

export class Node {
    /**
     * @param {NodeType} type 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(type, x, y) {
        this.id = -1;
        this.type = type;
        this.x = x;
        this.y = y;
        this.w = type.w;
        this.h = 0;
        this.color = 0;
        this.ports = [];
        type.ports.forEach((port) => {
            this.ports.push(new Port(this, port, null));
        });
    }

    /**
     * Get port of given name
     * @param {string} label 
     */
    findPortByLabel(label) {
        const typeInfo = this.type;
    
        for (let p = 0; p < this.ports.length; p++) {
            const port = this.ports[p];
            if(port.type.label === label) {
                return port;
            }
        }
        return null;
    }

    getPortValue(label) {
        const port = this.findPortByLabel(label);
        const sourcePort = port.connectedTo;
        if (sourcePort) {
            return sourcePort.value;
        }
        return undefined;
    }

    /**
     * 
     * @param {Node[]} nodes 
     */
    deleteNode(nodes) {
        removeConnections(this, nodes);
        const index = nodes.findIndex(n => n === this);
        if (index === -1) {
            throw new Error('Node not in nodes');
        }
        nodes.splice(index, 1);
    }

    /**
     * Was this node hittested in the previous frame.
     * @param {Context} ctx 
     */
    hot(ctx) {
        return (ctx.hitTestResult &&
            ctx.hitTestResult.type === 'node' &&
            ctx.hitTestResult.obj === this);
    }

    /**
     * @param {Context} ctx
     */
    draw(ctx, state) {
        const hot = this.hot(ctx);
        if (hot && ctx.keyboard.keyCode === 46) {
            this.deleteNode(nodes);
            return;
        }

        const typeInfo = this.type;

        const x = this.x;
        const y = this.y;
        const w = this.w;
        const h = this.h;

        if(ctx.hitTestRect(x, y, w, h)) {
            ctx.recordHitTest('node', this, 
                distancePointToRectangle(ctx.mouse, x, y, w, h),
                w * h
            );
        }

        drawBox(ctx, 
            x, y, w, h, 
            this.type.color,
            hot,
            this.type.title);

        let cy = y + titleHeight;
        for (let portNum = 0; portNum < this.ports.length; portNum++) {
            const port = this.ports[portNum];
            if (!port.type.output) {
                // Input port
                drawPort(ctx, port, x + 8, cy + 7, 0xffcce00e, !!port.connectedTo);
                ctx.drawText(x + 25, cy, w - 25, portHeight, port.type.label);
            }
            else {
                // Output port
                drawPort(ctx, port, x + w - 22, cy + 7, 0xffcce00e, !!port.numConnections);
                // Display value if possible, also add editor
                if (port.type.editor) {
                    ctx.drawText(x + 8, cy, 40 - 8, portHeight, port.type.label);
                    ctx.inputText(port, x + 40, cy, w - 40 - 25, portHeight, port.type.type);
                }
                else {
                    ctx.drawText(x + 8, cy, w - 25, portHeight, port.type.label);
                }
            }
            cy += portHeight;
        }

        this.h = cy - y;

        if (this.type.preview) {
            const pH = this.type.preview.height;
            ctx.clip(x + 3, y + h - pH + 3, w - 6, pH - 6);
            typeInfo.preview.draw(this, ctx, x + 3, y + h - pH + 3, w - 6, pH - 6);
            ctx.unclip();
            this.h += pH;
        }
    }
}

/**
 * Register a node, return its index
 * @param {NodeType} type Type of the node
 */
export function addNode(nodes, type, x, y) {
    const node = new Node(type, x, y);
    nodes.push(node);
    return node;
}

export const titleHeight = 30;
export const portHeight = 25;

/**
 * Draws a shaded box with a title bar and optionally highlighted
 * rectangle around it.
 * 
 * @param {Context} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {number} color
 * @param {boolean} selected
 */
export function drawBox(ctx, x, y, w, h, color, selected=false, label='') {
    if (selected) {
        ctx.nineSlicePlane(x - 13, y - 13, w + 26, h + 26, 'assets/RegularNode_shadow_selected.png', 21, 21, 21, 21);
    }
    else {
        ctx.nineSlicePlane(x - 13, y - 13, w + 26, h + 26, 'assets/RegularNode_shadow.png', 21, 21, 21, 21);
    }
    ctx.nineSlicePlane(x, y, w, h, 'assets/RegularNode_body.png', 14, 14, 14, 14);
    ctx.nineSlicePlane(x, y, w, titleHeight, 'assets/RegularNode_title_gloss.png', 7, 7, 7, 7);
    ctx.nineSlicePlane(x, y, w, titleHeight, 'assets/RegularNode_title_highlight.png', 7, 7, 7, 7);
    ctx.nineSlicePlane(x, y, w, titleHeight, 'assets/RegularNode_color_spill.png', 6, 6, 1, 1, color);

    ctx.drawText(x + 20, y + 3, w - 20, titleHeight - 3, label);
}


/**
 * Information about all the nodes being displayed 
 * 
 * @param {Context} ctx
 * @param {*} state
 * @param {Node[]} nodes
 */ 
export function drawNodes(ctx, state, nodes) {
    nodes.forEach(node => node.draw(ctx, state));
}