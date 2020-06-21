import { PortType } from "./types.js";

/**
 * @param {string} source JavaScript code that performs the calculation.
 * A node with input ports a and b and output port c will define
 * variables a, b, c where a, b will be initialized to the input,
 * and assigning to c will result in returning the value as output.
 * @param {PortType[]} ports Definition of input/output ports
 */
export function compile(source, ports) {
// TODO: Turn
//         source: 'c = a + b;',

// Into:

// evaluate: (a, b) => {
//     const l = Math.max(al(a), al(b));
//     const result = new Float32Array(l);
//     for (let i = 0; i < l; i++) {
//         const av = gv(a, i);
//         const bv = gv(b, i);
//         result[i] = av + bv;
//     }
//     return ra(result);
// },

    let sourceCode = functionPrefix(ports);

    if (vectorizationNeeded(ports)) {
        sourceCode += vectorizationPrefix(ports);
        sourceCode += source + '\n';
        sourceCode += vectorizationSuffix(ports);
    }
    else {
        sourceCode += source + '\n';
        sourceCode += returnSuffix(ports);
    }

    console.log(sourceCode);
    // debugger;
    return new Function(sourceCode);
}

/**
 * @param {PortType[]} ports Information about ports.
 * @return {boolean} True if vectorization is needed.
 */
function vectorizationNeeded(ports) {
    return !!ports.find(p => p.type.endsWith('[]'));
}

function functionPrefix(ports) {
    let result = '// Function prefix\n';    
    ports.forEach((p, i) => {
        if (!p.output) {
            result += `const ${p.name} = arguments[${i}];\n`;
        }
    });
    return result;
}

function vectorizationPrefix(ports) {
//     const l = Math.max(al(a), al(b));
//     const result = new Float32Array(l);
//     for (let i = 0; i < l; i++) {
//         const av = gv(a, i);
//         const bv = gv(b, i);
    let result = '// Vectorization prefix\n';
    return result;
}

function vectorizationSuffix(ports) {
    let result = '// Vectorization suffix\n';
    return result;
}

function returnSuffix(ports) {
    let result = '// Return suffix\n';
    return result;
}