import { Context } from "./context.js";
import { distancePointToRectangle } from "./tools/distance.js";
import { CanvasInput } from "./canvasInput/CanvasInput.js";
import { Port } from "./ports.js";

/**
 * 
 * @param {Context} ctx 
 * @param {any} state To store information about current editing state
 * @param {{ value: any }} obj Object whose value is being edited
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} type What type are we editing
 */
export function valueEditor(ctx, state, obj, x, y, w, h, type) {
    if(ctx.hitTestRect(x, y, w, h)) {
        ctx.recordHitTest('editor', obj, 
            distancePointToRectangle(ctx.mouse, x, y, w, h),
            w * h
        );
    }
    
    const valueString = obj.value !== null ? obj.value.toString() : 'null';

    if (ctx.hitTestResult && ctx.hitTestResult.type === 'editor' && ctx.hitTestResult.obj === obj) {
        ctx.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.1)');
    }
    else {
        // ctx.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.1)');
    }``

    if (state.editing && state.editing.port === obj) {
        if (!state.editing.canvasInput) {
            const canvasInput = new CanvasInput(
                {
                    ctx,
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
        state.editing.canvasInput.render();
        const stringValue = state.editing.canvasInput.value();
        if (type === 'float32' || type === 'float32[]') {
            obj.value = Number.parseFloat(stringValue);
        }
        else {
            obj.value = stringValue;
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
            const port = ctx.hitTestResult.obj;
            if (state.editing && state.editing.port !== port) {
                stopEditing(state);
            }
        }
        else {
            stopEditing(state);
        }
    }
    if (ctx.mouse.mouseUp) {
        if (ctx.hitTestResult && ctx.hitTestResult.type === 'editor') {
            const port = ctx.hitTestResult.obj;
            if (!state.editing) {
                state.editing = {
                    port,
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
