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