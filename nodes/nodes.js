/**
 * Describes all the nodes in the scene
 */

import { node } from "./node.js";

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
 */
export function addNode(nodes, type, x, y, w, h, color, title) {
    const i = allocateNode(nodes);

    nodes.x[i] = x;
    nodes.y[i] = y;
    nodes.w[i] = w;
    nodes.h[i] = h;
    nodes.color[i] = color;
    nodes.title[i] = title;

    return i;
}

// Information about all the nodes being displayed
export function drawNodes(ctx, nodes) {
    for(let i = 1; i <= nodes.num; i++) {
        node(ctx, 
            i,
            nodes.x[i], nodes.y[i], nodes.w[i], nodes.h[i], 
            nodes.color[i],
            false);
    }
}