/**
 * Core Matrix Operations (Framework Agnostic)
 * Pure functions for matrix manipulation, scalar scaling, and clamping.
 */

/**
 * Creates an empty or filled 2D matrix.
 * @param {number} rows 
 * @param {number} cols 
 * @param {number|Function} fillValue 
 * @returns {number[][]}
 */
export function createMatrix(rows, cols, fillValue = 0) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      typeof fillValue === 'function' ? fillValue(r, c) : fillValue
    )
  );
}

/**
 * Clamps a numerical value between a min and max threshold (defaults to 8-bit [0, 255]).
 * @param {number} val 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(val, min = 0, max = 255) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

/**
 * Performs scalar multiplication on a 2D matrix: A' = k * A
 * Automatically clips values to [0, 255] for image display.
 * @param {number[][]} matrix 
 * @param {number} scalar 
 * @param {boolean} clip - whether to clamp results to [0, 255]
 * @returns {number[][]}
 */
export function scalarMultiply(matrix, scalar, clip = true) {
  return matrix.map(row =>
    row.map(val => (clip ? clamp(val * scalar) : val * scalar))
  );
}

/**
 * Adds two matrices element-wise of the same dimensions: C = A + B
 * @param {number[][]} A 
 * @param {number[][]} B 
 * @param {boolean} clip 
 * @returns {number[][]}
 */
export function addMatrices(A, B, clip = true) {
  return A.map((row, r) =>
    row.map((val, c) => {
      const sum = val + (B[r]?.[c] ?? 0);
      return clip ? clamp(sum) : sum;
    })
  );
}

/**
 * Subtracts matrix B from matrix A element-wise: C = A - B
 * @param {number[][]} A 
 * @param {number[][]} B 
 * @param {boolean} clip 
 * @returns {number[][]}
 */
export function subtractMatrices(A, B, clip = true) {
  return A.map((row, r) =>
    row.map((val, c) => {
      const diff = val - (B[r]?.[c] ?? 0);
      return clip ? clamp(diff) : diff;
    })
  );
}

/**
 * Computes absolute difference element-wise: C = |A - B|
 * Used for change detection, motion detection, and delta analysis.
 * @param {number[][]} A 
 * @param {number[][]} B 
 * @returns {number[][]}
 */
export function absDifferenceMatrices(A, B) {
  return A.map((row, r) =>
    row.map((val, c) => {
      const diff = Math.abs(val - (B[r]?.[c] ?? 0));
      return clamp(diff);
    })
  );
}

/**
 * Creates a binary or thresholded matrix: val > threshold ? highValue : lowValue
 * @param {number[][]} matrix
 * @param {number} threshold
 * @param {number} highValue
 * @param {number} lowValue
 * @returns {number[][]}
 */
export function thresholdMatrix(matrix, threshold, highValue = 255, lowValue = 0) {
  return matrix.map(row =>
    row.map(val => (val > threshold ? highValue : lowValue))
  );
}

/**
 * Clones a 2D matrix to prevent unintended mutations.
 * @param {number[][]} matrix 
 * @returns {number[][]}
 */
export function cloneMatrix(matrix) {
  return matrix.map(row => [...row]);
}

/**
 * Converts a 1D pixel array into a 2D matrix.
 * @param {number[]} arr 
 * @param {number} cols 
 * @returns {number[][]}
 */
export function arrayToMatrix(arr, cols) {
  const result = [];
  for (let i = 0; i < arr.length; i += cols) {
    result.push(arr.slice(i, i + cols));
  }
  return result;
}

/**
 * Flattens a 2D matrix into a 1D array.
 * @param {number[][]} matrix 
 * @returns {number[]}
 */
export function flattenMatrix(matrix) {
  return matrix.flat();
}
