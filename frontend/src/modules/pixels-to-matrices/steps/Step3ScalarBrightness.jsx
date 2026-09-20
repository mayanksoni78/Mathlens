import { useState, useMemo } from 'react';
import { scalarMultiply } from '../../../core/math/matrix.js';
import { SplitPane } from '../../../components/layout/SplitPane.jsx';
import { PixelCanvas } from '../../../components/canvas/PixelCanvas.jsx';
import { MatrixDisplay } from '../../../components/math/MatrixDisplay.jsx';
import { Slider } from '../../../components/common/Slider.jsx';
import { FormulaViewer } from '../../../components/math/FormulaViewer.jsx';
import { PRESETS } from '../../../config/presets.js';

export function Step3ScalarBrightness() {
  const originalMatrix = PRESETS.grayscale4x4.gradient;
  const [scalarK, setScalarK] = useState(1.0);

  const transformedMatrix = useMemo(() => {
    return scalarMultiply(originalMatrix, scalarK, true);
  }, [originalMatrix, scalarK]);

  return (
    <div className="space-y-6">
      {/* Scalar Controller */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full max-w-md">
          <Slider
            label="Scalar Multiplier (k)"
            value={scalarK}
            min={0}
            max={2.5}
            step={0.1}
            unit="×"
            color="indigo"
            onChange={setScalarK}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase">Presets:</span>
          {[0.0, 0.5, 1.0, 1.5, 2.0].map((val) => (
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
        formula={`A' = ${scalarK.toFixed(1)} \\times A`}
        explanation={
          scalarK > 1.0
            ? `k = ${scalarK.toFixed(1)} > 1: All matrix values increase → Image brightens (values > 255 clipped to 255)`
            : scalarK < 1.0
            ? `k = ${scalarK.toFixed(1)} < 1: All matrix values decrease → Image darkens`
            : 'k = 1.0: Original unmodified image matrix'
        }
      />

      <SplitPane
        leftTitle="Original Image A & Resulting Scaled Image A' side-by-side"
        rightTitle="Transformed Matrix A' = kA (with 255 clipping)"
        left={
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-4 w-full">
            <div className="text-center">
              <span className="text-xs font-bold text-gray-500 block mb-1">Original A</span>
              <PixelCanvas matrix={originalMatrix} pixelScale={28} />
            </div>
            <span className="text-xl font-bold text-indigo-500">→</span>
            <div className="text-center">
              <span className="text-xs font-bold text-indigo-600 block mb-1">Scaled A&apos; (k={scalarK.toFixed(1)})</span>
              <PixelCanvas matrix={transformedMatrix} pixelScale={28} />
            </div>
          </div>
        }
        right={
          <div className="py-4 overflow-x-auto max-w-full">
            <MatrixDisplay matrix={transformedMatrix} />
          </div>
        }
      />
    </div>
  );
}
