import { Node } from "./nodes.js";
import { Context } from "./context.js";

/**
 * Array Length.
 * @param {ArrayBufferView | number} x 
 */
function al(x) {
    return ArrayBuffer.isView(x) ? x.length : 1;
}

/**
 * Return array
 * @param {*} x 
 */
function ra(x) {
    return x.length === 1 ? [x[0]] : [x];
}

/**
 * Get Value at given index. If array too short, wrap around.
 * @param {ArrayBufferView | number} a 
 * @param {number} i 
 */
function gv(a, i) {
    return ArrayBuffer.isView(a) ? a[i % a.length] : a;
}

export class PortType {
    /**
     * @param {number} output 
     * @param {string} label 
     * @param {string} type 
     * @param {any} defaultValue 
     * @param {number} editor 
     */
    constructor(output, label, type, defaultValue, editor) {

    }
}

export class NodeType {
    /**
     * @param {string} type 
     * @param {string} title 
     * @param {number} color 
     * @param {number} w 
     * @param {PortType[]} ports 
     */
    constructor(type, title, color, w, ports) {
        this.type = type;
        this.title = title;
        this.color = color;
        this.w = w;
        this.ports = ports;
    }
}

/** 
 * @constant {NodeType[]} 
 */
export const types = [
    {
        type: 'number',
        title: 'Number',
        color: 0xffcce00e,
        w: 100,
        ports: [
            {
                output: 1,
                label: 'value',
                type: 'float32',
                defaultValue: 0,
                editor: 1,
            }
        ]
    },

    {
        type: 'displayNumber',
        title: 'Display',
        w: 120,
        color: 0xffe0cc0e,
        preview: {
            height: 100,
            /**
             * @param {Node} node
             */
            draw: (node, ctx, x, y, w, h) => {
                let number = node.getPortValue('value');
                if (ArrayBuffer.isView(number)) {
                    const lineHeight = Math.max(1.0, h / number.length);
                    for (let i = 0; i < number.length; i++) {
                        const n = number[i];
                        const xx = x + n * w;
                        const yy = y + h * i / number.length;
                        ctx.drawLine(xx, yy, xx, yy + lineHeight, 'red', 1);
                    }
                }
                else {
                    if (number === undefined) {
                        number = '?';
                    }
                    ctx.drawText(x, y, w, h, number.toString(), 'red', 48);
                }
            }
        },
        ports: [
            {
                output: 0,
                label: 'value',
                type: 'float32',
                defaultValue: 0,
            }
        ]
    },

    {
        type: 'plus',
        title: '+',
        w: 55,
        color: 0xffcc4020,
        evaluate: (a, b) => {
            const l = Math.max(al(a), al(b));

            const result = new Float32Array(l);

            for (let i = 0; i < l; i++) {
                const av = gv(a, i);
                const bv = gv(b, i);
                result[i] = av + bv;
            }
            return ra(result);
        },
        ports: [
            {
                output: 0,
                label: 'a',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 0,
                label: 'b',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 1,
                label: 'a+b',
                type: 'float32[]',
            }
        ]
    },

    {
        type: 'minus',
        title: '-',
        w: 55,
        color: 0xffff4020,
        evaluate: (a, b) => {
            const l = Math.max(al(a), al(b));

            const result = new Float32Array(l);

            for (let i = 0; i < l; i++) {
                const av = gv(a, i);
                const bv = gv(b, i);
                result[i] = av - bv;
            }
            return ra(result);
        },
        ports: [
            {
                output: 0,
                label: 'a',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 0,
                label: 'b',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 1,
                label: 'a-b',
                type: 'float32[]',
            }
        ]
    },

    {
        type: 'multiply',
        title: '*',
        w: 55,
        color: 0xff2040ff,
        evaluate: (a, b) => {
            const l = Math.max(al(a), al(b));

            const result = new Float32Array(l);

            for (let i = 0; i < l; i++) {
                const av = gv(a, i);
                const bv = gv(b, i);
                result[i] = av * bv;
            }
            return ra(result);
        },
        ports: [
            {
                output: 0,
                label: 'a',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 0,
                label: 'b',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 1,
                label: 'a*b',
                type: 'float32[]',
            }
        ]
    },

    {
        type: 'divide',
        title: '/',
        w: 55,
        color: 0xff2040ff,
        evaluate: (a, b) => {
            const l = Math.max(al(a), al(b));

            const result = new Float32Array(l);

            for (let i = 0; i < l; i++) {
                const av = gv(a, i);
                const bv = gv(b, i);
                result[i] = av / bv;
            }
            return ra(result);
        },
        ports: [
            {
                output: 0,
                label: 'a',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 0,
                label: 'b',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 1,
                label: 'a/b',
                type: 'float32[]',
            }
        ]
    },

    {
        type: 'sigmoid',
        title: 'sigmoid',
        w: 80,
        color: 0xff20ff20,
        evaluate: (a, b) => {
            const l = Math.max(al(a), al(b));

            const result = new Float32Array(l);

            for (let i = 0; i < l; i++) {
                const av = gv(a, i);
                const ex = Math.exp(av);
                result[i] = ex / (ex + 1);
            }
            return ra(result);
        },
        ports: [
            {
                output: 0,
                label: 'a',
                type: 'float32[]',
                defaultValue: 0,
            },
            {
                output: 1,
                label: 'sigmoid',
                type: 'float32[]',
            }
        ]
    },

    {
        type: 'displayRectangles',
        title: 'Display Rectangles',
        w: 220,
        color: 0xffe00ecc,
        preview: {
            height: 200,
            /**
             * @param {Context} ctx
             */
            draw: (node, ctx, x, y, w, h) => {
                const xa = node.getPortValue('x');
                const ya = node.getPortValue('y');
                const wa = node.getPortValue('w');
                const ha = node.getPortValue('h');
                const ca = node.getPortValue('color');

                if (!xa || !ya || !wa || !ha || !ca) {
                    // xa.length !== ya.length || 
                    // xa.length !== wa.length ||
                    // xa.length !== ha.length ||
                    // xa.length !== ca.length) {
                    ctx.drawText(x, y, w, h, '!', 'red', 48);
                }
                else {
                    const l = Math.max(al(xa), al(ya), al(wa), al(ha), al(ca));

                    for (let i = 0; i < l; i++) {
                        const xv = gv(xa, i);
                        const yv = gv(ya, i);
                        const wv = gv(wa, i);
                        const hv = gv(ha, i);
                        const cv = gv(ca, i);

                        ctx.drawRect(x + xv * w, y + yv * h, wv * w, hv * h, cv);
                    }
                }
            }
        },
        ports: [
            {
                output: 0,
                label: 'x',
                type: 'float32[]',
                defaultValue: [],
            },
            {
                output: 0,
                label: 'y',
                type: 'float32[]',
                defaultValue: [],
            },
            {
                output: 0,
                label: 'w',
                type: 'float32[]',
                defaultValue: [],
            },
            {
                output: 0,
                label: 'h',
                type: 'float32[]',
                defaultValue: [],
            },
            {
                output: 0,
                label: 'color',
                type: 'uint32[]',
                defaultValue: [],
            },
        ]
    },

    {
        type: 'random',
        title: 'Random',
        color: 0xffffe00e,
        w: 100,
        evaluate: (n) => {
            const ni = n | 0;
            const result = new Float32Array(ni);
            for (let i = 0; i < ni; i++) {
                result[i] = Math.random();
            }
            return [result];
        },
        ports: [
            {
                output: 0,
                label: 'n',
                type: 'uint32',
                defaultValue: 1,
                editor: 0,
            },
            {
                output: 1,
                label: 'value',
                type: 'float32[]',
                defaultValue: [],
                editor: 0,
            }
        ]
    },

];

/**
 * 
 * @param {string} type 
 * @return {NodeType} Type information about the node
 */
export function getType(type) {
    return types.find((x) => x.type === type);
}
