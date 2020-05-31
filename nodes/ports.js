export function initPorts() {
    const allocated = 1000;
    return {
        num: 0,
        allocated,

        nodeId: new Int32Array(allocated),
        portId: new Int32Array(allocated),
        x: new Float32Array(allocated),
        y: new Float32Array(allocated),
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
export function addPort(ports, nodeId, portId) {
    const i = allocatePort(ports);

    ports.nodeId[i] = nodeId;
    ports.portId[i] = portId;

    return i;
}

export const ports = initPorts();