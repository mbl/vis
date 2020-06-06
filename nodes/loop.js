import { grid } from "./grid.js";
import { drawNodes, nodes } from "./nodes.js"
import { Context } from "./context.js"
import { ports } from "./ports.js";
import { addConnection, connections, checkStartConnecting, connect, portsCompatible, drawConnections } from "./connections.js";
import { checkStartEditing } from "./editor.js";

const state = {
    currentOperation: null,

    dragging: null,
    connecting: null,
    editing: null,
}

/**
 * @param {Context} ctx Input context
 */
export function loop(ctx) {
    if (!state.currentOperation) {
        hitTest(ctx);

        checkStartConnecting(ctx, state);

        if (state.currentOperation === null) {
            checkStartDragging(ctx);
        }

        checkStartEditing(ctx, state);
    }

    if (state.currentOperation === 'dragging') {
        drag(ctx);
    }
    else if (state.currentOperation === 'connecting') {
        connectingHitTest(ctx);
        connect(ctx, state);
    }

    layout(ctx);

    draw(ctx);

    // debug(ctx);

    ctx.mouse.mouseDown = false;
    ctx.mouse.mouseUp = false;

    ctx.requestRedraw();
}

function layout(ctx) {
    ctx.layout = true;
    draw(ctx);
    ctx.layout = false;
}

function checkStartDragging(ctx) {
    if (ctx.mouse.mouseDown && ctx.hitTestResult && ctx.hitTestResult.type === 'node') {
        const nodeId = ctx.hitTestResult.id;
        state.currentOperation = 'dragging';
        state.dragging = {
            nodeId,
            startMouse: {
                x: ctx.mouse.x,
                y: ctx.mouse.y,
            },
            startNode: {
                x: nodes.x[nodeId],
                y: nodes.y[nodeId],
            }
        };
    }
}

function drag(ctx) {
    if (ctx.mouse.mouseUp) {
        state.dragging = null;
        state.currentOperation = null;
    }
    if (state.dragging) {
        const nodeId = state.dragging.nodeId;
        nodes.x[nodeId] = state.dragging.startNode.x +
            (ctx.mouse.x - state.dragging.startMouse.x);
        nodes.y[nodeId] = state.dragging.startNode.y +
            (ctx.mouse.y - state.dragging.startMouse.y);
    }
}

function hitTest(ctx) {
    ctx.hitTest = true;
    ctx.hitTestResult = null;
    drawNodes(ctx, state, nodes);
    ctx.hitTest = false;
}

function connectingHitTest(ctx) {
    hitTest(ctx);

    if (ctx.hitTestResult && ctx.hitTestResult.type !== 'port') {
        let compatiblePortId = 0;
        if (ctx.hitTestResult.type === 'node') {
            for (let i=1; i <= ports.num; i++) {
                if (ports.nodeId[i] === ctx.hitTestResult.id) {
                    if (portsCompatible(i, state.connecting.start)) {
                        if (compatiblePortId !== 0) {
                            // I already found a compatible port, so there is ambiguity
                            compatiblePortId = 0;
                            break;
                        }
                        compatiblePortId = i;
                    }
                }
            }
        }
        if (compatiblePortId) {
            ctx.hitTestResult.type = 'port';
            ctx.hitTestResult.id = compatiblePortId;
        } 
        else {
            ctx.hitTestResult = null;
        }
    }
}

function draw(ctx) {
    grid(ctx);
    drawConnections(ctx, state);
    drawNodes(ctx, state, nodes);
}

function debug(ctx) {
    const prevMouse = { ...ctx.mouse };
    const prevResult = ctx.hitTestResult;
    ctx.hitTest = true;
    for (let y = 0; y < 600; y++) {
        ctx.mouse.y = y;
        for (let x = 0; x < 1000; x++) {
            ctx.mouse.x = x;
            ctx.hitTestResult = null;
            drawNodes(ctx, state, nodes);
            if (ctx.hitTestResult) {
                ctx.pixel(x, y, ctx.hitTestResult.id === 1 ? 0x20ff0000 : 0x2000ff00);
            }
        }
    }
    ctx.hitTest = false;
    ctx.mouse = prevMouse;
    ctx.hitTestResult = prevResult;
}