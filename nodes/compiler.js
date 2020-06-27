import { NodeType, PortType } from "./types.js";
import { SourceMap } from "./sourcemap.js";

/**
 * Turn the node's source code into 
 * vectorized javascript source code.
 * 
 * @param {NodeType} nodeType 
 * @param {SourceMap} sourceMap
 * @returns {string} Vectorized javascript code
 */
export function compileType(nodeType, sourceMap) {
    let sourceCode = '';
    const source = nodeType.source;
    const ports = nodeType.ports;
    if (vectorizationNeeded(ports)) {
        sourceCode += sourceMap.skipChunk(vectorizationPrefix(nodeType) + '\t\t// Original code -----\n');
        sourceCode += sourceMap.appendChunk(`${nodeType.type}.js`, source + '\n');
        sourceCode += sourceMap.skipChunk(vectorizationSuffix(nodeType));
    }
    else {
        sourceCode += sourceMap.skipChunk(simplePrefix(nodeType) + '\t// Original code -----\n');
        sourceCode += sourceMap.appendChunk(`${nodeType.type}.js`, source + '\n');
        sourceCode += sourceMap.skipChunk(simpleSuffix(nodeType));
    }
    return sourceCode;
}

/**
 * @param {string} compiled Resulting compiled code
 * @param {SourceMap} sourceMap Source map for the compiled code
 * @returns {Promise<{}>} Compiled ES6 module exporting all the functions needed
 */
export async function importCompiled(compiled, sourceMap) {
    // const sourceMapBlob = new Blob([sourceMap.toString()], { type: 'application/json' });
    // const sourceMapUrl = URL.createObjectURL(sourceMapBlob);
    const sourceMapUrl = `data:application/json;base64,${btoa(sourceMap.toString())}`;

    compiled += `//# sourceMappingURL=${sourceMapUrl}`;

    const compiledBlob = new Blob([compiled], { type: 'text/javascript' });
    const compiledBlobUrl = URL.createObjectURL(compiledBlob);
    const module = await import(compiledBlobUrl);

    // TODO - store URLs for future unloading

    return module;
}

/**
 * @param {PortType[]} ports Information about ports.
 * @return {boolean} True if vectorization is needed.
 */
function vectorizationNeeded(ports) {
    return !!ports.find(p => p.type.endsWith('[]'));
}

/**
 * @param {NodeType} nodeType
 */
function simplePrefix(nodeType) {
    const ports = nodeType.ports;
    let result = '// Function prefix\n';
    result += `export function ${nodeType.type}(`;
    result += ports.filter(p => !p.output).map(p => p.name).join(', ');
    result += ') {'
    return result;
}

function simpleSuffix(nodeType) {
    const ports = nodeType.ports;
    let result = '// Original code end -----\n';
    
    result += `\treturn [`;

    ports.forEach((p) => {
        if (p.output) {
            result += `${p.name}, `;
        }
    });

    result += `];\n}\n`;

    return result;
}

/**
 * @param {NodeType} nodeType
 */
function vectorizationPrefix(nodeType) {
    const ports = nodeType.ports;
    let result = '\n';

    result += `export function ${nodeType.type}(`;
    result += ports.filter(p => !p.output).map(p => p.name).join(', ');
    result += ') {\n';

    ports.forEach((p, i) => {
        if (!p.output) {
            result += `\tconst _${p.name} = ArrayBuffer.isView(${p.name}) ? ${p.name} : [${p.name}];\n`;
        }
        else {
            result += `\tlet ${p.name};\n`
        }
    });

    result += '\tconst _l = Math.max(';
    ports.forEach((p) => {
        if (!p.output) {
            const variableName = `_${p.name}`;
            result += `${variableName}.length, `;
        }
    });
    result += '1);\n';  // TODO improve

    ports.forEach((p) => {
        if (p.output) {
            result += `\tconst _${p.name} = new Float32Array(_l);\n`;
        }
    });

    result += `\tfor (let __i = 0; __i < _l; __i++) {\n`;

    ports.forEach((p) => {
        if (!p.output) {
            const variableName = `_${p.name}`;
            result += `\t\tconst ${p.name} = ${variableName}[__i % ${variableName}.length];\n`;
        }
    });

    return result;
}

function vectorizationSuffix(nodeType) {
    const ports = nodeType.ports;
    let result = '\t\t// Original code end -----\n';

    ports.forEach((p) => {
        if (p.output) {
            result += `\t\t_${p.name}[__i] = ${p.name};\n`;
        }
    });

    result += '\t}\n';

    result += `\treturn [`;

    ports.forEach((p) => {
        if (p.output) {
            result += `_l === 1 ? _${p.name}[0] : _${p.name}, `;
        }
    });

    result += `];\n}\n`;

    return result;
}