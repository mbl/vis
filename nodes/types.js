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
            }
        ]
    },

    { 
        type: 'displayNumber',
        title: 'Display',
        w: 120,
        color: 0xffe0cc0e,
        ports: [
            { 
                output: 0,
                label: 'value',
                type: 'float32',
            }
        ]
    },
];

export function getType(type) {
    return types.findIndex((x) => x.type === type);
}
