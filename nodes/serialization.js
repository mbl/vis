import { nodes, getNodePorts, addNode, addNodeWithId } from "./nodes.js";
import { types } from "./types.js";
import { ports, findPortByLabel } from "./ports.js";
import { addConnection } from "./connections.js";

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

    for (let i=1; i<=nodes.num; i++) {
        if (nodes.deleted[i]) {
            continue;
        }

        const typeInfo = types[nodes.type[i]];

        const portsArray = [];
        const portIds = getNodePorts(i);

        for (let p = 0; p < portIds.length; p++) {
            const portId = portIds[p];
            const portInfo = typeInfo.ports[ports.order[portId]];

            const connectedTo = ports.connectedTo[portId];
            if (portInfo.output && portInfo.editor) {
                const defaultValue = portInfo.defaultValue;
                const value = ports.value[portId];

                if (value !== defaultValue) {
                    portsArray.push({
                        label: portInfo.label,
                        value,
                    });
                }
            }
            else if (!portInfo.output && connectedTo) {
                const connectedToNode = ports.nodeId[connectedTo];
                const connectedNodeTypeInfo = types[nodes.type[connectedToNode]];
                const connectedPortInfo = connectedNodeTypeInfo.ports[ports.order[connectedTo]];

                portsArray.push({
                    label: portInfo.label,
                    connectedTo: {
                        nodeId: connectedToNode,
                        label: connectedPortInfo.label,
                    }
                });
            }
        }

        const node = {
            id: i,
            type: types[nodes.type[i]].type,
            x: nodes.x[i],
            y: nodes.y[i],
            ports: portsArray,
        };

        result.nodes.push(node);
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

        nodes.num = 0;
        nodes.numDeleted = 0;
        ports.num = 0;
        ports.numDeleted = 0;

        let prevNodeId = 0;

        // Load all the nodes
        for (let i = 0; i < graph.nodes.length; i++) {
            const node = graph.nodes[i];
            nodes.deleted[node.id] = 0;
            if (node.id - 1 > prevNodeId) {
                for (let d=prevNodeId + 1; d < node.id; d++) {
                    nodes.deleted[d] = 1;
                    nodes.numDeleted++;
                }
            }
            prevNodeId = addNodeWithId(nodes, node.id, node.type, node.x, node.y);
            nodes.num = Math.max(nodes.num, prevNodeId);
        }

        // Connect the nodes
        for (let i = 0; i < graph.nodes.length; i++) {
            const node = graph.nodes[i];
            const nodeId = node.id;
            for (let p = 0; p < node.ports.length; p++) {
                const port = node.ports[p];
                if (port.connectedTo) {
                    const portFrom = findPortByLabel(port.connectedTo.nodeId, port.connectedTo.label);
                    const portTo = findPortByLabel(nodeId, port.label);

                    addConnection(portFrom, portTo);
                }
                else {
                    const portId = findPortByLabel(nodeId, port.label);
                    ports.value[portId] = port.value;
                }
            }
        }
    }
}