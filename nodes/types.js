import { getNodePorts } from "./nodes.js";
import { ports, findPortByLabel } from "./ports.js";

function getPortValue(nodeId, label) {
    const portId = findPortByLabel(nodeId, label);
    const sourcePort = ports.connectedTo[portId];
    if (sourcePort) {
        return ports.value[sourcePort];
    }
    return undefined;
}

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
            draw: (nodeId, ctx, x, y, w, h) => {
                let number = getPortValue(nodeId, 'value');
                if (number === undefined) {
                    number = '?';
                }
                ctx.drawText(x, y, w, h, number.toString(), 'red', 48);
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
        evaluate: (a, b) => [a + b],
        ports: [
            { 
                output: 0,
                label: 'a',
                type: 'float32',
                defaultValue: 0,
            },
            { 
                output: 0,
                label: 'b',
                type: 'float32',
                defaultValue: 0,
            },
            { 
                output: 1,
                label: 'a+b',
                type: 'float32',
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
            draw: (nodeId, ctx, x, y, w, h) => {
                

                // if (xa.length !== ya.length || 
                //     xa.length !== wa.length ||
                //     xa.length !== ha.length ||
                //     xa.length !== ca.length) {
                //         ctx.drawText(x, y, w, h, '!', 'red', 48);
                //     }
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
];

export function getType(type) {
    return types.findIndex((x) => x.type === type);
}
