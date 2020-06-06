import { ports } from './ports.js';

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

export function findConnection(connections, from, to) {
    for (let i = 1; i <= connections.num; i++) {
        if (connections.from[i] === from && connections.to[i] === to) {
            return i;
        }
    }
    return 0;
}

export function addConnection(connections, from, to) {
    let i = findConnection(connections, from, to);

    if (!i) {
        i = allocateConnection(connections);

        connections.from[i] = from;
        connections.to[i] = to;
    }

    return i;
}

/**
 * Draw all existing connections including the one being currently created.
 * 
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

export function checkStartConnecting(ctx, state) {
    if (ctx.mouse.mouseDown && ctx.hitTestResult && ctx.hitTestResult.type === 'port') {
        state.currentOperation = 'connecting';
        const portId = ctx.hitTestResult.id;

        state.connecting = {
            start: portId,
            end: -1,
            startIsOutput: ports.output[portId],
        };
    }
}

/** 
 * Can two ports be connected to each other?
 */
export function portsCompatible(port1, port2) {
    // TODO: typecheck
    return ports.output[port1] !== ports.output[port2];
}

/**
 * 
 * @param {Context} ctx 
 */
export function connect(ctx, state) {
    if (ctx.hitTestResult && ctx.hitTestResult.type === 'port' &&
        portsCompatible(ctx.hitTestResult.id, state.connecting.start)
    ) {
        state.connecting.end = ctx.hitTestResult.id;
    }
    else {
        state.connecting.end = -1;
    }

    if (ctx.mouse.mouseUp) {
        if (state.connecting.end !== -1) {
            if (state.connecting.startIsOutput) {
                addConnection(connections, state.connecting.start, state.connecting.end);
            }
            else {
                addConnection(connections, state.connecting.end, state.connecting.start);
            }
        }

        state.connecting = null;
        state.currentOperation = null;
    }
}

/**
 * @param {number} portId 
 * @return True if port is connected to anything.
 */
export function isPortConnected(portId) {
    for (let i = 1; i <= connections.num; i++) {
        if (connections.from[i] === portId || connections.to[i] === portId) {
            return true;
        }
    }
    return false;
}

export const connections = initConnections();

/** 
 * Draws a single connection between two ports.
 */
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