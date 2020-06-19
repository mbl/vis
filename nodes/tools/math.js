/**
 * Assume a < b.
 */
export function clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}

/**
 * Move the 'from' value towards 'to' at given speed.
 * @param {number} from 
 * @param {number} to 
 * @param {number} speed 
 */
export function moveTo(from, to, speed=1) {
    if (Math.abs(from - to) < speed) {
        return to;
    }
    return from + speed * Math.sign(to - from);
}