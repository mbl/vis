import { generateData } from '../generateData.js';

if (!navigator.gpu || GPUBufferUsage.COPY_SRC === undefined)
    document.body.className = 'error';

const triangleAttributeNum  = 0;
const positionAttributeNum  = 1;
const colorAttributeNum = 2;

const transformBindingNum   = 0;

const bindGroupIndex        = 0;

const trianglesArray = new Float32Array([
    1.0, 1.0, // Triangle 1
    -1.0, 1.0,
    1.0, -1.0,

    -1.0, 1.0, // Triangle 2
    1.0, -1.0,
    -1.0, -1.0
]);

// WHLSL
const shader = `
struct FragmentData {
    float4 position : SV_Position;
    float4 color : attribute(${colorAttributeNum});
}

vertex FragmentData vertex_main(
    float2 triangle : attribute(${triangleAttributeNum}), 
    float4 position : attribute(${positionAttributeNum}), 
    float4 color : attribute(${colorAttributeNum}), 
    constant float4x4[] modelViewProjectionMatrix : register(b${transformBindingNum}))
{
    FragmentData out;
    position.w = 1.0;
    out.position = mul(modelViewProjectionMatrix[0], position);
    out.position.xy += triangle * 0.003;
    out.color = color;
    
    return out;
}

fragment float4 fragment_main(float4 color : attribute(${colorAttributeNum})) : SV_Target 0
{
    return color;
}
`;

let device, swapChain, verticesBuffer, trianglesBuffer, bindGroupLayout, pipeline, renderPassDescriptor;
let projectionMatrix = new Float32Array([
//  x  , y  , z  , w
//  ^
//  |
    1  , 0  , 0  , 0, // x is multiplied by <---
    0  , 1  , 0  , 0, // y
    0  , 0  , 0.1 , 1, // z
    0  , 0  , 0.2 , 1.5  // w = 1.0
]);

const colorOffset = 4 * 4;
const vertexSize = 4 * 8;
const numInstances = 1000000;
const verticesArray = generateData(numInstances);

async function init() {
    const adapter = await navigator.gpu.requestAdapter();
    device = await adapter.requestDevice();

    const canvas = document.querySelector('canvas');
    let canvasSize = canvas.getBoundingClientRect();
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const aspect = Math.abs(canvas.width / canvas.height);
    // mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);

    const context = canvas.getContext('gpu');

    const swapChainDescriptor = { 
        device: device, 
        format: "bgra8unorm"
    };
    swapChain = context.configureSwapChain(swapChainDescriptor);

    const shaderModuleDescriptor = { code: shader, isWHLSL: true };
    const shaderModule = device.createShaderModule(shaderModuleDescriptor);

    // Instance buffer
    const verticesBufferDescriptor = { 
        size: verticesArray.byteLength, 
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    };
    let verticesArrayBuffer;
    [verticesBuffer, verticesArrayBuffer] = device.createBufferMapped(verticesBufferDescriptor);

    const verticesWriteArray = new Float32Array(verticesArrayBuffer);
    verticesWriteArray.set(verticesArray);
    verticesBuffer.unmap();

    // Triangle buffer
    const trianglesBufferDescriptor = { 
        size: trianglesArray.byteLength, 
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    };
    let trianglesArrayBuffer;
    [trianglesBuffer, trianglesArrayBuffer] = device.createBufferMapped(trianglesBufferDescriptor);

    const trianglesWriteArray = new Float32Array(trianglesArrayBuffer);
    trianglesWriteArray.set(trianglesArray);
    trianglesBuffer.unmap();

    // Vertex Input
    const triangleAttributeDescriptor = {
        shaderLocation: triangleAttributeNum,
        offset: 0,
        format: "float2"
    };
    const triangleBufferDescriptor = {
        attributeSet: [triangleAttributeDescriptor],
        stride: 2 * 4,
        stepMode: "vertex" // ???
        // ANGLE divisor???
    };

    const positionAttributeDescriptor = {
        shaderLocation: positionAttributeNum,
        offset: 0,
        format: "float4"
    };
    const colorAttributeDescriptor = {
        shaderLocation: colorAttributeNum,
        offset: colorOffset,
        format: "float4"
    }
    const vertexBufferDescriptor = {
        attributeSet: [positionAttributeDescriptor, colorAttributeDescriptor],
        stride: vertexSize,
        stepMode: "instance"
    };
    const vertexInputDescriptor = { 
        vertexBuffers: [vertexBufferDescriptor, triangleBufferDescriptor] 
    };

    // Bind group binding layout
    const transformBufferBindGroupLayoutBinding = {
        binding: transformBindingNum, // id[[(0)]]
        visibility: GPUShaderStage.VERTEX,
        type: "uniform-buffer"
    };

    const bindGroupLayoutDescriptor = { bindings: [transformBufferBindGroupLayoutBinding] };
    bindGroupLayout = device.createBindGroupLayout(bindGroupLayoutDescriptor);

    // Pipeline
    const depthStateDescriptor = {
        depthWriteEnabled: true,
        depthCompare: "less"
    };

    const pipelineLayoutDescriptor = { bindGroupLayouts: [bindGroupLayout] };
    const pipelineLayout = device.createPipelineLayout(pipelineLayoutDescriptor);
    const vertexStageDescriptor = {
        module: shaderModule,
        entryPoint: "vertex_main"
    };
    const fragmentStageDescriptor = {
        module: shaderModule,
        entryPoint: "fragment_main"
    };
    const colorState = {
        format: "bgra8unorm",
        alphaBlend: {
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha",
            operation: "add"
        },
        colorBlend: {
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha",
            operation: "add"
        },
        writeMask: GPUColorWrite.ALL
    };
    const pipelineDescriptor = {
        layout: pipelineLayout,

        vertexStage: vertexStageDescriptor,
        fragmentStage: fragmentStageDescriptor,

        primitiveTopology: "triangle-list",
        colorStates: [colorState],
        depthStencilState: depthStateDescriptor,
        vertexInput: vertexInputDescriptor
    };
    pipeline = device.createRenderPipeline(pipelineDescriptor);

    let colorAttachment = {
        // attachment is acquired in render loop.
        loadOp: "clear",
        storeOp: "store",
        clearColor: { r: 0.15, g: 0.15, b: 0.5, a: 1.0 } // GPUColor
    };

    // Depth stencil texture

    // GPUExtent3D
    const depthSize = {
        width: canvas.width,
        height: canvas.height,
        depth: 1
    };

    const depthTextureDescriptor = {
        size: depthSize,
        arrayLayerCount: 1,
        mipLevelCount: 1,
        sampleCount: 1,
        dimension: "2d",
        format: "depth32float-stencil8",
        usage: GPUTextureUsage.OUTPUT_ATTACHMENT
    };

    const depthTexture = device.createTexture(depthTextureDescriptor);

    // GPURenderPassDepthStencilAttachmentDescriptor
    const depthAttachment = {
        attachment: depthTexture.createDefaultView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        clearDepth: 1.0
    };

    renderPassDescriptor = { 
        colorAttachments: [colorAttachment],
        depthStencilAttachment: depthAttachment
    };

    render();
}

