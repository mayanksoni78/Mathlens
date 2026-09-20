import { useState, useMemo } from 'react';
import { splitChannels } from '../../../core/image/color.js';
import { PixelCanvas } from '../../../components/canvas/PixelCanvas.jsx';
import { MatrixDisplay } from '../../../components/math/MatrixDisplay.jsx';
import { FormulaViewer } from '../../../components/math/FormulaViewer.jsx';
import { PRESETS } from '../../../config/presets.js';

export function Step5RGBChannelMatrices() {
  const originalColorImage = PRESETS.colorImage4x4;
  const [viewMode, setViewMode] = useState('combined'); // 'combined' or 'split'

  const { rMatrix, gMatrix, bMatrix } = useMemo(() => {
    return splitChannels(originalColorImage);
  }, [originalColorImage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <span className="text-xs font-semibold text-gray-500 uppercase">View Mode:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
              viewMode === 'combined'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Recombined Color Image
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
              viewMode === 'split'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Decomposed Channels (R, G, B)
          </button>
        </div>
      </div>

      <FormulaViewer
        formula="\text{Colour Image} = (M_{\text{Red}}, \; M_{\text{Green}}, \; M_{\text{Blue}})"
        explanation="A color image is a 3D matrix (tensor) composed of three 2D matrices stacked together."
      />

      {/* Main Channel Separation Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Full Image */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase">
            Composite RGB Image
          </span>
          <PixelCanvas matrix={originalColorImage} mode="rgb" pixelScale={32} />
          <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
            (R + G + B combined)
          </span>
        </div>

        {/* Red Matrix */}
        <div className="bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 uppercase">
            R_matrix (Red Channel)
          </span>
          <div className="overflow-x-auto max-w-full my-auto">
            <MatrixDisplay matrix={rMatrix} />
          </div>
        </div>

        {/* Green Matrix */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase">
            G_matrix (Green Channel)
          </span>
          <div className="overflow-x-auto max-w-full my-auto">
            <MatrixDisplay matrix={gMatrix} />
          </div>
        </div>

        {/* Blue Matrix */}
        <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase">
            B_matrix (Blue Channel)
          </span>
          <div className="overflow-x-auto max-w-full my-auto">
            <MatrixDisplay matrix={bMatrix} />
          </div>
        </div>
      </div>
    </div>
  );
}
