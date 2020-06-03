import { ports } from './ports.js';
import { drawConnection } from './draw.js';

export function initConnections() {
    const allocated = 1000;
    
    return {
        /** How many nodes are being drawn */
        num: 0,

        /** How many nodes are allocated in the buffer now */
        allocated,

        /** port id where connection starts */
        from: new Uint32Array(allocated),

        /** port id where connection ends */
        to: new Uint32Array(allocated),
    }
}

/**
 * Allocate new node and return its index.
 */
export function allocateConnection(connections) {
    if (connections.num + 1 < connections.allocated) {
        return ++connections.num;
    }
    // TODO reallocate the buffers as needed
}

export function addConnection(connections, from, to) {
    const i = allocateConnection(connections);

    connections.from[i] = from;
    connections.to[i] = to;

    return i;
}

/**
 * @param {Context} ctx 
 */
export function drawConnections(ctx, state) {
    for (let i = 1; i <= connections.num; i++) {
        drawConnection(ctx, connections.from[i], connections.to[i]);
    }
    if (state.connecting) {
        if (state.connecting.end === -1) {
            ctx.drawLine(
                ctx.mouse.x, ctx.mouse.y, 
                ports.x[state.connecting.start],
                ports.y[state.connecting.start],
                'red',
                1);
        }
        else {
            if (state.connecting.startIsOutput) {
                drawConnection(ctx, state.connecting.start, state.connecting.end);
            }
            else {
                drawConnection(ctx, state.connecting.end, state.connecting.start);
            }
        }
    }
}

export const connections = initConnections();