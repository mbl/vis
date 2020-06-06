import { nodes, getNodePorts } from "./nodes.js";
import { ports } from "./ports.js";
import { connectedTo } from "./connections.js";

export function run() {
    const evaluated = new Array(nodes.num);
    let numEvaluated = 0;
    let prevNumEvaluated = -1;

    while(numEvaluated < nodes.num && prevNumEvaluated < numEvaluated) {
        prevNumEvaluated = numEvaluated;

        for (let nodeId=1; nodeId<=nodes.num; nodeId++) {
            if (evaluated[nodeId]) {
                continue;
            }

            const portIds = getNodePorts(nodeId);
            let readyToEvaluate = true;
            for (let p=0; p<portIds.length; p++) {
                const portId = portIds[p];
                if (!ports.output[portId]) {
                    const outputPortId = connectedTo(portId);
                    if (outputPortId) {
                        // The node that provides the output
                        const outputNodeId = ports.nodeId[outputPortId]
                        if (!evaluated[outputPortId]) {
                            readyToEvaluate = false;
                            break;
                        }
                    } 
                    else {
                        readyToEvaluate = false;
                        break;
                    }
                }
            }

            if (readyToEvaluate) {
                // TODO: Evaluate
                evaluated[nodeId] = true;
                numEvaluated++;
            }
        }
    }
}