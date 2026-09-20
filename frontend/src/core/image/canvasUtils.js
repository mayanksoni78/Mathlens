/**
 * Canvas Rendering Utilities
 * Renders small discrete matrices (4x4, 8x8) cleanly without blurry interpolation.
 */

/**
 * Renders a 2D grayscale matrix onto an HTML5 Canvas.
 * @param {HTMLCanvasElement} canvas 
 * @param {number[][]} matrix 
 */
export function renderGrayscaleMatrixToCanvas(canvas, matrix) {
  if (!canvas || !matrix || !matrix.length) return;
  const ctx = canvas.getContext('2d');
  const rows = matrix.length;
  const cols = matrix[0].length;

  canvas.width = cols;
  canvas.height = rows;

  const imgData = ctx.createImageData(cols, rows);
  const data = imgData.data;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 4;
      const gray = matrix[r][c];
      data[idx] = gray;     // Red
      data[idx + 1] = gray; // Green
      data[idx + 2] = gray; // Blue
      data[idx + 3] = 255;  // Alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Renders a 2D RGB matrix onto an HTML5 Canvas.
 * @param {HTMLCanvasElement} canvas 
 * @param {[number, number, number][][]} rgbMatrix 
 */
export function renderRGBMatrixToCanvas(canvas, rgbMatrix) {
  if (!canvas || !rgbMatrix || !rgbMatrix.length) return;
  const ctx = canvas.getContext('2d');
  const rows = rgbMatrix.length;
  const cols = rgbMatrix[0].length;

  canvas.width = cols;
  canvas.height = rows;

  const imgData = ctx.createImageData(cols, rows);
  const data = imgData.data;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 4;
      const [red, green, blue] = rgbMatrix[r][c];
      data[idx] = red;
      data[idx + 1] = green;
      data[idx + 2] = blue;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
