import { grid } from "./grid.js";
import { drawNodes, nodes } from "./nodes.js"
import { Context } from "./context.js"
import { checkStartConnecting, connect, portsCompatible, drawConnections } from "./connections.js";
import { run } from "./interpreter.js";
import { menu, menuState } from "./menu.js";
import { autosave } from "./serialization.js";

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
    ctx.newFrame();

    if (!state.currentOperation) {
        checkStartConnecting(ctx, state);

        if (state.currentOperation === null) {
            checkStartDragging(ctx);
        }
    }

    if (state.currentOperation === 'dragging') {
        drag(ctx);
    }
    else if (state.currentOperation === 'connecting') {
        connectingHitTest(ctx);
        connect(ctx, state);
    }
    else {
        if (!menuState.displayed && ctx.hitTestResult === null && ctx.mouse.mouseDown) {
            menuState.displayed = true;
            menuState.x = ctx.mouse.x;
            menuState.y = ctx.mouse.y;
        }
    }

    grid(ctx);
    
    run(ctx);

    drawConnections(ctx, state, nodes);
    drawNodes(ctx, state, nodes);
    menu(ctx);

    autosave();

    ctx.endFrame();

    // debug(ctx);
    ctx.requestRedraw();
}

function checkStartDragging(ctx) {
    if (ctx.mouse.mouseDown && ctx.hitTestResult && ctx.hitTestResult.type === 'node') {
        const node = ctx.hitTestResult.obj;
        state.currentOperation = 'dragging';
        state.dragging = {
            node,
            startMouse: {
                x: ctx.mouse.x,
                y: ctx.mouse.y,
            },
            startNode: {
                x: node.x,
                y: node.y,
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
        const node = state.dragging.node;
        node.x = state.dragging.startNode.x +
            (ctx.mouse.x - state.dragging.startMouse.x);
        node.y = state.dragging.startNode.y +
            (ctx.mouse.y - state.dragging.startMouse.y);
    }
}

function connectingHitTest(ctx) {
    if (ctx.hitTestResult && ctx.hitTestResult.type !== 'port') {
        let compatiblePort = null;
        if (ctx.hitTestResult.type === 'node') {
            const node = ctx.hitTestResult.obj;
            for (let i = 0; i < node.ports.length; i++) {
                const port = node.ports[i];
                if (portsCompatible(port, state.connecting.start)) {
                    if (compatiblePort !== null) {
                        // I already found a compatible port, so there is ambiguity
                        compatiblePort = null;
                        break;
                    }
                    compatiblePort = port;
                }
            }
        }
        if (compatiblePort) {
            ctx.hitTestResult.type = 'port';
            ctx.hitTestResult.obj = compatiblePort;
        } 
        else {
            ctx.hitTestResult = null;
        }
    }
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
                ctx.pixel(x, y, ctx.hitTestResult.obj && ctx.hitTestResult.obj.id === 1 ? 0x20ff0000 : 0x2000ff00);
            }
        }
    }
    ctx.hitTest = false;
    ctx.mouse = prevMouse;
    ctx.hitTestResult = prevResult;
}