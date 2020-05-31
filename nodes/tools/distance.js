import { clamp } from './math.js'

/**
 * Returns minimum distance from a given point to any point within rectangle.
 * 
 * @param {{x, y}} point 
 * @param {*} x 
 * @param {*} y 
 * @param {*} w 
 * @param {*} h 
 */
export function distancePointToRectangle(point, x, y, w, h) {
    const closestX = clamp(point.x, x, x + w);
    const closestY = clamp(point.y, y, y + h);

    const dX = point.x - closestX;
    const dY = point.y - closestY;

    return Math.sqrt(dX * dX + dY * dY);
}
