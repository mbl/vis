import { Context } from './context.js';
import { loop } from './loop.js';
import { load } from './serialization.js';

load();

const ctx = new Context('container', () => loop(ctx));
ctx.requestRedraw();
