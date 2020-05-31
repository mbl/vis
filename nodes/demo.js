import { node } from './node.js';
import { Context } from './context.js';
import { grid } from './grid.js';
import { addNode, nodes } from './nodes.js';
import { loop } from './loop.js';
import { addPort, ports } from './ports.js';

// Define the plot
const node1 = addNode(nodes, 1, 10, 10, 500, 200, 0xffff0000, 'Node 0');
const node2 = addNode(nodes, 2, 300, 120, 200, 150, 0xff00ff00, 'Node 1');

const port1 = addPort(ports, node1, 1);
const port2 = addPort(ports, node2, 2);

const ctx = new Context('container', 1000, 600, () => loop(ctx));
ctx.requestRedraw();