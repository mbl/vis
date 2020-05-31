import { run, config } from './canvas/4d.js';
config.width = 450;
config.height = 450;
config.numRectangles = 2000;
config.backgroundColor = '#354147';
config.color = (i, wv) => { const x = 23 + (i % 20); return `rgb(${x}, ${x + 6}, ${x + 12})`; };
run();
