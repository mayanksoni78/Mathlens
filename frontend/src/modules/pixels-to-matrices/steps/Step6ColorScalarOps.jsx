import { useState, useMemo } from 'react';
import { splitChannels, recombineChannels } from '../../../core/image/color.js';
import { scalarMultiply } from '../../../core/math/matrix.js';
import { PixelCanvas } from '../../../components/canvas/PixelCanvas.jsx';
import { Slider } from '../../../components/common/Slider.jsx';
import { FormulaViewer } from '../../../components/math/FormulaViewer.jsx';
import { PRESETS } from '../../../config/presets.js';

export function Step6ColorScalarOps() {
  const originalColorImage = PRESETS.colorImage4x4;
  const [scalarK, setScalarK] = useState(1.0);

  const { rMatrix, gMatrix, bMatrix } = useMemo(() => {
    return splitChannels(originalColorImage);
  }, [originalColorImage]);

  // Multiply all three RGB matrices by scalar k
  const scaledRMatrix = useMemo(() => scalarMultiply(rMatrix, scalarK, true), [rMatrix, scalarK]);
  const scaledGMatrix = useMemo(() => scalarMultiply(gMatrix, scalarK, true), [gMatrix, scalarK]);
  const scaledBMatrix = useMemo(() => scalarMultiply(bMatrix, scalarK, true), [bMatrix, scalarK]);

  // Recombine
  const modifiedColorImage = useMemo(() => {
    return recombineChannels(scaledRMatrix, scaledGMatrix, scaledBMatrix);
  }, [scaledRMatrix, scaledGMatrix, scaledBMatrix]);

  return (
    <div className="space-y-6">
      {/* Scalar Slider Control */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full max-w-md">
          <Slider
            label="Multi-Channel Brightness Scalar (k)"
            value={scalarK}
            min={0}
            max={2.5}
            step={0.1}
            unit="×"
            onChange={setScalarK}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase">Presets:</span>
          {[0.2, 0.5, 1.0, 1.5, 2.0].map((val) => (
            <button
              key={val}
              onClick={() => setScalarK(val)}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                scalarK === val
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100'
              }`}
            >
              k = {val.toFixed(1)}
            </button>
          ))}
        </div>
      </div>

      <FormulaViewer
        formula={`R' = ${scalarK.toFixed(1)} \\times R, \\quad G' = ${scalarK.toFixed(1)} \\times G, \\quad B' = ${scalarK.toFixed(1)} \\times B`}
        explanation="Simultaneous scalar multiplication scales the luminosity of all three channels while preserving hue/ratio, clamped at 255."
      />

      {/* Simultaneous pipeline view: Original image -> RGB matrices -> scalar multiplication -> modified image */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-xs text-center">
        {/* Step 1: Original Image */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-500 mb-2 uppercase">1. Original Image</span>
          <PixelCanvas matrix={originalColorImage} mode="rgb" pixelScale={24} />
        </div>

        {/* Step 2: RGB Matrices Decomposition */}
        <div className="flex flex-col items-center border-l md:border-r border-gray-100 dark:border-gray-800 px-2 py-3 md:py-0">
          <span className="text-xs font-bold text-gray-500 mb-2 uppercase">2. RGB Channels</span>
          <div className="flex flex-col gap-1 text-[11px] font-mono text-gray-600 dark:text-gray-300">
            <span className="text-red-500 font-bold">R_matrix (4×4)</span>
            <span className="text-emerald-500 font-bold">G_matrix (4×4)</span>
            <span className="text-blue-500 font-bold">B_matrix (4×4)</span>
          </div>
        </div>

        {/* Step 3: Scalar Multiplication */}
        <div className="flex flex-col items-center py-3 md:py-0">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase">
            3. Multiply by k={scalarK.toFixed(1)}
          </span>
          <div className="font-mono text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
            <div>R&apos; = min(255, {scalarK.toFixed(1)}R)</div>
            <div>G&apos; = min(255, {scalarK.toFixed(1)}G)</div>
            <div>B&apos; = min(255, {scalarK.toFixed(1)}B)</div>
          </div>
        </div>

        {/* Step 4: Modified Output Image */}
        <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0">
          <span className="text-xs font-bold text-indigo-600 mb-2 uppercase">4. Modified Image</span>
          <PixelCanvas matrix={modifiedColorImage} mode="rgb" pixelScale={24} />
        </div>
      </div>
    </div>
  );
}
