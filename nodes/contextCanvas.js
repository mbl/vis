import { TextureCache } from './textureCache.js';
import { colorARGBToCSS } from './tools/colors.js';
import { Mouse } from './mouse.js';
import { valueEditor, checkStartEditing } from './editor.js';
import { Keyboard } from './keyboard.js';

/**
 * Drawing / hitTesting / other querying context
 */
export class Context {
    /**
     * @param {string} elementId Id of element to put the context into
     * @param {() => void} draw Function to redraw everything
     */
    constructor(elementId, draw, assetPrefix = '') {
        this.font = '"Roboto Mono"';
        const div = document.getElementById(elementId);
        this.parent = div;
        const canvas = document.createElement('canvas');
        this.canvas = canvas;
        this.resize();

        div.appendChild(canvas);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.font = `12px ${this.font}`;

        this.mouse = new Mouse(canvas);
        this.keyboard = new Keyboard(canvas);

        this.ctx = ctx;
        this.draw = draw;
        this.redrawRequested = false;
        this.textureCache = new TextureCache();
        this.assetPrefix = assetPrefix;
        
        // Hit test result from previous frame
        this.hitTestResult = null;

        // As hit testing progresses, the result is set to here
        this.partialHitTestResult = null;
        this.hitTestNoiseThreshold = 5; // How precisely user positions mouse usually
        this.hitTestMaxDistance = 5;

        // Other data
        this.startTime = Date.now();
        this.time = 0;
        // Width of a capital M
        this.mWidth = 7.201171875; // TODO run ctx.measureText('M').width; once font loads

        this.editorState = {};
    }

    // Context management ---
    newFrame() {
        this.resize();
        this.hitTestResult = this.partialHitTestResult;
        this.partialHitTestResult = null;
        checkStartEditing(this, this.editorState);
    }

    endFrame() {
        this.mouse.mouseDown = false;
        this.mouse.mouseUp = false;
        this.keyboard.endFrame();
    }

    // Drawing commands ---

    pixel(x, y, color) {
        this.ctx.fillStyle = colorARGBToCSS(color);
        this.ctx.fillRect(x, y, 1, 1);
    }

    /**
     * 
     * @param {*} x1 
     * @param {*} y1 
     * @param {*} x2 
     * @param {*} y2 
     * @param {string} color CSS color name
     * @param {*} lineWidth 
     */
    drawLine(x1, y1, x2, y2, color, lineWidth=1) {
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawRect(x, y, w, h, fill) {
        if (Number.isInteger(fill)) {
            fill = colorARGBToCSS(fill);
        }
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, w, h);
    }

