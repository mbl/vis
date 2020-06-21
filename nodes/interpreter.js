import { nodes } from "./nodes.js";
import { types } from "./types.js";
import { Context } from "./context.js";

/**
 * Run the interpreter until all possible nodes are evaluated.
 * @param {Context} ctx
 */
export function run(ctx) {
    const evaluated = new Array(nodes.length);
    let numEvaluated = 0;
    let prevNumEvaluated = -1;

    while(numEvaluated < nodes.length && prevNumEvaluated < numEvaluated) {
        prevNumEvaluated = numEvaluated;

        for (let nodeId=0; nodeId<nodes.length; nodeId++) {
            if (evaluated[nodeId]) {
                continue;
            }

            const node = nodes[nodeId];
            const typeInfo = node.type;
            const input = [];
            let readyToEvaluate = true;
            for (let p=0; p<node.ports.length; p++) {
                const port = node.ports[p];
                if (!port.type.output) {
                    const outputPort = port.connectedTo;
                    if (outputPort) {
                        // The node that provides the output
                        const outputNode = outputPort.node;
                        if (!evaluated[outputNode.id]) {
                            readyToEvaluate = false;
                            break;
                        }
                        // Store value to input array
                        input[p] = outputPort.value;
                    } 
                    else {
                        if (typeInfo.ports[p].defaultValue !== undefined) {
                            input[p] = port.value;
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
                    const result = typeInfo.evaluate.apply(ctx, input);
                    let outputNum = 0;
                    for (let i=0; i<node.ports.length; i++) {
                        const port = node.ports[i];
                        if (port.type.output) {
                            port.value = result[outputNum];
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