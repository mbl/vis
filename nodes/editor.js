import { Context } from "./context.js";
import { distancePointToRectangle } from "./tools/distance.js";
import { CanvasInput } from "./canvasInput/CanvasInput.js";

/**
 * 
 * @param {Context} ctx 
 * @param {any} state To store information about current editing state
 * @param {function} value A function, when called with empty parameter, get value, when parameter is passed in, set value.
 * @param {number} id Id of the whatever object being edited
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {string} type What type are we editing
 */
export function valueEditor(ctx, state, id, value, x, y, w, h, type) {
    if(ctx.hitTestRect(x, y, w, h)) {
        ctx.recordHitTest('editor', id, 
            distancePointToRectangle(ctx.mouse, x, y, w, h),
            w * h
        );
    }
    
    const valueString = value(id).toString();

    if (ctx.hitTestResult && ctx.hitTestResult.type === 'editor' && ctx.hitTestResult.id === id) {
        ctx.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.2)');
    }
    else {
        ctx.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.1)');
    }

    if (state.editing && state.editing.portId === id) {
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
        state.editing.canvasInput.render();
        const stringValue = state.editing.canvasInput.value();
        if (type === 'float32') {
            value(id, Number.parseFloat(stringValue));
        }
        else {
            value(id, stringValue);
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
