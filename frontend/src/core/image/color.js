/**
 * Color & Channel Processing Utilities
 * Handles RGB components, channel separation, recombination, and scalar scaling.
 */

import { clamp } from '../math/matrix.js';

/**
 * Validates and clamps an [R, G, B] tuple to [0, 255].
 * @param {[number, number, number]} rgb 
 * @returns {[number, number, number]}
 */
export function clampRGB([r, g, b]) {
  return [clamp(r), clamp(g), clamp(b)];
}

/**
 * Multiplies an RGB tuple by a scalar k: R'=kR, G'=kG, B'=kB.
 * @param {[number, number, number]} rgb 
 * @param {number} k 
 * @returns {[number, number, number]}
 */
export function scaleRGB([r, g, b], k) {
  return clampRGB([r * k, g * k, b * k]);
}

/**
 * Decomposes a 2D RGB image (rows of [R,G,B] pixels) into three separate matrices:
 * R_matrix, G_matrix, B_matrix.
 * @param {[number, number, number][][]} rgbImageMatrix 
 * @returns {{ rMatrix: number[][], gMatrix: number[][], bMatrix: number[][] }}
 */
export function splitChannels(rgbImageMatrix) {
  const rows = rgbImageMatrix.length;
  const cols = rgbImageMatrix[0].length;

  const rMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));
  const gMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));
  const bMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [red, green, blue] = rgbImageMatrix[r][c];
      rMatrix[r][c] = red;
      gMatrix[r][c] = green;
      bMatrix[r][c] = blue;
    }
  }

  return { rMatrix, gMatrix, bMatrix };
}

/**
 * Recombines three separate channel matrices into a single RGB image matrix.
 * @param {number[][]} rMatrix 
 * @param {number[][]} gMatrix 
 * @param {number[][]} bMatrix 
 * @returns {[number, number, number][][]}
 */
export function recombineChannels(rMatrix, gMatrix, bMatrix) {
  const rows = rMatrix.length;
  const cols = rMatrix[0].length;

  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => [
      clamp(rMatrix[r][c]),
      clamp(gMatrix[r][c]),
      clamp(bMatrix[r][c])
    ])
  );
}

/**
 * Converts RGB tuple to CSS rgb() color string.
 * @param {[number, number, number]} rgb 
 * @returns {string}
 */
export function toRgbString([r, g, b]) {
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}

/**
 * Converts RGB to Hex color string (#RRGGBB).
 * @param {[number, number, number]} rgb 
 * @returns {string}
 */
export function toHex([r, g, b]) {
  const hex = ([r, g, b])
    .map(x => clamp(x).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}
