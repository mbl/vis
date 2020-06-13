/** 
 * Makes current state of keyboard accessible to the context.
 */
export class Keyboard {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.onKeyDown = this.onKeyDown.bind(this);
        this.keyCode = 0;
        this.init();
    }

    endFrame() {
        this.keyCode = 0;
    }

    onKeyDown(event) {
        this.keyCode = event.keyCode;
    }

    init() {
        document.addEventListener("keydown", this.onKeyDown);
    }

    dispose() {
        document.removeEventListener("keydown", this.onKeyDown);
    }
}
