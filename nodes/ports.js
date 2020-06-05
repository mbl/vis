import { distancePointToRectangle } from './tools/distance.js';

export function initPorts() {
    const allocated = 1000;
    return {
        num: 0,
        allocated,

        nodeId: new Int32Array(allocated),
        portId: new Int32Array(allocated), // Unique within the node
        x: new Float32Array(allocated),
        y: new Float32Array(allocated),
        output: new Int8Array(allocated),
        label: new Array(allocated),
        type: new Array(allocated),
    };
}

/**
 * Allocate new port and return its index.
 */
export function allocatePort(ports) {
    if (ports.num + 1 < ports.allocated) {
        return ++ports.num;
    }
    // TODO reallocate the buffers as needed
}

/**
 * Register a node, return its index
 */
export function addPort(ports, nodeId, portId, output, label, type) {
    const i = allocatePort(ports);

    ports.nodeId[i] = nodeId;
    ports.portId[i] = portId;
    ports.output[i] = output;
    ports.label[i] = label;
    ports.type[i] = type;

    return i;
}

export const ports = initPorts();

/**
 * @param {Context} ctx 
 */
export function drawPort(ctx, nodeId, portId, x, y, color, connected) {
    ctx.positionPort(portId, x + 7.5, y + 5.5);

    const w = 15;
    const h = 15;
    if(ctx.hitTestRect(x, y, w, h)) {
        ctx.recordHitTest('port', portId, 
            distancePointToRectangle(ctx.mouse, x, y, w, h),
            w * h
        );
    }

    let actualColor = color;

    if (ctx.hitTestResult && ctx.hitTestResult.type === 'port' && portId === ctx.hitTestResult.id) {
        actualColor = 0xffffdd00;
    }

    if (connected) {
        ctx.sprite(x, y, 'assets/Pin_connected_VarA.png', actualColor);
    }
    else {
        ctx.sprite(x, y, 'assets/Pin_disconnected_VarA.png', actualColor);
    }
}
