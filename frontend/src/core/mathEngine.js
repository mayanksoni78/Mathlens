/**
 * Core Linear Algebra & Matrix Processing Engine
 */

export function createEmptyMatrix(rows, cols, initialValue = 0) {
  return Array.from({ length: rows }, () => Array(cols).fill(initialValue));
}

export function clampPixel(value) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function scaleMatrix(matrix, scalar) {
  return matrix.map(row =>
    row.map(val => clampPixel(val * scalar))
  );
}

export function addMatrices(matA, matB, alpha = null) {
  const rows = matA.length;
  const cols = matA[0].length;
  const result = createEmptyMatrix(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (alpha === null) {
        // Direct addition C = A + B (clamped to 255)
        result[i][j] = clampPixel(matA[i][j] + matB[i][j]);
      } else {
        // Blended addition C = αA + (1-α)B
        result[i][j] = clampPixel(alpha * matA[i][j] + (1 - alpha) * matB[i][j]);
      }
    }
  }

  return result;
}

export function subtractMatrices(matA, matB, modeOrUseAbs = 'direct', alpha = 1.0) {
  const rows = matA.length;
  const cols = matA[0].length;
  const result = createEmptyMatrix(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const valA = matA[i][j];
      const valB = matB[i][j];
      // Supports boolean useAbsolute (Step 9) or string mode ('abs', 'weighted', 'direct' in Step 8)
      if (modeOrUseAbs === true || modeOrUseAbs === 'abs') {
        // Absolute difference C = |A - B| (used in change & motion detection)
        result[i][j] = clampPixel(Math.abs(valA - valB));
      } else if (modeOrUseAbs === 'weighted') {
        // Weighted subtraction C = clamp(A - αB)
        result[i][j] = clampPixel(valA - alpha * valB);
      } else {
        // Direct subtraction C = clamp(A - B) (clamped at 0 underflow)
        result[i][j] = clampPixel(valA - valB);
      }
    }
  }

  return result;
}

export function thresholdMatrix(matD, threshold, foregroundVal = 1) {
  const rows = matD.length;
  const cols = matD[0].length;
  const result = createEmptyMatrix(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = matD[i][j] > threshold ? foregroundVal : 0;
    }
  }

  return result;
}

export function invertMatrix(matrix, factor = 1.0) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = createEmptyMatrix(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const orig = matrix[i][j];
      const inverted = 255 - orig;
      if (factor === 1.0) {
        result[i][j] = clampPixel(inverted);
      } else {
        result[i][j] = clampPixel((1 - factor) * orig + factor * inverted);
      }
    }
  }

  return result;
}

export function splitRGBChannels(colorGrid) {
  const rows = colorGrid.length;
  const cols = colorGrid[0].length;
  const rMatrix = createEmptyMatrix(rows, cols);
  const gMatrix = createEmptyMatrix(rows, cols);
  const bMatrix = createEmptyMatrix(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      rMatrix[i][j] = colorGrid[i][j].r;
      gMatrix[i][j] = colorGrid[i][j].g;
      bMatrix[i][j] = colorGrid[i][j].b;
    }
  }

  return { rMatrix, gMatrix, bMatrix };
}

export function combineRGBChannels(rMatrix, gMatrix, bMatrix) {
  const rows = rMatrix.length;
  const cols = rMatrix[0].length;
  const colorGrid = [];

  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        r: clampPixel(rMatrix[i][j]),
        g: clampPixel(gMatrix[i][j]),
        b: clampPixel(bMatrix[i][j]),
      });
    }
    colorGrid.push(row);
  }

  return colorGrid;
}
