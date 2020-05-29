import { TextureCache } from './textureCache.js';

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

        canvas.onmousemove = (event) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
        }

        canvas.onmouseout = (event) => {
            this.mouse.x = NaN;
            this.mouse.y = NaN;
        }

        div.appendChild(canvas);
        const ctx = canvas.getContext('2d', { alpha: false });

        this.ctx = ctx;
        this.draw = draw;
        this.redrawRequested = false;
        this.textureCache = new TextureCache();
        this.assetPrefix = assetPrefix;

        this.mouse = {
            x: 0,
            y: 0,
        };
    }

    drawLine(x1, y1, x2, y2, color) {
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawRect(x, y, w, h, fill) {
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, w, h);
    }

    nineSlicePlane(x, y, w, h, texture, left, top, right, bottom, tint) {
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
     * Ask for screen redraw.
     */
    requestRedraw() {
        if (!this.redrawRequested) {
            this.redrawRequested = true;
            requestAnimationFrame(() => { 
                this.redrawRequested = false;
                this.draw();
            });
        }
    }

    getMouse() {
        return this.mouse;
    }
}