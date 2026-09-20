import { useState } from 'react';
import { Slider } from '../../../components/common/Slider.jsx';
import { toHex, toRgbString } from '../../../core/image/color.js';
import { FormulaViewer } from '../../../components/math/FormulaViewer.jsx';

export function Step4ColorPixelRGB() {
  const [r, setR] = useState(128);
  const [g, setG] = useState(0);
  const [b, setB] = useState(128); // Purple preset default

  const colorPresets = [
    { label: 'Pure Red', rgb: [255, 0, 0] },
    { label: 'Pure Green', rgb: [0, 255, 0] },
    { label: 'Pure Blue', rgb: [0, 0, 255] },
    { label: 'Purple', rgb: [128, 0, 128] },
    { label: 'Yellow', rgb: [255, 255, 0] },
    { label: 'Cyan', rgb: [0, 255, 255] },
    { label: 'White', rgb: [255, 255, 255] },
    { label: 'Black', rgb: [0, 0, 0] }
  ];

  const currentColorRgb = [r, g, b];
  const rgbString = toRgbString(currentColorRgb);
  const hexString = toHex(currentColorRgb);

  return (
    <div className="space-y-6">
      {/* Preset Quick Buttons */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <span className="text-xs font-semibold text-gray-500 uppercase">Presets:</span>
        {colorPresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setR(preset.rgb[0]);
              setG(preset.rgb[1]);
              setB(preset.rgb[2]);
            }}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span
              className="w-3 h-3 rounded-full border border-black/20"
              style={{ backgroundColor: `rgb(${preset.rgb.join(',')})` }}
            />
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Visual Swatch & Vector Representation */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center shadow-xs">
          <div
            className="w-40 h-40 rounded-2xl shadow-xl border-4 border-white dark:border-gray-800 transition-colors duration-150"
            style={{ backgroundColor: rgbString }}
          />
          <div className="mt-6 text-center space-y-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold">
              Pixel Color Value
            </span>
            <div className="font-mono text-2xl font-bold text-gray-900 dark:text-gray-100">
              [{r}, {g}, {b}]
            </div>
            <div className="text-xs font-mono text-gray-500">
              {hexString.toUpperCase()} • {rgbString}
            </div>
          </div>
        </div>

        {/* 3 Independent Sliders for R, G, B */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-5 shadow-xs">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-800">
            Independent Channel Intensities (0 - 255)
          </h4>

          <Slider
            label="Red Channel (R)"
            value={r}
            min={0}
            max={255}
            color="red"
            onChange={setR}
          />

          <Slider
            label="Green Channel (G)"
            value={g}
            min={0}
            max={255}
            color="green"
            onChange={setG}
          />

          <Slider
            label="Blue Channel (B)"
            value={b}
            min={0}
            max={255}
            color="blue"
            onChange={setB}
          />
        </div>
      </div>

      <FormulaViewer
        formula="Vector \; \vec{p} = [R, G, B]^T"
        explanation="Unlike a grayscale pixel (1 scalar), a color pixel is a 3-dimensional vector containing separate Red, Green, and Blue light intensities."
      />
    </div>
  );
}
