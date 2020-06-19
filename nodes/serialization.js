import { nodes, Node } from "./nodes.js";
import { addConnection } from "./connections.js";
import { getType } from "./types.js";

let lastSaveTime = 0;
const SAVE_INTERVAL_MS = 5000;

export function autosave() {
    const now = Date.now();
    if (now - lastSaveTime > SAVE_INTERVAL_MS) {
        save();
        lastSaveTime = now;
    }  
}

export function save() {
    const result = {
        version: 1,
        nodes: [],
    };

    for (let i=0; i<nodes.length; i++) {
        nodes[i].id = i;
    }

    for (let i=0; i<nodes.length; i++) {
        const node = nodes[i];

        const typeInfo = node.type;

        const serializedPorts = [];

        for (let p = 0; p < node.ports.length; p++) {
            const port = node.ports[p];
            const portInfo = port.type;

            const connectedTo = port.connectedTo;
            if (portInfo.output && portInfo.editor) {
                const defaultValue = portInfo.defaultValue;
                const value = port.value;

                if (value !== defaultValue) {
                    serializedPorts.push({
                        label: portInfo.label,
                        value,
                    });
                }
            }
            else if (!portInfo.output && connectedTo) {
                const connectedPortInfo = connectedTo.type;

                serializedPorts.push({
                    label: portInfo.label,
                    connectedTo: {
                        nodeId: port.connectedTo.node.id,
                        label: connectedPortInfo.label,
                    }
                });
            }
        }

        const serializedNode = {
            id: node.id,
            type: node.type.type,
            x: node.x,
            y: node.y,
            ports: serializedPorts,
        };

        result.nodes.push(serializedNode);
    }

    localStorage.setItem('graph', JSON.stringify(result, null, 2));
}

export function load() {
    const graphString = localStorage.getItem('graph');

    if (graphString) {
        const graph = JSON.parse(graphString);
        if (graph.version !== 1) {
            throw new Error(`Cannot load graph. Unsupported version ${graph.version}`);
        }

        nodes.length = 0;
        // Load all the nodes

        const nodeIdMap = {};

        for (let i = 0; i < graph.nodes.length; i++) {
            const serializedNode = graph.nodes[i];
            const type = getType(serializedNode.type);
            const node = new Node(type, serializedNode.x, serializedNode.y);
            nodes.push(node);
            node.id = i;
            nodeIdMap[serializedNode.id] = node;
        }

        // Connect the nodes
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const serializedNode = graph.nodes[i];
            for (let p = 0; p < serializedNode.ports.length; p++) {
                const serializedPort = serializedNode.ports[p];
                if (serializedPort.connectedTo) {
                    const portFrom = nodeIdMap[serializedPort.connectedTo.nodeId].findPortByLabel(serializedPort.connectedTo.label);
                    const portTo = node.findPortByLabel(serializedPort.label);

                    addConnection(portFrom, portTo);
                }
                else {
                    const port = node.findPortByLabel(serializedPort.label);
                    if (serializedPort.value !== undefined) {
                        port.value = serializedPort.value;
                    }
                    else {
                        port.value = port.type.defaultValue;
                    }
                }
            }
        }
    }
}