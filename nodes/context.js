import { TextureCache } from './textureCache.js';
import { colorARGBToCSS } from './tools/colors.js';
import { ports } from './ports.js';
import { Mouse } from './mouse.js';

/**
 * Drawing / hitTesting / other querying context
 */
export class Context {
    /**
     * @param {string} elementId Id of element to put the context into
     * @param {() => void} draw Function to redraw everything
     */
    constructor(elementId, width, height, draw, assetPrefix = '') {        
        
        const div = document.getElementById(elementId);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        div.appendChild(canvas);
        const ctx = canvas.getContext('2d', { alpha: false });

        this.mouse = new Mouse(canvas);

        this.ctx = ctx;
        this.draw = draw;
        this.redrawRequested = false;
        this.textureCache = new TextureCache();
        this.assetPrefix = assetPrefix;
        
        // When true, context is in a hit-test only mode
        // does not draw, just remembers what the hit test was
        this.hitTest = false;

        // When true, context is capturing layout information
        this.layout = false;

        // As hit testing progresses, the result is set to here
        this.hitTestResult = null;
        this.hitTestNoiseThreshold = 5; // How precisely user positions mouse usually
        this.hitTestMaxDistance = 5;

        // Other data
        this.time = Date.now();
    }

    isDrawing() {
        return !this.hitTest && !this.layout;
    }

    pixel(x, y, color) {
        if (!this.isDrawing()) {
            return;
        }
        this.ctx.fillStyle = colorARGBToCSS(color);
        this.ctx.fillRect(x, y, 1, 1);
    }

    // Drawing commands ---
    drawLine(x1, y1, x2, y2, color, lineWidth=1) {
        if (!this.isDrawing()) {
            return;
        }
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawRect(x, y, w, h, fill) {
        if (!this.isDrawing()) {
            return;
        }
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, w, h);
    }

    sprite(x, y, texture, tint = null) {
        if (!this.isDrawing()) {
            return;
        }
        var img = this.textureCache.getImage(this, `${this.assetPrefix}${texture}`, tint);
        if (img) {
            this.ctx.drawImage(img, x, y);
        }
    }

    /**
     * @param {string} texture URL of the texture to load
     * @param {number} tint uint32 defining ARGB
     */
    nineSlicePlane(x, y, w, h, texture, left, top, right, bottom, tint) {
        if (!this.isDrawing()) {
            return;
        }
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

    drawText(x, y, text) {
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(text, x, y);
    }

    drawBezier(x1, y1, x2, y2, x3, y3, x4, y4, color, lineWidth = 1) {
        if (!this.isDrawing()) {
            return;
        }
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.bezierCurveTo(x2, y2, x3, y3, x4, y4);
        this.ctx.stroke();
    }

    /**
     * Ask for screen redraw.
     */
    requestRedraw() {
        if (!this.redrawRequested) {
            this.redrawRequested = true;
            requestAnimationFrame(() => { 
                this.redrawRequested = false;
                this.time = Date.now();
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

    recordHitTest(type, id, distance, relDistance) {
        if (this.hitTest) {
            const hitTestData = {
                type, id, distance, relDistance
            };

            if (this.hitTestResult === null || 
                this.betterHitTest(hitTestData, this.hitTestResult)) {
                this.hitTestResult = hitTestData;
            }
        }
    }

    // Layout ----------------------------
    positionPort(portId, x, y) {
        ports.x[portId] = x;
        ports.y[portId] = y;
    }
}