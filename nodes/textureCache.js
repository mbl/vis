import { Context } from './context.js';

/**
 * Cache of loaded textures.
 */
export class TextureCache {
    constructor() {
        this.cache = {};
    }

    /**
     * @param {Context} ctx Drawing context to notify when image loads.
     * @param {string} url Url to load.
     * @returns {Image} Loaded image (or null)
     */
    getImage(ctx, url) {
        const entry = this.cache[url];
        if (entry && entry.loaded) {
            return entry.image;
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
}
