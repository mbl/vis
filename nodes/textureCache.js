import { Context } from './context.js';

/**
 * Cache of loaded textures.
 */
export class TextureCache {
    constructor() {
        // key - url#tint, value - image
        this.cache = {};
    }

    /**
     * @param {Context} ctx Drawing context to notify when image loads.
     * @param {string} url Url to load.
     * @paran {string} tint How to tint the image after loading
     * @returns {Image} Loaded image (or null)
     */
    getImage(ctx, url, tint = null) {
        if (tint !== null) {
            return this.getTintedImage(ctx, url, tint);
        }
        
        const entry = this.cache[url];
        if (entry) {
            return entry.loaded ? entry.image : null;
        }

        const image = new Image();
        image.src = url;

        this.cache[url] = {
            image,
            loaded: false,
        }

        image.onload = () => {
            this.cache[url].loaded = true;
            ctx.requestRedraw();
        }
    }

    /**
     * Return image multiplied by requested color.
     * 
     * @param {Context} ctx 
     * @param {string} url 
     * @param {string} color 
     */
    getTintedImage(ctx, url, color) {
        const key = `${url}#${color.toLowerCase()}`;
        const entry = this.cache[key];
        if (entry) {
            return entry.image;
        }
        
        const image = this.getImage(ctx, url);
        if (image) {
            const tempCanvas = document.createElement('canvas');
            const w = image.width;
            const h = image.height;
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tempContext = tempCanvas.getContext('2d');
            tempContext.drawImage(image, 0, 0);
            tempContext.globalCompositeOperation = 'multiply';
            tempContext.fillStyle = color;
            tempContext.fillRect(0, 0, image.width, image.height);
            tempContext.globalCompositeOperation = 'destination-in';
            tempContext.drawImage(image, 0, 0);
            this.cache[key] = {
                image: tempCanvas,
                loaded: true,
                tint: color,
            };
            return tempCanvas;
        }
    }
}
