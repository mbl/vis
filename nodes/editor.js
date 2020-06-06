import { Context } from "./context.js";
import { ports } from "./ports.js";
import { distancePointToRectangle } from "./tools/distance.js";
import { CanvasInput } from "./canvasInput/CanvasInput.js";

/**
 * 
 * @param {Context} ctx 
 * @param {number} portId 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 */
export function valueEditor(ctx, state, portId, x, y, w, h) {
    if(ctx.hitTestRect(x, y, w, h)) {
        ctx.recordHitTest('editor', portId, 
            distancePointToRectangle(ctx.mouse, x, y, w, h),
            w * h
        );
    }
    
    const value = ports.value[portId];
    const valueString = value.toString();

    if (ctx.hitTestResult && ctx.hitTestResult.type === 'editor' && ctx.hitTestResult.id === portId) {
        ctx.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.2)');
    }
    else {
        ctx.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.1)');
    }

    if (state.editing && state.editing.portId === portId) {
        if (!state.editing.canvasInput) {
            const canvasInput = new CanvasInput(
                {
                    canvas: ctx.canvas,
                    x,
                    y,
                    width: w,
                    height: h,
                    value: valueString,
                    boxShadow: 'none',
                    innerShadow: 'none',
                    fontSize: 12,
                    fontColor: 'lime',
                    padding: 0,
                    borderWidth: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    selectionColor: 'rgba(0, 255, 0, 0.2)',
                }
            );
            canvasInput._mouseDown = true;
            canvasInput.focus(null);
            canvasInput.selectText();
            state.editing.canvasInput = canvasInput;
        }
        if (ctx.isDrawing()) {
            state.editing.canvasInput.render();
            ports.value[state.editing.portId] = state.editing.canvasInput.value();
        }
    }
    else {
        ctx.drawText(x, y, w, h, valueString, 'lime');
    }
}

/**
 * @param {Context} ctx
 * @param {any} state
 */
export function checkStartEditing(ctx, state) {
    if (ctx.mouse.mouseDown) {
        if (ctx.hitTestResult && ctx.hitTestResult.type === 'editor') {
            const portId = ctx.hitTestResult.id;
            if (state.editing && state.editing.portId !== portId) {
                stopEditing(state);
            }
        }
        else {
            stopEditing(state);
        }
    }
    if (ctx.mouse.mouseUp) {
        if (ctx.hitTestResult && ctx.hitTestResult.type === 'editor') {
            const portId = ctx.hitTestResult.id;
            if (!state.editing) {
                state.editing = {
                    portId,
                    canvasInput: null,
                }
            }
        }
    }
}

function stopEditing(state) {
    if (state.editing && state.editing.canvasInput) {
        state.editing.canvasInput.destroy();
    }
    state.editing = null;
}
