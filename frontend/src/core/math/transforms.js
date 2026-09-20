/**
 * 2D Coordinate Transformation Engine
 * Handles linear & affine transformations: X' = A * X
 */

/**
 * Creates a standard 2x2 or 3x3 transformation matrix.
 */
export const TransformMatrices = {
  identity: () => [
    [1, 0],
    [0, 1]
  ],
  scale: (sx, sy = sx) => [
    [sx, 0],
    [0, sy]
  ],
  rotate: (degrees) => {
    const rad = (degrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [
      [Number(cos.toFixed(4)), Number(-sin.toFixed(4))],
      [Number(sin.toFixed(4)), Number(cos.toFixed(4))]
    ];
  },
  shearX: (k) => [
    [1, k],
    [0, 1]
  ],
  shearY: (k) => [
    [1, 0],
    [k, 1]
  ],
  reflectX: () => [
    [1, 0],
    [0, -1]
  ],
  reflectY: () => [
    [-1, 0],
    [0, 1]
  ]
};

/**
 * Multiplies a 2x2 matrix by a 2D coordinate vector [x, y]: X' = A * X
 * @param {number[][]} A - 2x2 transformation matrix
 * @param {[number, number]} point - [x, y] vector
 * @returns {[number, number]} - transformed [x', y'] vector
 */
export function transformPoint(A, [x, y]) {
  const xPrime = A[0][0] * x + A[0][1] * y;
  const yPrime = A[1][0] * x + A[1][1] * y;
  return [xPrime, yPrime];
}

/**
 * Applies a 2D transformation matrix to an image grid using forward or inverse mapping.
 * @param {number[][]} inputMatrix - Original grayscale pixel matrix
 * @param {number[][]} transformMatrix - 2x2 transformation matrix
 * @param {number} outWidth 
 * @param {number} outHeight 
 * @returns {number[][]} - Transformed pixel matrix
 */
export function transformImage(inputMatrix, transformMatrix, outWidth = null, outHeight = null) {
  const inHeight = inputMatrix.length;
  const inWidth = inputMatrix[0].length;
  const targetW = outWidth || inWidth;
  const targetH = outHeight || inHeight;

  // Output matrix initialized to black (0)
  const output = Array.from({ length: targetH }, () => Array(targetW).fill(0));

  const cxIn = inWidth / 2;
  const cyIn = inHeight / 2;
  const cxOut = targetW / 2;
  const cyOut = targetH / 2;

  // Map each input pixel to transformed position
  for (let y = 0; y < inHeight; y++) {
    for (let x = 0; x < inWidth; x++) {
      const val = inputMatrix[y][x];
      if (val === 0) continue;

      // Center coordinates around origin
      const nx = x - cxIn;
      const ny = y - cyIn;

      const [tx, ty] = transformPoint(transformMatrix, [nx, ny]);

      const destX = Math.round(tx + cxOut);
      const destY = Math.round(ty + cyOut);

      if (destX >= 0 && destX < targetW && destY >= 0 && destY < targetH) {
        output[destY][destX] = val;
      }
    }
  }

  return output;
}
