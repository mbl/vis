import { Node } from './nodes.js';
import { Port } from './ports.js';
import { Context } from './context.js';
import { lerp, bezier } from './tools/math.js';

/**
 * 
 * @param {Port} from 
 * @param {Port} to 
 */
export function addConnection(from, to) {
    function add(f, t) {
        if (f && t && !t.connectedTo) {
            t.connectedTo = f;
            f.numConnections++;
        }    
    }

    if (from && from.type.output) {
        add(from, to);
    }
    else {
        add(to, from);
    }
}

/**
 * 
 * @param {Port} from 
 * @param {Port} to 
 */
export function removeConnection(from, to) {
    if (to.connectedTo === from) {
        to.connectedTo = null;
        from.numConnections--;
    }
}

/**
 * 
 * @param {Node} node 
 * @param {Node[]} nodes
 */
export function removeConnections(node, nodes) {
    node.ports.forEach(
        (port) => {
            if (port.connectedTo) {
                removeConnection(port.connectedTo, port);
            }
        }
    )

    nodes.forEach((n) => {
        n.ports.forEach((p) => {
            if (p.connectedTo && p.connectedTo.node === node) {
                removeConnection(p.connectedTo, p);
            }
        });
    });
}

/**
 * Draw all existing connections including the one being currently created.
 * 
 * @param {Context} ctx 
 * @param {*} state
 * @param {Node[]} nodes
 */
export function drawConnections(ctx, state, nodes) {
    nodes.forEach((node) => {
        node.ports.forEach((port) => {
            if (port.connectedTo) {
                drawConnection(ctx, port.connectedTo, port);
            }
        });
    })
    if (state.connecting) {
        if (state.connecting.end === null) {
            ctx.drawLine(
                ctx.mouse.x, ctx.mouse.y, 
                state.connecting.start.x, state.connecting.start.y,
                'red',
                1);
        }
        else {
            if (state.connecting.start.type.output) {
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
        const port = ctx.hitTestResult.obj;

        if (port.connectedTo) {
            state.connecting = {
                start: port.connectedTo,
                end: port,
            };
            removeConnection(port.connectedTo, port);
        }
        else {
            state.connecting = {
                start: port,
                end: null,
            };
        }
    }
}

/** 
 * Can two ports be connected to each other?
 * 
 * @param {Port} port1
 * @param {Port} port2
 */
export function portsCompatible(port1, port2) {
    // TODO: typecheck
    return port1.type.output !== port2.type.output;
}

/**
 * 
 * @param {Context} ctx 
 */
export function connect(ctx, state) {
    if (ctx.hitTestResult && ctx.hitTestResult.type === 'port' &&
        portsCompatible(ctx.hitTestResult.obj, state.connecting.start)
    ) {
        state.connecting.end = ctx.hitTestResult.obj;
    }
    else {
        state.connecting.end = null;
    }

    if (ctx.mouse.mouseUp) {
        addConnection(state.connecting.start, state.connecting.end);

        state.connecting = null;
        state.currentOperation = null;
    }
}

/** 
 * Draws a single connection between two ports.
 * @param {Context} ctx
 * @param {Port} portFrom
 * @param {Port} portTo
 */
export function drawConnection(ctx, portFrom, portTo) {
    const p1 = portFrom;
    const p2 = portTo;

    // Weird heuristic attempting to make the result look good
    // TODO: still not optimal, improve!
    let dx = p2.x - p1.x; // Delta x
    
    if (Math.abs(dx) < 1e-3) {
        dx = Math.sign(dx) * 1e-3;
    }

    let dy = Math.abs(p2.y - p1.y);
    const h0 = Math.abs(dx) / 3.0; // Overhang if dy===0
    const h100 = 40; // "overhang" in pixels if dy > 100
    const h = lerp(h0, h100, Math.min(dy / 100.0, 1));
    const offsetA = Math.max(Math.min(dx / 2, h * 4), h * 2);

    // Experimental values that roughly approximate exact solution to compute overhang based on offset
    // hRel ~= (0.2979 * x + 0.1398)
    // hRel ~= (0.0686 * x + 0.4438)

    const x1 = (h - 0.1398 * dx) / 0.2979;
    const x2 = (h - 0.4438 * dx) / 0.0686;
    
    const offsetB = Math.min(x1, x2);
    
    const offset = Math.max(offsetA, offsetB);

    let color = 'white';
    if (ctx.hitTestResult && ctx.hitTestResult.type === 'port') {
        if(ctx.hitTestResult.obj === portTo) {
            color = 'green';
        } 
        else if (ctx.hitTestResult.obj === portFrom) {
            color = 'red';
        }
        if (color !== 'white') {
            const t = (ctx.time % 1000) / 1000.0;

            const point = bezier(
                t,
                p1, 
                { x: p1.x + offset, y: p1.y }, 
                { x: p2.x - offset, y: p2.y },
                p2);

            ctx.drawRect(point.x - 3, point.y - 3, 7, 7, color);
        }
    }
    
    ctx.drawBezier(
        p1.x, p1.y,
        p1.x + offset, p1.y,
        p2.x - offset, p2.y,
        p2.x, p2.y,
        color,
        3
    );
}