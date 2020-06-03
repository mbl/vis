import { node } from "../draw";

/** A node that supplies a number */
export function number(ctx, id, x, y, w, h, selected=false) {
    node(ctx, id, x, y, w, h, 0xffcce00e, selected);
}

export function addNumber(nodes, x, y) {
    const i = allocateNode(nodes);

    
    nodes.x[i] = x;
    nodes.y[i] = y;
    nodes.w[i] = 100;
    nodes.h[i] = 50;

    return i;
}
