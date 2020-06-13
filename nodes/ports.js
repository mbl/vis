import { distancePointToRectangle } from './tools/distance.js';
import { Context } from "./context.js";

export function initPorts() {
    const allocated = 1000;
    return {
        num: 0,
        numDeleted: 0,
        allocated,

        // ID of the node the port belongs to. If 0, this port is deleted.
        nodeId: new Int32Array(allocated),
        // 0-based order of the port within the node
        order: new Int32Array(allocated),
        x: new Float32Array(allocated),
        y: new Float32Array(allocated),
        output: new Int8Array(allocated),
        // If input port, ID of a port this port is connected to
        connectedTo: new Int32Array(allocated),
        // If output port, number of ports that are connected to this one
        numConnections: new Int32Array(allocated),
        label: new Array(allocated),
        type: new Array(allocated),
        value: new Array(allocated),
    };
}

/**
 * Allocate new port and return its index.
 */
export function allocatePort(ports) {
    if (ports.numDeleted > 0) {
        for (let i=1; i<=ports.num; i++) {
            if (ports.nodeId[i] === 0) {
                ports.numDeleted--;
                return i;
            }
        }
    }

    if (ports.num + 1 < ports.allocated) {
        return ++ports.num;
    }
    // TODO reallocate the buffers as needed
}

/**
 * Register a port, return its index
 */
export function addPort(ports, nodeId, order, output, label, type, value) {
    const i = allocatePort(ports);

    ports.nodeId[i] = nodeId;
    ports.order[i] = order;
    ports.output[i] = output;
    ports.label[i] = label;
    ports.type[i] = type;
    ports.value[i] = value;
    ports.connectedTo[i] = 0;
    ports.numConnections[i] = 0;

    return i;
}

export function removePort(ports, portId) {
    ports.nodeId[portId] = 0;
    ports.numDeleted++;
}

export const ports = initPorts();

/**
 * @param {Context} ctx
 * @param {number} portId
 * @param {number} x Left
 * @param {number} y Top
 * @param {number} color How to color the port
 * @param {boolean} connected If true, display port as filled
 */
export function drawPort(ctx, portId, x, y, color, connected) {
    // Layout ----------------------------
    ports.x[portId] = x + 7.5;
    ports.y[portId] = y + 5.5;

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
        // actualColor = 0xffffdd00;
        connected = true;
    }

    if (connected) {
        ctx.sprite(x, y, 'assets/Pin_connected_VarA.png', actualColor);
    }
    else {
        ctx.sprite(x, y, 'assets/Pin_disconnected_VarA.png', actualColor);
    }
    // ctx.drawText(x, y, 10, 10, portId.toString(), 'white', 10);
}

/**
 * Get or set port value.
 * 
 * @param {number} portId
 * @param {any?} value
 */
export function portValue(portId, value) {
    if (value !== undefined) {
        ports.value[portId] = value;
    }
    return ports.value[portId];
}