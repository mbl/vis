import { generateData } from '../generateData.js';

if (!navigator.gpu || GPUBufferUsage.COPY_SRC === undefined)
    document.body.className = 'error';

const triangleAttributeNum  = 0;
const positionAttributeNum  = 1;
const colorAttributeNum     = 2;

const transformBindingNum   = 0;
const uXzAngleBindingNum    = 1;
const uXwAngleBindingNum    = 2;
const uYwAngleBindingNum    = 3;

// Normal 3D rotations
let xzAngle = 0.0; // Rotation around YW
let xyAngle = 0.0; // Rotation around ZW
let yzAngle = 0.0; // Rotation around XW

// "4D" rotations
let xwAngle = 0.0; // Rotation around YZ
let ywAngle = 0.0; // Rotation around XZ
let zwAngle = 0.0; // Rotation around XY

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
    constant float4x4[] modelViewProjectionMatrix : register(b${transformBindingNum}),
    constant float[] uXzAngle : register(b${uXzAngleBindingNum}),
    constant float[] uXwAngle : register(b${uXwAngleBindingNum}),
    constant float[] uYwAngle : register(b${uYwAngleBindingNum}))
{
    FragmentData out;

    float a1 = uXzAngle[0] * 0.0;
    float a2 = uXwAngle[0] * 0.0;
    float a3 = uYwAngle[0] * 0.0;

    float tx = position.x * cos(a1) - position.z * sin(a1);
    float ty = position.y;
    float tz = position.x * sin(a1) + position.z * cos(a1);
    float tw = position.w;

    float t = tx * cos(a2) - tw * sin(a2);
    tw = tx * sin(a2) + tw * cos(a2);
    tx = t;

    t =  ty * cos(a3) - tw * sin(a3);
    tw = ty * sin(a3) + tw * cos(a3);
    ty = t;

    out.position = mul(modelViewProjectionMatrix, float4(tx, ty, tz, 1.0)) + float4(triangle.x * 0.003, triangle.y * 0.003, 0.0, 0.0);
    // out.position = float4(triangle.x, triangle.y, 1.0, 1.0);
    out.color = float4(1.0, 0.0, 0.0, 1.0);
    
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
const numInstances = 10;
const verticesArray = generateData(numInstances);

async function init() {
    const adapter = await navigator.gpu.requestAdapter();
    device = await adapter.requestDevice();
    device.pushErrorScope('validation');
    device.pushErrorScope('out-of-memory');

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
    const uXzAngleBufferBindGroupLayoutBinding = {
        binding: uXzAngleBindingNum,
        visibility: GPUShaderStage.VERTEX,
        type: "uniform-buffer"
    };
    const uXwAngleBufferBindGroupLayoutBinding = {
        binding: uXwAngleBindingNum,
        visibility: GPUShaderStage.VERTEX,
        type: "uniform-buffer"
    };
    const uYwAngleBufferBindGroupLayoutBinding = {
        binding: uYwAngleBindingNum,
        visibility: GPUShaderStage.VERTEX,
        type: "uniform-buffer"
    };

    const bindGroupLayoutDescriptor = {
        bindings: [
            transformBufferBindGroupLayoutBinding,
            uXzAngleBufferBindGroupLayoutBinding,
            uXwAngleBufferBindGroupLayoutBinding,
            uYwAngleBufferBindGroupLayoutBinding
        ]
    };
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

    let error = await device.popErrorScope();
    console.log(error);
    error = await device.popErrorScope();
    console.log(error);

    await render();
}

/* Transform Buffers and Bindings */
const transformSize = 4 * 16 + 3 * 4;

const transformBufferDescriptor = {
    size: transformSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.MAP_WRITE
};

let mappedGroups = [];

async function render() {
    device.pushErrorScope('validation');
    device.pushErrorScope('out-of-memory');
    if (mappedGroups.length === 0) {
        const [buffer, arrayBuffer] = device.createBufferMapped(transformBufferDescriptor);
        const group = device.createBindGroup(createBindGroupDescriptor(buffer));
        let mappedGroup = { buffer: buffer, arrayBuffer: arrayBuffer, bindGroup: group };
        await drawCommands(mappedGroup);
    } else {
        await drawCommands(mappedGroups.shift());
    }

    let error = await device.popErrorScope();
    console.log(error);
    error = await device.popErrorScope();
    console.log(error);

}

function createBindGroupDescriptor(transformBuffer) {
    const transformBufferBindGroupBinding = {
        binding: transformBindingNum,
        resource: {
            buffer: transformBuffer,
            offset: 0,
            size: 16 * 4
        }
    };

    const uXzAngleBufferBindGroupBinding = {
        binding: uXzAngleBindingNum,
        resource: {
            buffer: transformBuffer,
            offset: 16 * 4,
            size: 4
        }
    };

    const uXwAngleBufferBindGroupBinding = {
        binding: uXwAngleBindingNum,
        resource: {
            buffer: transformBuffer,
            offset: 16 * 4 + 4,
            size: 4
        }
    };

    const uYwAngleBufferBindGroupBinding = {
        binding: uYwAngleBindingNum,
        resource: {
            buffer: transformBuffer,
            offset: 16 * 4 + 8,
            size: 4
        }
    };

    return {
        layout: bindGroupLayout,
        bindings: [
            transformBufferBindGroupBinding,
            uXzAngleBufferBindGroupBinding,
            uXwAngleBufferBindGroupBinding,
            uYwAngleBufferBindGroupBinding
        ]
    };
}

async function drawCommands(mappedGroup) {
    device.pushErrorScope('out-of-memory');
    updateTransformArray(new Float32Array(mappedGroup.arrayBuffer));
    mappedGroup.buffer.unmap();
    console.log('1' + await device.popErrorScope());

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
    const time = Date.now();
    const timeSeconds = time / 10000;

    // Update uniforms
    xzAngle = (timeSeconds * Math.PI) % (Math.PI * 2);
    xwAngle = (timeSeconds * Math.PI * 0.3) % (Math.PI * 2);
    ywAngle = (timeSeconds * Math.PI * 1.2) % (Math.PI * 2);

    array.set(projectionMatrix);
    array[16] = xzAngle;
    array[17] = xwAngle;
    array[18] = ywAngle;
}

window.addEventListener("load", init);