/* Transform Buffers and Bindings */
const transformSize = 4 * 16;

const transformBufferDescriptor = {
    size: transformSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.MAP_WRITE
};

let mappedGroups = [];

function render() {
    if (mappedGroups.length === 0) {
        const [buffer, arrayBuffer] = device.createBufferMapped(transformBufferDescriptor);
        const group = device.createBindGroup(createBindGroupDescriptor(buffer));
        let mappedGroup = { buffer: buffer, arrayBuffer: arrayBuffer, bindGroup: group };
        drawCommands(mappedGroup);
    } else
        drawCommands(mappedGroups.shift());
}

function createBindGroupDescriptor(transformBuffer) {
    const transformBufferBinding = {
        buffer: transformBuffer,
        offset: 0,
        size: transformSize
    };
    const transformBufferBindGroupBinding = {
        binding: transformBindingNum,
        resource: transformBufferBinding
    };
    return {
        layout: bindGroupLayout,
        bindings: [transformBufferBindGroupBinding]
    };
}

function drawCommands(mappedGroup) {
    updateTransformArray(new Float32Array(mappedGroup.arrayBuffer));
    mappedGroup.buffer.unmap();

    const commandEncoder = device.createCommandEncoder();
    renderPassDescriptor.colorAttachments[0].attachment = swapChain.getCurrentTexture().createDefaultView();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    // Encode drawing commands

    passEncoder.setPipeline(pipeline);
    // Vertex attributes
    passEncoder.setVertexBuffers(0, [verticesBuffer, trianglesBuffer], [0, 0]);
    // Bind groups
    passEncoder.setBindGroup(bindGroupIndex, mappedGroup.bindGroup);
    
    // vertices, instances, first vertex, first instance
    passEncoder.draw(6, numInstances, 0, 0);
    passEncoder.endPass();

    device.getQueue().submit([commandEncoder.finish()]);

    // Ready the current buffer for update after GPU is done with it.
    mappedGroup.buffer.mapWriteAsync().then((arrayBuffer) => {
        mappedGroup.arrayBuffer = arrayBuffer;
        mappedGroups.push(mappedGroup);
    });

    requestAnimationFrame(render);
}

function updateTransformArray(array) {
    array.set(projectionMatrix);
}

window.addEventListener("load", init);