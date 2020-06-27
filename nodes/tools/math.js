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
export function moveTo(from, to, speed = 1) {
    if (Math.abs(from - to) < speed) {
        return to;
    }
    return from + speed * Math.sign(to - from);
}

export function lerp(a, b, t) {
    // Note this is numerically unstable
    return a + (b - a) * t;
}

export function bezier(t, p0, p1, p2, p3) {
    var cX = 3 * (p1.x - p0.x),
        bX = 3 * (p2.x - p1.x) - cX,
        aX = p3.x - p0.x - cX - bX;

    var cY = 3 * (p1.y - p0.y),
        bY = 3 * (p2.y - p1.y) - cY,
        aY = p3.y - p0.y - cY - bY;

    // TODO: improve
    var x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
    var y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

    return { x: x, y: y };
}

/**
 * PRNG from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 */
export function xoshiro128ss(a, b, c, d) {
    return function () {
        var t = b << 9, r = a * 5; r = (r << 7 | r >>> 25) * 9;
        c ^= a; d ^= b;
        b ^= c; a ^= d; c ^= t;
        d = d << 11 | d >>> 21;
        return (r >>> 0) / 4294967296;
    }
}

/**
 * Assumes that the input string ends in a newline
 * @param {string} s Text to count lines in
 * @return {number} Number of lines in the string
 */
export function numLines(s) {
    console.assert(s.length > 0 && s[s.length - 1] === '\n', 'Must end in newline');
    const l = s.length;
    let rows = 0;
    let offset = -1;
    while ((offset = s.indexOf('\n', offset + 1)) !== -1) {
       rows++;
    }
    return rows;
}