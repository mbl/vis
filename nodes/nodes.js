/**
 * Describes all the nodes in the scene
 */

import { drawBox, drawPort, titleHeight, portHeight } from "./draw.js";
import { ports, addPort } from "./ports.js";
import { getType, types } from "./types.js";

export const nodes = initNodes();  

export function initNodes() {
    const allocated = 1000;
    
    return {
        /** How many nodes are being drawn */
        num: 0,
        /** How many nodes are allocated in the buffer now */
        allocated,

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
    const typeId = getType(type);
    const typeInfo = types[typeId];
    
    const nodeId = allocateNode(nodes);

    nodes.x[nodeId] = x;
    nodes.y[nodeId] = y;
    nodes.w[nodeId] = typeInfo.w;
    nodes.h[nodeId] = titleHeight + typeInfo.ports.length * portHeight;
    nodes.color[nodeId] = typeInfo.color;
    nodes.title[nodeId] = typeInfo.title;

    for(let portId = 0; portId < typeInfo.ports.length; portId++) {
        const pi = typeInfo.ports[portId];
        addPort(ports, nodeId, portId, pi.output, pi.label, pi.type);
    }

    return nodeId;
}

export function node(ctx, nodeId) {
    const x = nodes.x[nodeId];
    const y = nodes.y[nodeId];
    const w = nodes.w[nodeId];
    const h = nodes.h[nodeId];

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
            const py = y + titleHeight + portNum * portHeight + 7; // + Math.sin(nodeId * Math.PI + ctx.time / 300.0) * 20;
            portNum++;
            if (!ports.output[portId]) {
                drawPort(ctx, nodeId, portId, x + 8, py, 0xffcce00e, false);
                ctx.drawText(x + 25, py + 9, ports.label[portId]);
            }
            else {
                drawPort(ctx, nodeId, portId, x + w - 22, py, 0xffcce00e, false);
                ctx.drawText(x + 8, py + 9, ports.label[portId]);
            }
        }
    }
}

// Information about all the nodes being displayed
export function drawNodes(ctx, nodes) {
    for(let i = 1; i <= nodes.num; i++) {
        node(ctx, i);
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