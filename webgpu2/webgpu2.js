import { generateData } from '../generateData.js';

export const triangleAttributeNum = 0;
export const positionAttributeNum = 1;
export const colorAttributeNum = 2;
export const transformBindingNum = 0;

if (!navigator.gpu || GPUBufferUsage.COPY_SRC === undefined)
    document.body.className = 'error';

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
const numInstances = 10000;
const verticesArray = generateData(numInstances);

async function checkError(label) {
    const error = await device.popErrorScope();
    if (error) console.log(`${label}: ${error.message}`);
    device.pushErrorScope('validation');
}

async function init() {
    const adapter = await navigator.gpu.requestAdapter();
    device = await adapter.requestDevice();
    device.pushErrorScope('validation');

    const canvas = document.querySelector('canvas');
    let canvasSize = canvas.getBoundingClientRect();
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const aspect = Math.abs(canvas.width / canvas.height);

    const context = canvas.getContext('gpupresent');

    const swapChainDescriptor = {
        device: device,
        format: "bgra8unorm"
    };
    swapChain = context.configureSwapChain(swapChainDescriptor);

    const vertexShaderCode = new Uint32Array(await fetch('main.vert.spv').then(response => response.arrayBuffer()));
    const fragmentShaderCode = new Uint32Array(await fetch('main.frag.spv').then(response => response.arrayBuffer()));

    const vertexShaderModule = device.createShaderModule(
        {
            code: vertexShaderCode
        }
    );

    await checkError('createShaderModule vertex ');

    const fragmentShaderModule = device.createShaderModule(
        {
            code: fragmentShaderCode 
        }
    );

    await checkError('createShaderModule fragment');

    // Instance buffer
    let verticesArrayBuffer;
    [verticesBuffer, verticesArrayBuffer] = device.createBufferMapped({
        size: verticesArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    const verticesWriteArray = new Float32Array(verticesArrayBuffer);
    verticesWriteArray.set(verticesArray);
    verticesBuffer.unmap();

    await checkError('instance buffer');

    // Triangle buffer
    let trianglesArrayBuffer;
    [trianglesBuffer, trianglesArrayBuffer] = device.createBufferMapped({
        size: trianglesArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    const trianglesWriteArray = new Float32Array(trianglesArrayBuffer);
    trianglesWriteArray.set(trianglesArray);
    trianglesBuffer.unmap();

    await checkError('triangle buffer');

    // Vertex Input
    const triangleBufferDescriptor = {
        attributeSet: [
            {
                shaderLocation: triangleAttributeNum,
                offset: 0,
                format: "float2"
            }
        ],
        arrayStride: 2 * 4,
        stepMode: "vertex"
    };

    const vertexBufferDescriptor = {
        attributeSet: [
            {
                shaderLocation: positionAttributeNum,
                offset: 0,
                format: "float4"
            }, 
            {
                shaderLocation: colorAttributeNum,
                offset: colorOffset,
                format: "float4"
            }
        ],
        arrayStride: vertexSize,
        stepMode: "instance"
    };  
    const vertexInputDescriptor = {
        vertexBuffers: [vertexBufferDescriptor, triangleBufferDescriptor]
    };

    // Bind group binding layout
    bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: transformBindingNum, // id[[(0)]]
                visibility: GPUShaderStage.VERTEX,
                type: "uniform-buffer"
            },
        ]
    });

    await checkError('createBindGroupLayout');

    // Pipeline
    const depthStateDescriptor = {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus-stencil8",
    };

    const pipelineLayout = device.createPipelineLayout({ 
        bindGroupLayouts: [bindGroupLayout] 
    });

    await checkError('createPipelineLayout');

    const vertexStageDescriptor = {
        module: vertexShaderModule,
        entryPoint: "main"
    };
    const fragmentStageDescriptor = {
        module: fragmentShaderModule,
        entryPoint: "main"
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

    await checkError('createRenderPipeline');

    let colorAttachment = {
        // attachment is acquired in render loop.
        loadOp: "clear",
        storeOp: "store",
        loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 } // GPUColor
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
        mipLevelCount: 1,
        sampleCount: 1,
        dimension: "2d",
        format: "depth24plus-stencil8",
        usage: GPUTextureUsage.OUTPUT_ATTACHMENT
    };

    const depthTexture = device.createTexture(depthTextureDescriptor);

    await checkError('depthTextureDescriptor');

    // GPURenderPassDepthStencilAttachmentDescriptor
    const depthAttachment = {
        attachment: depthTexture.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthLoadValue: 1.0,
        stencilLoadValue: 0,
        stencilStoreOp: "store",
    };

    renderPassDescriptor = {
        colorAttachments: [colorAttachment],
        depthStencilAttachment: depthAttachment
    };

    const error = await device.popErrorScope();
    if (error) console.log(error);

    await render();
}

/* Transform Buffers and Bindings */
const transformSize = 4 * 16 + 3 * 4;

const transformBufferDescriptor = {
    size: transformSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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
    if (error) console.log(error);
    error = await device.popErrorScope();
    if (error) console.log(error);

}

function createBindGroupDescriptor(transformBuffer) {
    const transformBufferBindGroupBinding = {
        binding: transformBindingNum,
        resource: {
            buffer: transformBuffer,
            offset: 0,
            size: 16 * 4 + 3 * 4,
        }
    };

    return {
        layout: bindGroupLayout,
        entries: [
            transformBufferBindGroupBinding,
        ]
    };
}

async function drawCommands(mappedGroup) {
    device.pushErrorScope('validation');
    updateTransformArray(new Float32Array(mappedGroup.arrayBuffer));
    mappedGroup.buffer.unmap();
    
    await checkError('updateTransformArray');

    const commandEncoder = device.createCommandEncoder();

    await checkError('createCommandEncoder');

    renderPassDescriptor.colorAttachments[0].attachment = swapChain.getCurrentTexture().createView();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    await checkError('beginRenderPass');

    // Encode drawing commands

    passEncoder.setPipeline(pipeline);
    // Vertex attributes
    passEncoder.setVertexBuffer(0, verticesBuffer, 0);
    passEncoder.setVertexBuffer(1, trianglesBuffer, 0);
    // Bind groups
    passEncoder.setBindGroup(bindGroupIndex, mappedGroup.bindGroup);

    // vertices, instances, first vertex, first instance
    passEncoder.draw(6, numInstances, 0, 0);
    passEncoder.endPass();

    await checkError('passEncode endPass');

    device.defaultQueue.submit([commandEncoder.finish()]);

    await checkError('defaultQueue.submit');

    // Ready the current buffer for update after GPU is done with it.
    mappedGroup.buffer.mapWriteAsync().then((arrayBuffer) => {
        mappedGroup.arrayBuffer = arrayBuffer;
        mappedGroups.push(mappedGroup);
    });

    device.popErrorScope();

    // requestAnimationFrame(render);
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
