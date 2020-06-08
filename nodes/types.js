import { getNodePorts } from "./nodes.js";
import { ports } from "./ports.js";

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
                const [valuePortId] = getNodePorts(nodeId);
                const sourcePortId = ports.connectedTo[valuePortId];
                let number = 'NaN';
                if (sourcePortId) {
                    number = ports.value[sourcePortId];
                    if (number === undefined) {
                        number = '?';
                    }
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
];

export function getType(type) {
    return types.findIndex((x) => x.type === type);
}
