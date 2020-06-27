import { numLines } from "./tools/math.js";

// Thanks to source-map npm for the idea
const intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

export class SourceMap {
    constructor() {
        // Outputs to be stored within the sourcemap file
        this.version = 3;
        this.file = undefined;
        this.sourceRoot = '';
        this.sources = [];
        this.sourcesContent = [];
        this.names = [];
        this.mappings = '';

        // Current state (everything is 0-based)
        this.sourceIndex = 0; // Last referenced source file
        this.compiledRow = -1; // Last successfully mapped row index (0-based)
        this.compiledColumn = 0; // Last referenced compiled column
        this.sourceRow = 0; // Last referenced source row
        this.sourceColumn = 0; // Last referenced source column
    }

    /**
     * 
     * @param {string} content What content to skip
     * @returns {string} content skipped
     */
    skipChunk(content) {
        const lines = numLines(content);
        this.mappings += `;`.repeat(lines);
        this.compiledRow += lines;
        return content;
    }

    /**
     * 
     * @param {string} sourceFileName Name of the file with original source code
     * @param {string} sourceContent Source content to append
     * @returns {string} Content appended
     */
    appendChunk(sourceFileName, sourceContent) {
        const sourceIndex = this.appendSource(sourceFileName, sourceContent);
        let rowMap = '';

        const lines = numLines(sourceContent);
        if (lines >= 1) {
            // New line, reset current positions

            // Output: 
            // 1) compiled column
            this.compiledColumn = 0;
            rowMap += vlq(this.compiledColumn);

            // 2) Relative source index
            rowMap += vlq(sourceIndex - this.sourceIndex);
            this.sourceIndex = sourceIndex;
            
            // 3) Source row - we always start with first row (== 0)
            rowMap += vlq(0 - this.sourceRow);
            this.sourceRow = 0;

            // 4) Source column
            rowMap += vlq(0 - this.sourceColumn);
            this.sourceColumn = 0;

            rowMap += ';'; // We mapped first line of our source code

            this.mappings += rowMap;

            // All the other lines are mapped 1-to-1, optimize
            this.mappings += 'AACA;'.repeat(lines - 1);
            
            this.sourceRow = lines - 1;
        }
        this.compiledRow += lines;
        return sourceContent;
    }

    toString() {
        return JSON.stringify({
            version: this.version,
            sourceRoot: this.sourceRoot,
            file: this.file,
            sources: this.sources,
            sourcesContent: this.sourcesContent,
            names: this.names,
            mappings: this.mappings,
        }, null, 2);
    }

    /**
     * Appends a new source file name to the list of sources.
     * Returns index of the source. If same source is added twice, same index is used.
     * 
     * @param {string} sourceFileName File name to append
     * @param {string} content Content to append.
     * @returns {number} Index of the source file in our list of sources
     */
    appendSource(sourceFileName, content) {
        let result = this.sources.findIndex(s => s === sourceFileName);
        if (result === -1) {
            this.sources.push(sourceFileName);
            this.sourcesContent.push(content);
            result = this.sources.length - 1;
        }
        else {
            console.assert(this.sourcesContent[result] === content, 'Source files of same name must have same content');
        }
        return result;
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