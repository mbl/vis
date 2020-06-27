/**
 * Describes all the nodes in the scene
 */

import { drawPort, Port } from "./ports.js";
import { getType } from "./types.js";
import { distancePointToRectangle } from "./tools/distance.js"; 
import { moveTo } from "./tools/math.js";
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
        this.w = 0;
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
        for (let p = 0; p < this.ports.length; p++) {
            const port = this.ports[p];
            if(port.type.label === label) {
                return port;
            }
        }
        return null;
    }

    /**
     * 
     * @param {*} label 
     */
    getPortValue(label) {
        const port = this.findPortByLabel(label);
        const sourcePort = port.connectedTo;
        if (sourcePort) {
            return sourcePort.value;
        }
        return port.value;
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

        let nodeWidth = ctx.getTextWidth(this.type.title) + 20 + 10;
        let cy = y + titleHeight;
        const portPad = 8;
        const labelPad = portPad;
        const editorPad = 2;
        const portWidth = 10;
        const editorWidth = 40;
        for (let portNum = 0; portNum < this.ports.length; portNum++) {
            let cx = x;
            const port = this.ports[portNum];
            if (!port.type.output) {
                // Input port
                cx += portPad;
                drawPort(ctx, port, cx, cy + 7, 0xffcce00e, !!port.connectedTo);
                cx += portWidth + portPad;
                const textWidth = ctx.getTextWidth(port.type.label) + editorPad;
                ctx.drawText(cx, cy, textWidth, portHeight, port.type.label);
                cx += textWidth;
                if (!port.connectedTo) {
                    ctx.inputText(port, cx, cy, editorWidth, portHeight, port.type.type);
                    cx += editorWidth;
                    cx += editorPad;
                }
            }
            else {
                // Output port
                cx += labelPad;
                // Display value if possible, also add editor
                const textWidth = ctx.getTextWidth(port.type.label);
                if (port.type.editor) {
                    ctx.drawText(cx, cy, textWidth, portHeight, port.type.label);
                    cx += textWidth;
                    ctx.inputText(port, cx, cy, editorWidth, portHeight, port.type.type);
                    cx += editorWidth;
                }
                else {
                    ctx.drawText(cx, cy, textWidth, portHeight, port.type.label);
                    cx += textWidth;
                }
                // Output port
                drawPort(ctx, port, x + w - portWidth - portPad, cy + 7, 0xffcce00e, !!port.numConnections);
                cx += portWidth + portPad * 2;
            }
            cy += portHeight;
            nodeWidth = Math.max(nodeWidth, cx - x);
        }
        if (this.w === 0) {
            this.w = nodeWidth;
        }        
        this.w = moveTo(this.w, nodeWidth, 5);

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