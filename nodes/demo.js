import { drawBox } from './draw.js';
import { Context } from './context.js';
import { grid } from './grid.js';
import { addNode, nodes } from './nodes.js';
import { loop } from './loop.js';

// Define the plot
const node1 = addNode(nodes, 'number', 10, 10);
const node2 = addNode(nodes, 'displayNumber', 300, 120);

const ctx = new Context('container', 1000, 600, () => loop(ctx));
ctx.requestRedraw();