    clip(x, y, w, h) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.ctx.clip();
    }

    unclip() {
        this.ctx.restore();
    }

    sprite(x, y, texture, tint = null) {
        var img = this.textureCache.getImage(this, `${this.assetPrefix}${texture}`, tint);
        if (img) {
            this.ctx.drawImage(img, x, y);
        }
    }

    /**
     * @param {string} texture URL of the texture to load
     * @param {number} tint uint32 defining ARGB
     */
    nineSlicePlane(x, y, w, h, texture, left, top, right, bottom, tint=null) {
        var img = this.textureCache.getImage(this, `${this.assetPrefix}${texture}`, tint);
        if (img) {
            const iw = img.width;
            const ih = img.height;
            
            const swm = w - left - right;
            const shm = h - top - bottom;

            const iwm = iw - left - right;
            const ihm = ih - top - bottom;

            this.ctx.drawImage(img, 0, 0, left, top, x, y, left, top);
            this.ctx.drawImage(img, left, 0, iwm, top, x + left, y, swm, top);
            this.ctx.drawImage(img, iw - right, 0, right, top, x + w - right, y, right, top);

            this.ctx.drawImage(img, 0, top, left, ihm, x, y + top, left, shm);
            this.ctx.drawImage(img, left, top, iwm, ihm, x + left, y + top, swm, shm);
            this.ctx.drawImage(img, iw - right, top, right, ihm, x + w - right, y + top, right, shm);

            this.ctx.drawImage(img, 0, ih - bottom, left, bottom, x, y + h - bottom, left, bottom);
            this.ctx.drawImage(img, left, ih - bottom, iwm, bottom, x + left, y + h - bottom, swm, bottom);
            this.ctx.drawImage(img, iw - right, ih - bottom, right, bottom, x + w - right, y + h - bottom, right, bottom);
        }
    }

    /**
     * Draw text into given rectangle.
     * 
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {string} text
     */
    drawText(x, y, w, h, text, color='white', fontSize=12) {
        this.ctx.font = `${fontSize}px ${this.font}`;
        this.ctx.fillStyle = color;
        this.ctx.textBaseline = 'middle';

        this.clip(x, y, w, h);
        this.ctx.clip();
        // this.drawRect(x, y, w, h, 'rgba(0, 255, 0, 0.1)');
        this.ctx.fillText(text, x, y + h / 2);
        this.unclip();
    }

    drawBezier(x1, y1, x2, y2, x3, y3, x4, y4, color, lineWidth = 1) {
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = colorARGBToCSS(color);
        
        this.ctx.beginPath();
        // this.ctx.moveTo(x1, y1);
        // this.ctx.bezierCurveTo(x2, y2, x3, y3, x4, y4);

        const c = 0.53;
        this.ctx.moveTo(x1, y1);
        this.ctx.quadraticCurveTo(x1 + (x2 - x1) * c, y1 + (y2 - y1) * c, (x2 + x3) / 2, (y2 + y3) / 2);
        this.ctx.quadraticCurveTo(x4 + (x3 - x4) * c, y4 + (y3 - y4) * c, x4, y4);
        this.ctx.stroke();
    }

    /**
     * Draw editor for a value of a given type
     * @param {{ value: any }} obj Object with value to be edited
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     * @param {string} type 
     */
    inputText(obj, x, y, w, h, type) {
        valueEditor(this, this.editorState, obj, x, y, w, h, type);
    }

    /**
     * Ask for screen redraw.
     */
    requestRedraw() {
        if (!this.redrawRequested) {
            this.redrawRequested = true;
            requestAnimationFrame(() => { 
                this.redrawRequested = false;
                this.time = Date.now() - this.startTime;
                this.draw();
            });
        }
    }

    // Hit testing ----------------------

    /**
     * Is mouse in given rectangle?
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     * @return {boolean} Hit test occurred
     */
    hitTestRect(x, y, w, h) {
        return this.mouse.x >= x - this.hitTestMaxDistance && 
        this.mouse.x < x + w + this.hitTestMaxDistance &&
            this.mouse.y >= y - this.hitTestMaxDistance&& 
            this.mouse.y < y + h + this.hitTestMaxDistance;
    }

    /**
     * Return true if new hit test is better than old one.
     */
    betterHitTest(newTest, oldTest) {
        if (oldTest.distance >= this.hitTestNoiseThreshold && 
            newTest.distance < oldTest.distance) {
                return true;
            }

        if (newTest.distance >= this.hitTestNoiseThreshold) {
            return false;
        }

        return newTest.relDistance < oldTest.relDistance;
    }

    recordHitTest(type, obj, distance, relDistance) {
        const hitTestData = {
            type, obj, distance, relDistance
        };

        if (this.partialHitTestResult === null || 
            this.betterHitTest(hitTestData, this.partialHitTestResult)) {
            this.partialHitTestResult = hitTestData;
        }
    }

    // Miscelaneous ----------------------
    /**
     * @param {string} label
     * @return {number}
     */
    getTextWidth(label, fontSize = 12) {
        return label.length * this.mWidth / 12 * fontSize;
    }

    setTransform(a, b, c, d, e, f) {
        this.ctx.setTransform(a, b, c, d, e, f);
    }

    resetTransform() {
        this.ctx.resetTransform();
    }

    resize() {
        const divRect = this.parent.getBoundingClientRect();
        this.width = divRect.width;
        this.height = divRect.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
}