import { Context } from './context.js';
import { addNode, nodes, getNodePorts } from './nodes.js';
import { loop } from './loop.js';
import { connections, addConnection } from './connections.js';

// Define the plot
const node1 = addNode(nodes, 'number', 10, 10);
const node2 = addNode(nodes, 'displayNumber', 300, 120);
const node3 = addNode(nodes, 'displayNumber', 200, 220);

const ports1 = getNodePorts(node1);
const ports2 = getNodePorts(node2);
const ports3 = getNodePorts(node3);

const ctx = new Context('container', 1000, 600, () => loop(ctx));
ctx.requestRedraw();
