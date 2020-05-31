import { grid } from "./grid.js";
import { drawNodes, nodes } from "./nodes.js"
import { Context } from "./context.js"
import { ports } from "./ports.js";

const state = {
    dragging: null,
}

/**
 * @param {Context} ctx Input context
 */
export function loop(ctx) {
    if (!state.dragging) {
        hitTest(ctx);
    }

    drag(ctx);

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

function drag(ctx) {
    if (ctx.mouse.mouseDown && ctx.hitTestResult && ctx.hitTestResult.type === 'node') {
        const nodeId = ctx.hitTestResult.id;
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
    if (ctx.mouse.mouseUp) {
        state.dragging = null;
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
    drawNodes(ctx, nodes);
    ctx.hitTest = false;
}

function draw(ctx) {
    grid(ctx);
    connections(ctx);
    drawNodes(ctx, nodes);
}

/**
 * @param {Context} ctx 
 */
function connections(ctx) {
    for (let i = 1; i <= ports.num; i+=2) {
        const offset = 30;

        ctx.drawLine(
            ports.x[i],
            ports.y[i],
            ports.x[i] - offset,
            ports.y[i],
            'white',
            3
        );

        ctx.drawLine(
            ports.x[i + 1],
            ports.y[i + 1],
            ports.x[i + 1] - offset,
            ports.y[i + 1],
            'white',
            3
        );

        ctx.drawLine(
            ports.x[i] - offset,
            ports.y[i],
            ports.x[i + 1] - offset,
            ports.y[i + 1],
            'white',
            3
        );
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
            drawNodes(ctx, nodes);
            if (ctx.hitTestResult) {
                ctx.pixel(x, y, ctx.hitTestResult.id === 1 ? 0x20ff0000 : 0x2000ff00);
            }
        }
    }
    ctx.hitTest = false;
    ctx.mouse = prevMouse;
    ctx.hitTestResult = prevResult;
}