/**
 * 
 * @param {number} color ARGB color to convert
 * @returns {string} rgba(r, g, b, a) string
 */
export function colorARGBToCSS(color) {
    return `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${Math.round((color >>> 24) / 255.0 * 1000.0) / 1000.0})`;
}