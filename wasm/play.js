fetch("math.wasm").then(reponse =>
    reponse.arrayBuffer()
).then(bytes =>
    WebAssembly.instantiate(bytes, {})
).then(result =>
    result.instance
).then(main);

function main(wasm) {
    const result = wasm.exports.add(1, 2);
    console.log(result);
}
