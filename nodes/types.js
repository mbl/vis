import { Node } from "./nodes.js";
import { Context } from "./context.js";
import { xoshiro128ss } from "./tools/math.js";
import { importCompiled, compileType } from "./compiler.js";
import { SourceMap } from "./sourcemap.js";

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

function input(name, type, defaultValue=null, label=name) {
    if (type === 'float32' && defaultValue===null) {
        defaultValue = 0.0;
    }
    if (type === 'float32[]' && defaultValue===null) {
        defaultValue = [0.0];
    }
    return new PortType(0, label, name, type, defaultValue, 0);
}

function output(name, type, label=name, editor=0) {
    return new PortType(1, label, name, type, null, editor);
}

export class PortType {
    /**
     * @param {number} output When falsey, this is input port, otherwise output.
     * @param {string} label Label to show the user 
     * @param {string} name Internal name of the port for code purposes
     * @param {string} type Type of the parameter (like float32 or float32[])
     * @param {any} defaultValue Default value to use if input port not connected.
     * @param {number} editor TODO: remove, obsolete
     */
    constructor(output, label, name, type, defaultValue, editor) {
        this.output = output;
        this.label = label;
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue;
        this.editor = editor;
    }
}

export class NodeType {
    /**
     * @param {string} type 
     * @param {string} title 
     * @param {number} color 
     * @param {string} source
     * @param {function} evaluate
     * @param {PortType[]} ports 
     */
    constructor(type, title, color, source, evaluate, ports) {
        this.type = type;
        this.title = title;
        this.color = color;
        this.source = source;
        this.evaluate = evaluate;
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
        ports: [
            output('value',  'float32', 'value', 1),
        ]
    },

    {
        type: 'displayNumber',
        title: 'Display',
        color: 0xffe0cc0e,
        preview: {
            height: 100,
            /**
             * @param {Node} node
             * @param {Context} ctx
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
                    const numStr = number.toString();
                    const tw = ctx.getTextWidth(numStr, 1);
                    ctx.drawText(x, y, w, h, numStr, 'red', Math.trunc(100 / tw));
                }
            }
        },
        ports: [
            input('value', 'float32', 0)
        ]
    },

    {
        type: 'plus',
        title: '+',
        color: 0xffcc4020,
        source: 'c = a + b;',
        ports: [
            input('a', 'float32[]', 0),
            input('b', 'float32[]', 0),
            output('c', 'float32[]', 'a+b'),
        ]
    },

    {
        type: 'minus',
        title: '-',
        color: 0xffff4020,
        source: 'c = a - b;',
        ports: [
            input('a', 'float32[]', 0),
            input('b', 'float32[]', 0),
            output('c', 'float32[]', 'a-b'),
        ]
    },

    {
        type: 'multiply',
        title: '*',
        color: 0xff2040ff,
        source: 'c = a * b;',
        ports: [
            input('a', 'float32[]', 1),
            input('b', 'float32[]', 1),
            output('c', 'float32[]', 'a*b'),
        ]
    },

    {
        type: 'divide',
        title: '/',
        color: 0xff2040ff,
        source: 'c = a / b;',
        ports: [
            input('a', 'float32[]', 0),
            input('b', 'float32[]', 1),
            output('c', 'float32[]', 'a/b'),
        ]
    },
    {
        type: 'round',
        title: 'round',
        color: 0xffaabbcc,
        source: 'i = Math.round(a);',
        ports: [
            input('a', 'float32[]', 0),
            output('i', 'float32[]', 'round(a)'),
        ]
    },

    {
        type: 'sigmoid',
        title: 'sigmoid',
        color: 0xff20ff20,
        source: 'sigmoid = 1 / (1 + Math.exp(-a));',
        ports: [
            input('a', 'float32[]', 0),
            output('sigmoid', 'float32[]')
        ]
    },

    {
        type: 'displayRectangles',
        title: 'Display Rectangles',
        color: 0xffe00ecc,
        preview: {
            height: 200,
            /**
             * @param {Node} node
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

                        ctx.drawRect(x + w / 2 + xv * w, y + h / 2 + yv * h, wv * w, hv * h, cv);
                    }
                }
            }
        },
        ports: [
            input('x', 'float32[]', 0),
            input('y', 'float32[]', 0),
            input('w', 'float32[]', 1),
            input('h', 'float32[]', 1),
            input('color', 'uint32[]', 0xffffffff),
        ]
    },

    {
        type: 'random',
        title: 'Rnd',
        color: 0xffffe00e,
        // TODO: How to compile these type of functions
        evaluate: (n, seed) => {
            const ni = n | 0;
            const s = seed | 0;
            const rnd = xoshiro128ss(s, s*13+7, s*1021+49, s*3+1);
            rnd();
            rnd();
            rnd();
            rnd();
            const result = new Float32Array(ni);
            for (let i = 0; i < ni; i++) {
                result[i] = rnd();
            }
            return [result];
        },
        ports: [
            input('n', 'uint32', 1),
            input('seed', 'uint32', 0),
            output('value', 'float32[]')
        ]
    },

    {
        type: 'chick',
        title: 'Chick with a Hat',
        color: 0xffffff00,
        preview: {
            height: 200,
            /**
             * @param {Context} ctx
             */
            draw: (node, ctx, x, y, w, h) => {
                ctx.sprite(x, y, 'assets/chickhat.png');
            }
        },
        ports: []
    },

    {
        type: 'owlbaby',
        title: 'Rescue Baby Owl',
        color: 0xffffdd55,
        preview: {
            height: 200,
            /**
             * @param {Context} ctx
             */
            draw: (node, ctx, x, y, w, h) => {
                ctx.sprite(x, y, 'assets/owlbaby.png');
            }
        },
        ports: []
    },

    {
        type: 'rotate',
        title: 'Rot',
        color: 0xffffff00,
        // TODO how to split vectorized part from static initialization
        source: `const sa = Math.sin(a);
const ca = Math.cos(a);
// vectorize(x, y, xr, yr)
xr = ca * x - sa * y;
yr = sa * x + ca * y;`,
        ports: [
            input('x', 'float32[]', 0),
            input('y', 'float32[]', 0),
            input('a', 'float32', 0),
            output('xr', 'float32[]'),
            output('yr', 'float32[]'),
        ]
    },

    {
        type: 'time',
        title: 'Time',
        color: 0xffffffff,
        evaluate() {
            // TODO: give evaluate access to the context
            return [this.time];
        },
        ports: [
            output('time', 'float32')
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

/**
 * Patch the types in place
 * @param {NodeType[]} types
 */
async function patchTypes(types) {
    let compiledTypes = '';

    const sourceMap = new SourceMap();

    types.forEach((t) => {
        if (t.source) {
            const compiledType = compileType(t, sourceMap);
            compiledTypes += compiledType;
        }
    });

    const module = await importCompiled(compiledTypes, sourceMap);

    types.forEach((t) => {
        if (t.source) {
            t.evaluate = module[t.type];
        }
    });
}

(async () => await patchTypes(types))();
