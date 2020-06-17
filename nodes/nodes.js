/**
 * Describes all the nodes in the scene
 */

import { ports, addPort, drawPort, portValue } from "./ports.js";
import { getType, types } from "./types.js";
import { distancePointToRectangle } from "./tools/distance.js"; 
import { connectedTo, removeConnections } from "./connections.js";
import { Context } from "./context.js";

export const nodes = initNodes();  

export function initNodes() {
    const allocated = 1000;
    
    return {
        /** How many nodes are being drawn */
        num: 0,

        /** How many nodes are deleted */
        numDeleted: 0,

        /** How many nodes are allocated in the buffer now */
        allocated,

        /**
         * When nonzero, this node is deleted.
         */
        deleted: new Int8Array(allocated),

        // Type of the node - registered in an enum of types
        type: new Int32Array(allocated),

        // Position and size
        x: new Float32Array(allocated),
        y: new Float32Array(allocated),
        w: new Float32Array(allocated),
        h: new Float32Array(allocated),

        // Main color
        color: new Int32Array(allocated),

        // Title of the node
        title: new Array(allocated),
    }
}

/**
 * Allocate new node and return its index.
 */
export function allocateNode(nodes) {
    if (nodes.numDeleted > 0) {
        for(let i=1; i<=nodes.num; i++) {
            if (nodes.deleted[i]) {
                nodes.deleted[i] = 0;
                nodes.numDeleted--;
                return i;
            }
        }
    }

    if (nodes.num + 1 < nodes.allocated) {
        return ++nodes.num;
    }
    // TODO reallocate the buffers as needed
}

/**
 * Register a node, return its index
 * @param {string} type Type of the node
 */
export function addNode(nodes, type, x, y) {    
    const nodeId = allocateNode(nodes);
    return addNodeWithId(nodes, nodeId, type, x, y);
}

export function addNodeWithId(nodes, nodeId, type, x, y) {
    const typeId = getType(type);
    const typeInfo = types[typeId];

    nodes.x[nodeId] = x;
    nodes.y[nodeId] = y;
    nodes.w[nodeId] = typeInfo.w;
    nodes.h[nodeId] = titleHeight + 
        typeInfo.ports.length * portHeight +
        (typeInfo.preview ? typeInfo.preview.height : 0);
    nodes.color[nodeId] = typeInfo.color;
    nodes.title[nodeId] = typeInfo.title;
    nodes.type[nodeId] = typeId;

    for(let portId = 0; portId < typeInfo.ports.length; portId++) {
        const pi = typeInfo.ports[portId];
        addPort(ports, nodeId, portId, pi.output, pi.label, pi.type, pi.defaultValue);
    }

    return nodeId;
}

export function deleteNode(nodes, nodeId) {
    nodes.deleted[nodeId] = 1;
    removeConnections(nodeId);
}

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
    if (selected || hot(ctx, id)) {
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
 * Was this node hittested in the previous frame.
 * @param {Context} ctx 
 * @param {number} nodeId 
 */
function hot(ctx, nodeId) {
    return (ctx.hitTestResult &&
        ctx.hitTestResult.type === 'node' &&
        ctx.hitTestResult.id === nodeId);
}

/**
 * @param {Context} ctx
 * @param {number} nodeId
 */
export function node(ctx, state, nodeId) {
    if (nodes.deleted[nodeId]) {
        return;
    }

    if (hot(ctx, nodeId) && ctx.keyboard.keyCode === 46) {
        deleteNode(nodes, nodeId);
        return;
    }

    const typeId = nodes.type[nodeId];
    const typeInfo = types[typeId];

    const x = nodes.x[nodeId];
    const y = nodes.y[nodeId];
    const w = nodes.w[nodeId];
    const h = nodes.h[nodeId];

    if(ctx.hitTestRect(x, y, w, h)) {
        ctx.recordHitTest('node', nodeId, 
            distancePointToRectangle(ctx.mouse, x, y, w, h),
            w * h
        );
    }

    drawBox(ctx, 
        nodeId,
        x, y, w, h, 
        nodes.color[nodeId],
        false,
        nodes.title[nodeId]);

    // TODO fix this is insane
    let portNum = 0;
    for (let portId = 1; portId <= ports.num; portId++) {
        if (ports.nodeId[portId] === nodeId) {
            const py = y + titleHeight + portNum * portHeight; // + Math.sin(nodeId * Math.PI + ctx.time / 300.0) * 20;
            portNum++;
           if (!ports.output[portId]) {
                // Input port
                drawPort(ctx, portId, x + 8, py + 7, 0xffcce00e, !!connectedTo(portId));
                ctx.drawText(x + 25, py, w - 25, portHeight, ports.label[portId]);
            }
            else {
                // Output port
                drawPort(ctx, portId, x + w - 22, py + 7, 0xffcce00e, !!ports.numConnections[portId]);
                // Display value if possible, also add editor
                const portTypeInfo = typeInfo.ports[ports.order[portId]];
                if (portTypeInfo.editor) {
                    ctx.drawText(x + 8, py, 40 - 8, portHeight, ports.label[portId]);
                    ctx.inputText(portId, portValue, x + 40, py, w - 40 - 25, portHeight, portTypeInfo.type);
                }
                else {
                    ctx.drawText(x + 8, py, w - 25, portHeight, ports.label[portId]);
                }
            }
        }
    }

    if (typeInfo.preview) {
        const pH = typeInfo.preview.height;
        ctx.clip(x + 3, y + h - pH + 3, w - 6, pH - 6);
        typeInfo.preview.draw(nodeId, ctx, x + 3, y + h - pH + 3, w - 6, pH - 6);
        ctx.unclip();
    }
}

// Information about all the nodes being displayed
export function drawNodes(ctx, state, nodes) {
    for(let i = 1; i <= nodes.num; i++) {
        node(ctx, state, i);
    }
}

export function getNodePorts(nodeId) {
    const result = []; // TODO figure out an iterator that does not alloc

    for (let i = 1; i <= ports.num; i++) {
        if (ports.nodeId[i] === nodeId) {
            result.push(i);
        }
    }

    return result;
}

export function removePorts(nodeId) {
    const nodePorts = getNodePorts(nodeId);
    for (let i=0; i<nodePorts.length; i++) {
        removePort(ports, i);
    }
}