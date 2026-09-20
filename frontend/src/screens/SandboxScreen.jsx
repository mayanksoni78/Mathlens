import { useState } from 'react';
import { useMatrix } from '../hooks/useMatrix.js';
import { PixelCanvas } from '../components/canvas/PixelCanvas.jsx';
import { MatrixDisplay } from '../components/math/MatrixDisplay.jsx';
import { Slider } from '../components/common/Slider.jsx';
import { Button } from '../components/common/Button.jsx';
import { PRESETS } from '../config/presets.js';

export function SandboxScreen() {
  const { matrix, updateCell, resetMatrix } = useMatrix(PRESETS.grayscale4x4.gradient);
  const [selectedCell, setSelectedCell] = useState([0, 0]);

  const [row, col] = selectedCell;
  const currentValue = matrix[row]?.[col] ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🧪 Matrix Sandbox
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Free playground to test any matrix configuration and observe pixel behavior.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => resetMatrix(PRESETS.grayscale4x4.black)}>
            All 0 (Black)
          </Button>
          <Button variant="outline" size="sm" onClick={() => resetMatrix(PRESETS.grayscale4x4.white)}>
            All 255 (White)
          </Button>
          <Button variant="outline" size="sm" onClick={() => resetMatrix(PRESETS.grayscale4x4.checkerboard)}>
            Checkerboard
          </Button>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <Slider
          label={`Value for Cell [${row}, ${col}]`}
          value={currentValue}
          min={0}
          max={255}
          onChange={(newVal) => updateCell(row, col, newVal)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Live Pixel Canvas (Click pixel)
          </h3>
          <PixelCanvas
            matrix={matrix}
            pixelScale={40}
            onPixelClick={(r, c) => setSelectedCell([r, c])}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Matrix Grid (Click cell)
          </h3>
          <div className="overflow-x-auto max-w-full">
            <MatrixDisplay
              matrix={matrix}
              selectedCell={selectedCell}
              onCellClick={(r, c) => setSelectedCell([r, c])}
              editable={true}
              onCellChange={updateCell}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SandboxScreen;
