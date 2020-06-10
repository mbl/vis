import { nodes, getNodePorts } from "./nodes.js";
import { ports } from "./ports.js";
import { types } from "./types.js";
import { connectedTo } from "./connections.js";

/**
 * Run the interpreter until all possible nodes are evaluated.
 */
export function run(ctx) {
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
            const typeInfo = types[nodes.type[nodeId]];
            const input = [];
            let readyToEvaluate = true;
            for (let p=0; p<portIds.length; p++) {
                const portId = portIds[p];
                if (!ports.output[portId]) {
                    const outputPortId = connectedTo(portId);
                    if (outputPortId) {
                        // The node that provides the output
                        const outputNodeId = ports.nodeId[outputPortId];
                        if (!evaluated[outputNodeId]) {
                            readyToEvaluate = false;
                            break;
                        }
                        // Store value to input array
                        input[ports.order[portId]] = ports.value[outputPortId];
                    } 
                    else {
                        if (typeInfo.ports[ports.order[portId]].defaultValue) {
                            input[ports.order[portId]] = typeInfo.ports[ports.order[portId]].defaultValue;
                        }
                        else {
                            readyToEvaluate = false;
                            break;
                        }
                    }
                }
            }

            if (readyToEvaluate) {
                if (typeInfo.evaluate) {
                    const result = typeInfo.evaluate.apply(null, input);
                    let outputNum = 0;
                    for (let i=1; i<=ports.num; i++) {
                        if (ports.nodeId[i] === nodeId && ports.output[i]) {
                            ports.value[i] = result[outputNum];
                            outputNum++;
                        }
                    }
                }

                evaluated[nodeId] = true;
                numEvaluated++;
                // ctx.drawText(nodes.x[nodeId]-10, nodes.y[nodeId]-10, 10, 10, numEvaluated.toString(), 'red', 15);
            }
        }
    }
}