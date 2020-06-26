import { PortType } from "./types.js";

/**
 * @param {string} source JavaScript code that performs the calculation.
 * A node with input ports a and b and output port c will define
 * variables a, b, c where a, b will be initialized to the input,
 * and assigning to c will result in returning the value as output.
 * @param {PortType[]} ports Definition of input/output ports
 */
export function compile(source, ports) {
    let sourceCode = '';
    if (vectorizationNeeded(ports)) {
        sourceCode += vectorizationPrefix(ports);
        sourceCode += '// Original code\n';
        sourceCode += source + '\n';
        sourceCode += vectorizationSuffix(ports);
    }
    else {
        sourceCode += simplePrefix(ports);
        sourceCode += '// Original code\n';
        sourceCode += source + '\n';
        sourceCode += simpleSuffix(ports);
    }

    return new Function(sourceCode);
}

/**
 * @param {PortType[]} ports Information about ports.
 * @return {boolean} True if vectorization is needed.
 */
function vectorizationNeeded(ports) {
    return !!ports.find(p => p.type.endsWith('[]'));
}

function simplePrefix(ports) {
    let result = '// Function prefix\n';
    ports.forEach((p, i) => {
        if (!p.output) {
            result += `const ${p.name} = arguments[${i}];\n`;
        }
    });
    return result;
}

function simpleSuffix(ports) {
    let result = '// Return suffix\n';
    
    result += `return [`;

    ports.forEach((p) => {
        if (p.output) {
            result += `${p.name}, `;
        }
    });

    result += `];`;

    return result;
}

/**
 * @param {PortType[]} ports
 */
function vectorizationPrefix(ports) {
    let result = '// Vectorization prefix\n';

    ports.forEach((p, i) => {
        if (!p.output) {
            result += `const _${p.name} = ArrayBuffer.isView(arguments[${i}]) ? arguments[${i}] : [arguments[${i}]];\n`;
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

function vectorizationSuffix(ports) {
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

    result += `];`;

    return result;
}