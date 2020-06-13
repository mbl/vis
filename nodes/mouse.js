/**
 * Mouse-related functionality.
 * 
 * Keeps information on where mouse is and what it is doing
 * for a particular frame.
 */
export class Mouse {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        // Is mouse down in this frame
        this.mouseUp = false;
        this.mouseDown = false;
        this.buttons = 0;
        this.init(canvas);

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    onMouseUp(event) {
        this.mouseUp = true;
        this.buttons = event.buttons;
        event.stopPropagation();        
        event.preventDefault();

        document.removeEventListener("mousemove", this.onMouseMove);
        document.removeEventListener("mouseup", this.onMouseUp);
    }

    onMouseDown(event) {
        this.mouseDown = true;
        this.buttons = event.buttons;
        event.stopPropagation();
        event.preventDefault();

        document.addEventListener("mousemove", this.onMouseMove);
        document.addEventListener("mouseup", this.onMouseUp);
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.x = event.clientX - rect.left;
        this.y = event.clientY - rect.top;
        event.stopPropagation();
        event.preventDefault();
    }

    init(canvas) {
        this.canvas.onmousedown = (event) => this.onMouseDown(event);
        this.canvas.onmouseup = (event) => this.onMouseUp(event);
        this.canvas.onmousemove = (event) => this.onMouseMove(event);
        
        this.canvas.onmouseout = (event) => {
            if (this.buttons === 0) {
                this.x = NaN;
                this.y = NaN;
                this.mouseDown = false;
                this.mouseUp = false;
            }
        }
    }
}