import { NodeType, PortType } from "./types.js";

/**
 * @param {NodeType} nodeType
 */
export async function compile(nodeType) {
    let sourceCode = '';
    const source = nodeType.source;
    const ports = nodeType.ports;
    if (vectorizationNeeded(ports)) {
        sourceCode += vectorizationPrefix(nodeType);
        sourceCode += '// Original code\n';
        sourceCode += source + '\n';
        sourceCode += vectorizationSuffix(nodeType);
    }
    else {
        sourceCode += simplePrefix(nodeType);
        sourceCode += '// Original code\n';
        sourceCode += source + '\n';
        sourceCode += simpleSuffix(nodeType);
    }

    const sourceBlob = new Blob([sourceCode], { type: 'text/javascript' });
    // TODO - store this URL for future unloading
    const blobUrl = URL.createObjectURL(sourceBlob);
    const module = await import(blobUrl);
    const f = module[nodeType.type];
    return f;
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
    let result = '// Return suffix\n';
    
    result += `return [`;

    ports.forEach((p) => {
        if (p.output) {
            result += `${p.name}, `;
        }
    });

    result += `];\n}`;

    return result;
}

/**
 * @param {NodeType} nodeType
 */
function vectorizationPrefix(nodeType) {
    const ports = nodeType.ports;
    let result = '// Vectorization prefix\n';

    result += `export function ${nodeType.type}(`;
    result += ports.filter(p => !p.output).map(p => p.name).join(', ');
    result += ') {\n';

    ports.forEach((p, i) => {
        if (!p.output) {
            result += `const _${p.name} = ArrayBuffer.isView(${p.name}) ? ${p.name} : [${p.name}];\n`;
        }
        else {
            result += `let ${p.name};\n`
        }
    });

    result += 'const _l = Math.max(';
    ports.forEach((p) => {
        if (!p.output) {
            const variableName = `_${p.name}`;
            result += `${variableName}.length, `;
        }
    });
    result += '1);\n';  // TODO improve

    ports.forEach((p) => {
        if (p.output) {
            result += `const _${p.name} = new Float32Array(_l);\n`;
        }
    });

    result += `for (let __i = 0; __i < _l; __i++) {\n`;

    ports.forEach((p) => {
        if (!p.output) {
            const variableName = `_${p.name}`;
            result += `\tconst ${p.name} = ${variableName}[__i % ${variableName}.length];\n`;
        }
    });

    return result;
}

function vectorizationSuffix(nodeType) {
    const ports = nodeType.ports;
    let result = '\t// Vectorization suffix\n';

    ports.forEach((p) => {
        if (p.output) {
            result += `\t_${p.name}[__i] = ${p.name};\n`;
        }
    });

    result += '}\n';

    result += `return [`;

    ports.forEach((p) => {
        if (p.output) {
            result += `_l === 1 ? _${p.name}[0] : _${p.name}, `;
        }
    });

    result += `];\n}`;

    return result;
}