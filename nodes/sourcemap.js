// Thanks to source-map npm for the idea
const intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

export class SourceMap {
    constructor() {
        
    }
}

/**
 * Variable Length Quantity encoding
 * @param {number} n Integer to encode
 * @returns {string} VLQ-encoded version of the number ready to use in sourcemap
 */
export function vlq(n) {
    // Positive number to actually encode with sign as least significant bit
    let i = n | 0;
    let v = i < 0 ? (-i << 1) + 1 : (i << 1) + 0;

    let result = '';

    do {
        let chunk = v & 0x1f; // Take five bits
        v >>>= 5;
        if (v > 0) {
            chunk |= 0x20;
        }
        result += intToCharMap[chunk];
    } while(v > 0);

    return result;
}