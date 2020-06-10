import { Context } from './context.js';
import { addNode, nodes, getNodePorts } from './nodes.js';
import { loop } from './loop.js';
import { addConnection } from './connections.js';

// Serialization
// Add/remo node

// Define the plot
// const number1 = addNode(nodes, 'number', 10, 10);
// const number2 = addNode(nodes, 'number', 10, 100);
// const plus = addNode(nodes, 'plus', 170, 20);
// const display1 = addNode(nodes, 'displayNumber', 300, 120);
// const display2 = addNode(nodes, 'displayNumber', 150, 220);

// addConnection(getNodePorts(number1)[0], getNodePorts(plus)[0]);
// addConnection(getNodePorts(number2)[0], getNodePorts(plus)[1]);
// addConnection(getNodePorts(plus)[2], getNodePorts(display1)[0]);


const ctx = new Context('container', 1000, 600, () => loop(ctx));
ctx.requestRedraw();
