import { useState, useCallback } from 'react';
import { cloneMatrix, clamp, createMatrix } from '../core/math/matrix.js';

/**
 * Custom Hook for managing interactive 2D matrix state.
 * @param {number[][]} initialMatrix 
 */
export function useMatrix(initialMatrix) {
  const [matrix, setMatrix] = useState(() => cloneMatrix(initialMatrix));

  const updateCell = useCallback((row, col, value) => {
    const clampedVal = clamp(value);
    setMatrix(prev => {
      const next = cloneMatrix(prev);
      next[row][col] = clampedVal;
      return next;
    });
  }, []);

  const resetMatrix = useCallback((newMatrix = initialMatrix) => {
    const cloned = cloneMatrix(newMatrix);
    setMatrix(cloned);
  }, [initialMatrix]);

  const setDimensions = useCallback((rows, cols, fillVal = 0) => {
    const newM = createMatrix(rows, cols, fillVal);
    setMatrix(newM);
  }, []);

  return {
    matrix,
    setMatrix,
    updateCell,
    resetMatrix,
    setDimensions,
    rows: matrix.length,
    cols: matrix[0]?.length || 0
  };
}
