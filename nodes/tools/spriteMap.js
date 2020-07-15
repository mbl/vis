import potpack from "./potpack.js";
import { nextPowerOfTwo } from "./math.js";

/**
 * Can create a texture with a sprite map initialized
 * from images and from font characters.
 */
export class SpriteMap {
    constructor() {
        this.offScreenCanvas = document.createElement('canvas');
        this.offScreenCanvas.width = 100;
        this.offScreenCanvas.height = 100;
        this.rasterFontSize = 12; // Raster everything at 12 pixels
        this.context = this.offScreenCanvas.getContext("2d");
        // Map from font -> Map of character -> rectangle
        /** @type {Map<string, Map<string, { x: number, y: number, w: number, h: number }>>} */
        this.characterMap = new Map();
        this.whitePixelBox = { x: 0, y: 0, w: 1, h: 1 };
        this.boxes = [this.whitePixelBox];
    }

    /**
     * 
     * @param {*} fontName Canvas name of the font to use (includes size)
     * @param {*} characters A long string of all characters that should be supported.
     */
    addFont(fontName, characters) {
        this.context.font = `${this.rasterFontSize}px ${fontName}`;
        const map = new Map();
        for (let i = 0; i < characters.length; i++) {
            const c = characters[i];
            const fontMetrics = this.context.measureText(c);
            const box = {
                x: 0,
                y: 0,
                w: Math.ceil(fontMetrics.width) + 2,
                h: Math.ceil(this.rasterFontSize) + 2,
            };
            this.boxes.push(box);
            map.set(c, box);
        }
        this.characterMap.set(fontName, map);
    }

    /**
     * Pack all the bitmaps and characters,
     * draw them into canvas.
     */
    build() {
        const { w, h } = potpack(this.boxes);

        const aw = nextPowerOfTwo(w);
        const ah = nextPowerOfTwo(h);
        this.offScreenCanvas.width = aw;
        this.offScreenCanvas.height = ah;
        this.context.textBaseline = 'top';

        this.characterMap.forEach((characters, fontName) => {
            this.context.font = `${this.rasterFontSize}px ${fontName}`;
            characters.forEach((box, character) => {
                this.context.fillStyle = 'white';
                this.context.fillText(character, box.x + 1, box.y + 1);
            });
        });
        
        const wpb = this.whitePixelBox;
        this.context.fillStyle = 'white';
        this.context.fillRect(wpb.x, wpb.y, wpb.w, wpb.h);
        wpb.x += 0.5;
        wpb.y += 0.5;
        wpb.w = 0.0;
        wpb.h = 0.0;

        this.boxes.forEach(b => {
            b.x /= aw;
            b.y /= ah;
            b.w /= aw;
            b.h /= ah;
        });
    }

    /**
     * Return a map for given font. The map is an object keyed by the
     * character which returns texture coordinates for a rectangle containing
     * said character. 
     * 
     * @returns Map<string, { x: number, y: number, w: number, h: number }> Font character sprite map
     */
    getCharacterMap(fontName) {
        return this.characterMap.get(fontName);
    }

    /**
     * Return the generated canvas texture.
     */
    getTexture() {
        return this.offScreenCanvas;
    }
}