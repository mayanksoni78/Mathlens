import { useState } from 'react';
import { useMatrix } from '../../../hooks/useMatrix.js';
import { SplitPane } from '../../../components/layout/SplitPane.jsx';
import { PixelCanvas } from '../../../components/canvas/PixelCanvas.jsx';
import { MatrixDisplay } from '../../../components/math/MatrixDisplay.jsx';
import { Slider } from '../../../components/common/Slider.jsx';
import { Button } from '../../../components/common/Button.jsx';
import { PRESETS } from '../../../config/presets.js';

export function Step2ElementEditing() {
  const { matrix, updateCell, resetMatrix } = useMatrix(PRESETS.grayscale4x4.black);
  const [selectedCell, setSelectedCell] = useState([1, 1]);

  const [row, col] = selectedCell;
  const currentValue = matrix[row]?.[col] ?? 0;

  const handleCellSelect = (r, c) => {
    setSelectedCell([r, c]);
  };

  const setPresetStep = (val) => {
    updateCell(row, col, val);
  };

  return (
    <div className="space-y-6">
      {/* Active Cell Controller */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full max-w-md">
          <Slider
            label={`Editing Cell [${row}, ${col}] Value`}
            value={currentValue}
            min={0}
            max={255}
            onChange={(newVal) => updateCell(row, col, newVal)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase">Quick Jump:</span>
          {[0, 50, 100, 150, 200, 255].map((val) => (
            <button
              key={val}
              onClick={() => setPresetStep(val)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                currentValue === val
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100'
              }`}
            >
              {val}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={() => resetMatrix(PRESETS.grayscale4x4.black)}>
            Clear All
          </Button>
        </div>
      </div>

      <SplitPane
        leftTitle="Live Image Preview (Click any pixel)"
        rightTitle="Interactive Matrix (Click any cell to edit)"
        left={
          <div className="py-4">
            <PixelCanvas
              matrix={matrix}
              pixelScale={44}
              onPixelClick={handleCellSelect}
            />
          </div>
        }
        right={
          <div className="py-4 overflow-x-auto max-w-full">
            <MatrixDisplay
              matrix={matrix}
              selectedCell={selectedCell}
              onCellClick={handleCellSelect}
              editable={true}
              onCellChange={updateCell}
            />
          </div>
        }
      />

      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <p className="font-semibold">🎯 Core Principle Established:</p>
        <p>A digital image is not magic—<strong>it is a numerical array (matrix)</strong>. Every pixel&apos;s brightness is completely determined by the number in its corresponding row and column.</p>
      </div>
    </div>
  );
}
