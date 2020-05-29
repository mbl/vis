import { run, config } from './canvas/4d.js';
config.width = 450;
config.height = 450;
config.numRectangles = 2000;
config.backgroundColor = '#354147';
config.color = (i, wv) => `rgb(34, 45, ${i % 10 !== 0 ? 61 : 10})`;
run();
