import { TextureCache } from './textureCache.js';
import { colorARGBToCSS } from './tools/colors.js';
import { Mouse } from './mouse.js';
import { valueEditor, checkStartEditing } from './editor.js';
import { Keyboard } from './keyboard.js';
import { bezier } from './tools/math.js';

/**
 * Drawing / hitTesting / other querying context implemented in WebGL
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

        const contextAttributes = {
            alpha: false,
            depth: false,
            stencil: false,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: true,
            xrCompatible: false,
        };

        // TODO: webglcontextlost, webglcontextrestored

        let ctx = canvas.getContext('webgl', contextAttributes);

        if (!ctx) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
            ctx = null;
        }

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

        this.allocatedVertices = 100000;
        this.usedVertices = 0;
        this.allocatedIndices = 100000;
        this.usedIndices = 0;

        // JavaScript arrays
        this.xyArray = new Float32Array(this.allocatedVertices * 2);
        this.uvArray = new Float32Array(this.allocatedVertices * 2);
        this.colorArray = new Uint32Array(this.allocatedVertices); // ARGB color
        this.indexArray = new Uint32Array(this.allocatedIndices);

        this.xyBuffer = -1;
        this.uvBuffer = -1;
        this.colorBuffer = -1;
        this.indexBuffer = -1;

        this.posAttribute = -1;
        this.colorAttribute = -1;

        this.initGl(this.ctx);
    }

    initGl(gl) {
        // Initialize ANGLE_instanced_arrays extension
        const ext = gl.getExtension('OES_element_index_uint');
        if (!ext) {
            throw new Error('need OES_element_index_uint');
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Set clear color to black, fully opaque
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        // Clear the color as well as the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT);
      
        // language=GLSL
        const vertexShaderCode = `
            attribute vec2 aPos; // Position of the vertex
            attribute vec2 aUv; // Texture coordinate for the vertex
            attribute vec4 aColor; // Color of the vertex

            uniform mat4 uTransform; // Transform from pixel coordinates to WebGL screen space (-1, 1)

            varying vec4 vColor;
            varying vec2 vTextureCoord;
      
            void main() {
                vColor = aColor.zyxw;
                vTextureCoord = aUv;
      
                gl_Position = uTransform * vec4(aPos.x, aPos.y, 0.0, 1.0);
            }
        `;
      
        // language=GLSL
        const fragmentShaderCode = `
            precision mediump float;
            
            varying vec4 vColor;
            
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
          
            void main() {
                gl_FragColor = vColor * texture2D(uSampler, vTextureCoord);
            }
        `;
      
        function compileShader(source, type) {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shader: " + gl.getShaderInfoLog(shader));
            return null;
          }
          return shader;
        }
      
        const vertexShader = compileShader(vertexShaderCode, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(fragmentShaderCode, gl.FRAGMENT_SHADER);
      
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
      
        // If creating the shader program failed, alert
      
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
          alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
        }
      
        gl.useProgram(shaderProgram);
      
        this.posAttribute = gl.getAttribLocation(shaderProgram, "aPos");
        gl.enableVertexAttribArray(this.posAttribute);

        this.uvAttribute = gl.getAttribLocation(shaderProgram, "aUv");
        gl.enableVertexAttribArray(this.uvAttribute);
      
        this.colorAttribute = gl.getAttribLocation(shaderProgram, "aColor");
        gl.enableVertexAttribArray(this.colorAttribute);

        this.transformUniform = gl.getUniformLocation(shaderProgram, "uTransform");
        
        // Create and set texture
        const textureWidth = 256;
        const textureHeight = 256;
        this.texture = this.createTargetTexture(textureWidth, textureHeight);
        const textureCanvas = this.drawCanvasPicture(textureWidth, textureHeight);
        this.loadCanvasToTexture(textureCanvas, this.texture);

        this.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        gl.uniform1i(this.samplerUniform, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        this.xyBuffer = gl.createBuffer();
        this.uvBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }

    // Context management ---
    newFrame() {
        this.usedVertices = 0;
        this.usedIndices = 0;

        this.resize();
        this.hitTestResult = this.partialHitTestResult;
        this.partialHitTestResult = null;
        checkStartEditing(this, this.editorState);
    }

    endFrame() {
        this.mouse.mouseDown = false;
        this.mouse.mouseUp = false;
        this.keyboard.endFrame();

        /** @type {WebGL2RenderingContext} */
        const gl = this.ctx;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.xyBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            this.xyArray,
            gl.STATIC_DRAW
        );
        gl.vertexAttribPointer(this.posAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            this.uvArray,
            gl.STATIC_DRAW
        );
        gl.vertexAttribPointer(this.uvAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            this.colorArray,
            gl.STATIC_DRAW
        );
        gl.vertexAttribPointer(this.colorAttribute, 4, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            this.indexArray,
            gl.STATIC_DRAW
        );

        // Take input, scale it, move it
        // Input is in [0..width, 0..height] for the canvas element
        // Output is in [-1..1, -1..1] for WebGL
        // This is done in two steps - 
        // 1) scale 0..width to 0..2
        // 2) subtract 1
        // To do this we need to know canvas dimensions (width, height) that are in this.width, this.height
        const sx = 2.0 / this.width;
        const sy = -2.0 / this.height;
        const mx = -1;
        const my = 1;
        const transform = new Float32Array([
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, 1, 0,
            mx, my, 0, 1,
        ]);
        gl.uniformMatrix4fv(this.transformUniform, false, transform);

        gl.drawElements(gl.TRIANGLES, this.usedIndices, gl.UNSIGNED_INT, 0);
    }

    // Textures ---
    createTargetTexture(width, height) {
        /** @type {WebGL2RenderingContext} */
        const gl = this.ctx;

        // create to render to
        const targetTextureWidth = width;
        const targetTextureHeight = height;
        const targetTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);

        {
            const level = 0;
            const internalFormat = gl.RGBA32F;
            const border = 0;
            const format = gl.RGBA;
            const type = gl.FLOAT;
            const data = null;

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                targetTextureWidth, targetTextureHeight, border,
                format, type, data);
        }

        return targetTexture;
    }
    
    drawCanvasPicture(textureWidth, textureHeight) {
        const offScreenCanvas = document.createElement('canvas');
        offScreenCanvas.width = textureWidth;
        offScreenCanvas.height = textureHeight;
        const context = offScreenCanvas.getContext("2d");
        context.fillStyle = 'black';
        context.fillRect(0, 0, textureWidth, textureHeight);
        context.clearRect(50, 150, 412, 100);
        context.font = "180px Arial";
        context.fillStyle = "#ff7d2a";
        context.fillText("Hello", 0, 200);
        context.fillStyle = "#64ff48";
        context.fillText("World", 30, 350);
        return offScreenCanvas;
    }

    loadCanvasToTexture(canvas, texture) {
        /** @type {WebGL2RenderingContext} */
        const gl = this.ctx;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    }
    
    // Drawing commands ---

    pixel(x, y, color) {
        return;
        this.ctx.fillStyle = colorARGBToCSS(color);
        this.ctx.fillRect(x, y, 1, 1);
    }

    /**
     * 
     * @param {*} x1 
     * @param {*} y1 
     * @param {*} x2 
     * @param {*} y2 
     * @param {number | string} color CSS color name or ARGB number
     * @param {*} lineWidth 
     */
    drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
        if (!Number.isInteger(color)) {
            return;
        }
        
        const fill = color;
        
        const startVertex = this.usedVertices;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const l = Math.sqrt(dx * dx + dy * dy);
        const tx = -dy / l * lineWidth / 2;
        const ty = dx / l * lineWidth / 2; 
        
        // 0
        this.xyArray[this.usedVertices * 2] = x1 - tx;
        this.xyArray[this.usedVertices * 2 + 1] = y1 - ty;
        this.uvArray[this.usedVertices * 2] = 0;
        this.uvArray[this.usedVertices * 2 + 1] = 0;
        this.colorArray[this.usedVertices] = fill;
        this.usedVertices++;

        // 1
        this.xyArray[this.usedVertices * 2] = x2 - tx;
        this.xyArray[this.usedVertices * 2 + 1] = y2 - ty;
        this.uvArray[this.usedVertices * 2] = 0;
        this.uvArray[this.usedVertices * 2 + 1] = 0;
        this.colorArray[this.usedVertices] = fill;
        this.usedVertices++;

        // 2
        this.xyArray[this.usedVertices * 2] = x2 + tx;
        this.xyArray[this.usedVertices * 2 + 1] = y2 + ty;
        this.uvArray[this.usedVertices * 2] = 0;
        this.uvArray[this.usedVertices * 2 + 1] = 0;
        this.colorArray[this.usedVertices] = fill;
        this.usedVertices++;

        // 3
        this.xyArray[this.usedVertices * 2] = x1 + tx;
        this.xyArray[this.usedVertices * 2 + 1] = y1 + ty;
        this.uvArray[this.usedVertices * 2] = 0;
        this.uvArray[this.usedVertices * 2 + 1] = 0;
        this.colorArray[this.usedVertices] = fill;
        this.usedVertices++;

        // Write out indices
        this.indexArray[this.usedIndices++] = startVertex + 0;
        this.indexArray[this.usedIndices++] = startVertex + 1;
        this.indexArray[this.usedIndices++] = startVertex + 2;

        this.indexArray[this.usedIndices++] = startVertex + 0;
        this.indexArray[this.usedIndices++] = startVertex + 2;
        this.indexArray[this.usedIndices++] = startVertex + 3;
        return;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawRect(x, y, w, h, fill) {
        if (!Number.isInteger(fill)) {
            return;
        }
        const startVertex = this.usedVertices;

        // UV coordinates for the rectangle in the texture space
        const tx = 0;
        const ty = 0;
        const tw = 1; 
        const th = 1;
        
        // 0
        this.xyArray[this.usedVertices * 2] = x;
        this.xyArray[this.usedVertices * 2 + 1] = y;
        this.uvArray[this.usedVertices * 2] = tx;
        this.uvArray[this.usedVertices * 2 + 1] = ty;
        this.colorArray[this.usedVertices] = fill;
        this.usedVertices++;

        // 1
        this.xyArray[this.usedVertices * 2] = x + w;
        this.xyArray[this.usedVertices * 2 + 1] = y;
        this.uvArray[this.usedVertices * 2] = tx + tw;
        this.uvArray[this.usedVertices * 2 + 1] = ty;
        this.colorArray[this.usedVertices] = fill;
        this.usedVertices++;

        // 2
        this.xyArray[this.usedVertices * 2] = x + w;
        this.xyArray[this.usedVertices * 2 + 1] = y + h;
        this.uvArray[this.usedVertices * 2] = tx + tw;
        this.uvArray[this.usedVertices * 2 + 1] = ty + th;
        this.colorArray[this.usedVertices] = fill;
        this.usedVertices++;

        // 3
        this.xyArray[this.usedVertices * 2] = x;
        this.xyArray[this.usedVertices * 2 + 1] = y + h;
        this.uvArray[this.usedVertices * 2] = tx;
        this.uvArray[this.usedVertices * 2 + 1] = ty + th;
        this.colorArray[this.usedVertices] = fill;
        this.usedVertices++;

        // Write out indices
        this.indexArray[this.usedIndices++] = startVertex + 0;
        this.indexArray[this.usedIndices++] = startVertex + 1;
        this.indexArray[this.usedIndices++] = startVertex + 2;

        this.indexArray[this.usedIndices++] = startVertex + 0;
        this.indexArray[this.usedIndices++] = startVertex + 2;
        this.indexArray[this.usedIndices++] = startVertex + 3;
    }

    clip(x, y, w, h) {
        return;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.ctx.clip();
    }

    unclip() {
        return;
        this.ctx.restore();
    }

    sprite(x, y, texture, tint = null) {
        var img = this.textureCache.getImage(this, `${this.assetPrefix}${texture}`, tint);
        if (!img) {
            return;
        }
        this.drawRect(x, y, 10, 10, 0x400000ff);
        return;
        if (img) {
            this.ctx.drawImage(img, x, y);
        }
    }

    /**
     * @param {string} texture URL of the texture to load
     * @param {number} tint uint32 defining ARGB
     */
    nineSlicePlane(x, y, w, h, texture, left, top, right, bottom, tint = null) {
        this.drawRect(x, y, w, h, tint || 0x20ffffff);
        return;
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
    drawText(x, y, w, h, text, color = 'white', fontSize = 12) {
        this.drawRect(x, y, w, h, 0x4000ff00);
        return;
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
        let px = x1;
        let py = y1;
        for (let t = 0.01; t < 1.0; t += 0.01) {
            let { x, y } = bezier(t, { x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 }, { x: x4, y: y4 });
            this.drawLine(px, py, x, y, color, lineWidth);
            px = x;
            py = y;
        }
        return;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;

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
        return;
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
            this.mouse.y >= y - this.hitTestMaxDistance &&
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
        return;
        this.ctx.setTransform(a, b, c, d, e, f);
    }

    resetTransform() {
        return;
        this.ctx.resetTransform();
    }

    resize() {
        const divRect = this.parent.getBoundingClientRect();
        this.width = divRect.width;
        this.height = divRect.height;

        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        // canvas.style.willChange = 'content';
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.canvas.style.imageRendering = 'pixelated';
    }
}