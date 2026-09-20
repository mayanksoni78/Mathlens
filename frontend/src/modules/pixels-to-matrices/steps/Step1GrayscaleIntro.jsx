import { useState } from 'react';
import { SplitPane } from '../../../components/layout/SplitPane.jsx';
import { PixelCanvas } from '../../../components/canvas/PixelCanvas.jsx';
import { MatrixDisplay } from '../../../components/math/MatrixDisplay.jsx';
import { PRESETS } from '../../../config/presets.js';

export function Step1GrayscaleIntro() {
  const [activePreset, setActivePreset] = useState('black');
  const [gridSize, setGridSize] = useState('4x4');

  const currentMatrix = gridSize === '4x4'
    ? PRESETS.grayscale4x4[activePreset] || PRESETS.grayscale4x4.black
    : PRESETS.grayscale8x8.arrow;

  return (
    <div className="space-y-6">
      {/* Preset Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Preset:</span>
          <div className="flex gap-1.5">
            {['black', 'white', 'gradient', 'checkerboard'].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setGridSize('4x4');
                  setActivePreset(preset);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize cursor-pointer transition-colors ${
                  gridSize === '4x4' && activePreset === preset
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Size:</span>
          <button
            onClick={() => setGridSize('4x4')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
              gridSize === '4x4' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            4×4
          </button>
          <button
            onClick={() => setGridSize('8x8')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
              gridSize === '8x8' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            8×8 (Arrow)
          </button>
        </div>
      </div>

      {/* Side-by-side Image and Matrix */}
      <SplitPane
        leftTitle={`Digital Image (${gridSize} Grayscale)`}
        rightTitle={`Numerical Matrix Representation`}
        left={
          <div className="py-4">
            <PixelCanvas matrix={currentMatrix} pixelScale={gridSize === '4x4' ? 44 : 24} />
          </div>
        }
        right={
          <div className="py-4 overflow-x-auto max-w-full">
            <MatrixDisplay matrix={currentMatrix} />
          </div>
        }
      />

      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1">
        <p className="font-semibold">💡 What are you observing?</p>
        <p>• Value <strong>0</strong> represents pure pitch <strong>black</strong>.</p>
        <p>• Value <strong>255</strong> represents maximum brightness / pure <strong>white</strong>.</p>
        <p>• Values in between (0 &lt; val &lt; 255) correspond directly to shades of gray.</p>
      </div>
    </div>
  );
}
