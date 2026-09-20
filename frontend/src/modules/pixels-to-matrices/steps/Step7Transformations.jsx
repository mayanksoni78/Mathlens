import { useState, useMemo } from 'react';
import { transformImage, TransformMatrices } from '../../../core/math/transforms.js';
import { PixelCanvas } from '../../../components/canvas/PixelCanvas.jsx';
import { FormulaViewer } from '../../../components/math/FormulaViewer.jsx';
import { PRESETS } from '../../../config/presets.js';

export function Step7Transformations() {
  const [selectedShape, setSelectedShape] = useState('arrow'); // 'arrow' or 'letterA'
  const [transformType, setTransformType] = useState('rotate45');

  const originalMatrix = selectedShape === 'arrow'
    ? PRESETS.grayscale8x8.arrow
    : PRESETS.grayscale8x8.letterA;

  // Derive 2x2 transformation matrix A
  const transformMatrix = useMemo(() => {
    switch (transformType) {
      case 'rotate45':
        return TransformMatrices.rotate(45);
      case 'rotate90':
        return TransformMatrices.rotate(90);
      case 'scaleUp':
        return TransformMatrices.scale(1.3, 1.3);
      case 'scaleDown':
        return TransformMatrices.scale(0.7, 0.7);
      case 'shearX':
        return TransformMatrices.shearX(0.4);
      case 'reflectX':
        return TransformMatrices.reflectX();
      case 'identity':
      default:
        return TransformMatrices.identity();
    }
  }, [transformType]);

  const transformedMatrix = useMemo(() => {
    return transformImage(originalMatrix, transformMatrix, 8, 8);
  }, [originalMatrix, transformMatrix]);

  return (
    <div className="space-y-6">
      {/* Transformation Selector Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Input Shape:</span>
          <button
            onClick={() => setSelectedShape('arrow')}
            className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              selectedShape === 'arrow' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border'
            }`}
          >
            Arrow
          </button>
          <button
            onClick={() => setSelectedShape('letterA')}
            className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              selectedShape === 'letterA' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border'
            }`}
          >
            Letter &apos;A&apos;
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase">Transform:</span>
          {[
            { id: 'identity', label: 'Identity (None)' },
            { id: 'rotate45', label: 'Rotate 45°' },
            { id: 'rotate90', label: 'Rotate 90°' },
            { id: 'shearX', label: 'Shear X' },
            { id: 'scaleUp', label: 'Scale Up' },
            { id: 'reflectX', label: 'Reflect X' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTransformType(t.id)}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                transformType === t.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <FormulaViewer
        formula="X' = A X \quad \implies \quad \begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} a & b \\ c & d \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix}"
        explanation="The transformation matrix A relocates each pixel coordinate [x, y] to [x', y'], warping or rotating the geometry of the image."
      />

      {/* 4-Panel Side-by-Side: Original Image, Coordinate Mapping, Transformation Matrix A, Resulting Image */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
        {/* Panel 1: Original Image */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">1. Original Image</span>
          <div className="my-auto py-2">
            <PixelCanvas matrix={originalMatrix} pixelScale={24} />
          </div>
          <span className="text-[11px] font-mono text-gray-400">Coordinates: [x, y]</span>
        </div>

        {/* Panel 2: Transformation Matrix A */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="text-xs font-bold text-indigo-600 uppercase">2. Matrix A (2×2)</span>
          <div className="my-auto py-2 flex items-center">
            <div className="w-2.5 self-stretch border-l-2 border-t-2 border-b-2 border-indigo-600 rounded-l-md mr-2" />
            <div className="grid grid-cols-2 gap-3 text-center font-mono text-sm font-bold text-indigo-700 dark:text-indigo-300">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded">{transformMatrix[0][0]}</span>
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded">{transformMatrix[0][1]}</span>
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded">{transformMatrix[1][0]}</span>
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded">{transformMatrix[1][1]}</span>
            </div>
            <div className="w-2.5 self-stretch border-r-2 border-t-2 border-b-2 border-indigo-600 rounded-r-md ml-2" />
          </div>
          <span className="text-[11px] font-mono text-indigo-500">Transform Engine</span>
        </div>

        {/* Panel 3: Coordinate Calculation */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">3. Coordinate Rule</span>
          <div className="my-auto py-2 text-xs font-mono text-gray-700 dark:text-gray-300 space-y-2 text-left bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>x&apos; = ({transformMatrix[0][0]})·x + ({transformMatrix[0][1]})·y</div>
            <div>y&apos; = ({transformMatrix[1][0]})·x + ({transformMatrix[1][1]})·y</div>
          </div>
          <span className="text-[11px] font-mono text-gray-400">Linear Mapping</span>
        </div>

        {/* Panel 4: Resulting Transformed Image */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase">4. Resulting Image</span>
          <div className="my-auto py-2">
            <PixelCanvas matrix={transformedMatrix} pixelScale={24} />
          </div>
          <span className="text-[11px] font-mono text-emerald-600">Transformed Image</span>
        </div>
      </div>
    </div>
  );
}
