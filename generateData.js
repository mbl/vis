function sigmoid(x) {
    const ax = x * 50;
  
    const ex = Math.exp(ax);
    return ex / (ex + 1) - 0.5;
}

export function generateData(num = 1) {
    // x y z w r g b a
    const stride = 8;
    const result = new Float32Array(num * stride);
  
    const num2 = Math.trunc(num / 2);
  
    for (let i = 0; i < num2; i += 1) {
      const xv = sigmoid(Math.random() - 0.5);
      const yv = sigmoid(Math.random() - 0.5);
      const zv = sigmoid(Math.random() - 0.5);
      const wv = sigmoid(Math.random() - 0.5);
  
      result[i * stride + 0] = xv;
      result[i * stride + 1] = yv;
      result[i * stride + 2] = zv;
      result[i * stride + 3] = wv;
      result[i * stride + 4] = (i % 256) / 255.0; // R
      result[i * stride + 5] = ((i / 15) % 150) / 255.0; // G
      result[i * stride + 6] = ((wv + 0.5) * 255) / 255.0; // B
      result[i * stride + 7] = 1.0;
    }
  
    for (let i = num2; i < num; i += 1) {
      const iN = i;
      const iO = i;
      const xv = Math.sin(iO / num * Math.PI * 41) * 0.5;
      const yv = Math.sin(iO / num * Math.PI * 87) * 0.5;
      const zv = Math.sin(iO / num * Math.PI * 29) * 0.5;
      const wv = Math.sin(iO / num * Math.PI * 131) * 0.5;
  
      const fuzz1 = (Math.sin(iO / num * Math.PI * 2 * 50.0) + 1.0) * 0.5;
      let fuzz = fuzz1 * 0.03;
    
      result[iN * stride + 0] = xv + Math.random() * fuzz;
      result[iN * stride + 1] = yv + Math.random() * fuzz;
      result[iN * stride + 2] = zv + Math.random() * fuzz;
      result[iN * stride + 3] = wv + Math.random() * fuzz;
      result[iN * stride + 4] = fuzz1; // R
      result[iN * stride + 5] = (xv + 0.5); // G
      result[iN * stride + 6] = (wv + 0.5); // B
      result[iN * stride + 7] = 1.0;
    }
  
    return result;
  }
  