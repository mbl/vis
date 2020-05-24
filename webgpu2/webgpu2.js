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
    0  , 0  , 0.2 , 1.5  // w = 1.0`
]);

const colorOffset = 4 * 4;
const vertexSize = 4 * 8;
const numInstances = 1000000;
const verticesArray = generateData(numInstances);

async function checkError(label) {
    const error = await device.popErrorScope();
    if (error) { 
        console.log(`${label}: ${error.message}`);
    }
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

    swapChain = context.configureSwapChain({
        device: device,
        format: "bgra8unorm"
    });

    // Instance buffer
    let verticesArrayBuffer;
    [verticesBuffer, verticesArrayBuffer] = device.createBufferMapped({
        size: verticesArray.byteLength,
        usage: GPUBufferUsage.VERTEX
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
    const pipelineLayout = device.createPipelineLayout({ 
        bindGroupLayouts: [bindGroupLayout] 
    });

    await checkError('createPipelineLayout');

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
    const vertexStageDescriptor = {
        module: vertexShaderModule,
        entryPoint: "main"
    };
    const fragmentStageDescriptor = {
        module: fragmentShaderModule,
        entryPoint: "main"
    };
    
    pipeline = device.createRenderPipeline({
        layout: pipelineLayout,

        vertexStage: vertexStageDescriptor,
        fragmentStage: fragmentStageDescriptor,

        primitiveTopology: "triangle-list",
        depthStencilState: {
            depthWriteEnabled: true,
            depthCompare: "less",
            format: "depth24plus-stencil8",
        },
        vertexState: {
            vertexBuffers: [{
                arrayStride: vertexSize,
                stepMode: "instance",
                
                attributes: [{
                    shaderLocation: positionAttributeNum,
                    offset: 0,
                    format: "float4"
                }, {
                    shaderLocation: colorAttributeNum,
                    offset: colorOffset,
                    format: "float4"
                }],
            }, 
            {
                arrayStride: 2 * 4,
                stepMode: "vertex",
                attributes: [
                    {
                        shaderLocation: triangleAttributeNum,
                        offset: 0,
                        format: "float2"
                    }
                ],
            }]
        },
        rasterizationState: {
            cullMode: 'back',
        },
        colorStates: [{
            format: "bgra8unorm",
        }]
    });

    await checkError('createRenderPipeline');

    // Depth stencil texture

    // GPUExtent3D
    const depthTexture = device.createTexture(
        {
            size: {
                width: canvas.width,
                height: canvas.height,
                depth: 1
            },
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT
        }
    );

    await checkError('depthTextureDescriptor');

    // GPURenderPassDepthStencilAttachmentDescriptor
    renderPassDescriptor = {
        colorAttachments: [{
            // attachment is acquired in render loop.
            attachment: undefined,

            loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 } // GPUColor
        }],
        depthStencilAttachment: {
            attachment: depthTexture.createView(),

            depthStoreOp: "store",
            depthLoadValue: 1.0,
            stencilLoadValue: 0,
            stencilStoreOp: "store",
        }
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

async function render() {
    device.pushErrorScope('validation');
    device.pushErrorScope('out-of-memory');

    await drawCommands();

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

function drawCommands() {
    // device.pushErrorScope('validation');

    const [buffer, arrayBuffer] = device.createBufferMapped(transformBufferDescriptor);
    const group = device.createBindGroup(createBindGroupDescriptor(buffer));

    updateTransformArray(new Float32Array(arrayBuffer));
    buffer.unmap();
    
    // await checkError('updateTransformArray');

    const colorTexture = swapChain.getCurrentTexture().createView();
    renderPassDescriptor.colorAttachments[0].attachment = colorTexture;

    const commandEncoder = device.createCommandEncoder();

    // await checkError('createCommandEncoder');

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    // await checkError('beginRenderPass');

    // Encode drawing commands

    passEncoder.setPipeline(pipeline);


    // Vertex attributes
    passEncoder.setVertexBuffer(0, verticesBuffer, 0);


    passEncoder.setVertexBuffer(1, trianglesBuffer, 0);

    // Bind groups
    passEncoder.setBindGroup(bindGroupIndex, group);

    // vertices, instances, first vertex, first instance
    passEncoder.draw(6, numInstances, 0, 0);


    passEncoder.endPass();

    // await checkError('passEncode endPass');

    device.defaultQueue.submit([commandEncoder.finish()]);

    // await checkError('defaultQueue.submit');

    // device.popErrorScope();

    buffer.destroy();

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
