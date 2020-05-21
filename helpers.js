/**
 * 
 * @param {GPUDevice} device 
 * @param {GPUBuffer} dst
 * @param {number} dstOffset
 * @param {Float32Array | Uint32Array} src
 * @param {GPUCommandEncoder} commandEncoder
 * @returns { 
 *  commandEncoder: GPUCommandEncoder,
 *  uploadBuffer: GPUBuffer,
 * }
 */
export function updateBufferData(
    device,
    dst, 
    dstOffset,
    src,
    commandEncoder) {
    const [uploadBuffer, mapping] = device.createBufferMapped({
      size: src.byteLength,
      usage: GPUBufferUsage.COPY_SRC,
    });
  
    new src.constructor(mapping).set(src);
    uploadBuffer.unmap();
  
    commandEncoder = commandEncoder || device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(uploadBuffer, 0, dst, dstOffset, src.byteLength);
  
    return { commandEncoder, uploadBuffer };
  }