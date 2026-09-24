import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Blend, 
  ArrowLeftRight, 
  RotateCcw, 
  Shuffle, 
  Sliders, 
  Plus, 
  Minus,
  Equal, 
  Layers, 
  Sparkles,
  Info,
  AlertTriangle,
  Scan,
  Scissors,
  Activity,
  Maximize2,
  Undo2,
  ZoomIn
} from 'lucide-react';
import { clampPixel, createEmptyMatrix } from '../core/mathEngine';

// Default presets for Image A and Image B (Addition & Subtraction pairings)
const PRESET_PAIRS = {
  crossAndFrame: {
    name: 'Cross & Frame',
    desc: 'Center plus shape with an outer border box',
    matrixA: [
      [20, 240, 240, 20],
      [240, 240, 240, 240],
      [240, 240, 240, 240],
      [20, 240, 240, 20]
    ],
    matrixB: [
      [220, 220, 220, 220],
      [220, 20,  20,  220],
      [220, 20,  20,  220],
      [220, 220, 220, 220]
    ]
  },
  motionDetect: {
    name: 'Motion / Delta',
    desc: 'Moving target isolated from a static background (A - B / |A - B|)',
    matrixA: [
      [35,  35,  35,  35],
      [35, 235, 235,  35],
      [35, 235, 235,  35],
      [35,  35,  35,  35]
    ],
    matrixB: [
      [35, 35, 35, 35],
      [35, 35, 35, 35],
      [35, 35, 35, 35],
      [35, 35, 35, 35]
    ]
  },
  defectInspect: {
    name: 'Defect Inspection',
    desc: 'Baseline component compared against defective part',
    matrixA: [
      [180, 180, 180, 180],
      [180,  30, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180]
    ],
    matrixB: [
      [180, 180, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180]
    ]
  },
  dualGradients: {
    name: 'Dual Gradients',
    desc: 'Horizontal gradient with vertical gradient',
    matrixA: [
      [20, 90, 170, 240],
      [20, 90, 170, 240],
      [20, 90, 170, 240],
      [20, 90, 170, 240]
    ],
    matrixB: [
      [20,  20,  20,  20],
      [90,  90,  90,  90],
      [170, 170, 170, 170],
      [240, 240, 240, 240]
    ]
  },
  xAndO: {
    name: 'X & O Patterns',
    desc: 'Diagonal X shape with open O square',
    matrixA: [
      [240, 30,  30,  240],
      [30,  240, 240, 30],
      [30,  240, 240, 30],
      [240, 30,  30,  240]
    ],
    matrixB: [
      [210, 210, 210, 210],
      [210, 30,  30,  210],
      [210, 30,  30,  210],
      [210, 210, 210, 210]
    ]
  },
  checkerAndStripes: {
    name: 'Checker & Stripes',
    desc: 'Alternating checkerboard with vertical stripes',
    matrixA: [
      [240, 30,  240, 30],
      [30,  240, 30,  240],
      [240, 30,  240, 30],
      [30,  240, 30,  240]
    ],
    matrixB: [
      [220, 30, 220, 30],
      [220, 30, 220, 30],
      [220, 30, 220, 30],
      [220, 30, 220, 30]
    ]
  }
};

/**
 * Compact Canvas Visualizer for side-by-side or stacked presentation
 */
function CompactPixelCanvas({
  matrix,
  hoveredCell,
  onHoverCell,
  pixelSize = 28,
  highlightColor = 'var(--accent-purple)'
}) {
  const canvasRef = React.useRef(null);
  const rows = matrix.length;
  const cols = matrix[0].length;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows || !cols) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = cols * pixelSize;
    const height = rows * pixelSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = matrix[r][c];
        ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Adaptive border for high visibility
        if (v < 75) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        } else if (v > 180) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        } else {
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)';
        }

        ctx.lineWidth = 1;
        ctx.strokeRect(c * pixelSize + 0.5, r * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);

        // Hover highlight
        if (hoveredCell && hoveredCell.row === r && hoveredCell.col === c) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = highlightColor;
          ctx.strokeRect(c * pixelSize + 1.5, r * pixelSize + 1.5, pixelSize - 3, pixelSize - 3);
          ctx.fillStyle = 'rgba(6, 182, 212, 0.28)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.restore();
  }, [matrix, hoveredCell, rows, cols, pixelSize, highlightColor]);

  const handleMouseMove = (e) => {
    if (!onHoverCell || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / pixelSize);
    const row = Math.floor(y / pixelSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      onHoverCell({ row, col, x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="compact-canvas-wrapper" onMouseLeave={() => onHoverCell && onHoverCell(null)}>
      <canvas
        ref={canvasRef}
        className="compact-pixel-canvas"
        onMouseMove={handleMouseMove}
        onClick={handleMouseMove}
      />
    </div>
  );
}

export default function Step8MatrixAddition({ onSelectStep }) {
  // Primary Operation: 'add' (Addition) or 'sub' (Subtraction)
  const [operation, setOperation] = useState('add');

  // Alpha slider state (0.0 to 1.0)
  const [alpha, setAlpha] = useState(0.5);

  // Addition Mode: 'blend' (C = αA + (1-α)B) or 'direct' (C = min(255, A + B))
  const [mode, setMode] = useState('blend');

  // Subtraction Mode: 'direct' (C = clamp(A - B)), 'abs' (C = |A - B|), or 'weighted' (C = clamp(A - αB))
  const [subMode, setSubMode] = useState('direct');

  // Selected preset key
  const [currentPresetKey, setCurrentPresetKey] = useState('crossAndFrame');

  // Matrix A and Matrix B state
  const [matrixA, setMatrixA] = useState(PRESET_PAIRS.crossAndFrame.matrixA);
  const [matrixB, setMatrixB] = useState(PRESET_PAIRS.crossAndFrame.matrixB);

  // Synchronized hovered cell: { row, col, x, y }
  const [hoveredCell, setHoveredCell] = useState(null);

  // Calculate Result Matrix C based on active operation and mode
  const matrixC = useMemo(() => {
    const rows = matrixA.length;
    const cols = matrixA[0].length;
    const result = createEmptyMatrix(rows, cols);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const valA = matrixA[i][j];
        const valB = matrixB[i][j];

        if (operation === 'add') {
          if (mode === 'direct') {
            // Direct addition clamped to [0, 255]
            result[i][j] = clampPixel(valA + valB);
          } else {
            // Convex Blending: C = αA + (1-α)B
            result[i][j] = clampPixel(alpha * valA + (1 - alpha) * valB);
          }
        } else {
          // Matrix Subtraction
          if (subMode === 'abs') {
            // Absolute Difference: C = |A - B| (Motion & Change Detection)
            result[i][j] = clampPixel(Math.abs(valA - valB));
          } else if (subMode === 'weighted') {
            // Weighted Subtraction: C = clamp(A - αB)
            result[i][j] = clampPixel(valA - alpha * valB);
          } else {
            // Direct Subtraction: C = clamp(A - B)
            result[i][j] = clampPixel(valA - valB);
          }
        }
      }
    }
    return result;
  }, [matrixA, matrixB, alpha, mode, operation, subMode]);

  // Count cells clipped at 255 in direct addition
  const clippedOverflowCount = useMemo(() => {
    if (operation !== 'add' || mode !== 'direct') return 0;
    let count = 0;
    for (let i = 0; i < matrixA.length; i++) {
      for (let j = 0; j < matrixA[0].length; j++) {
        if (matrixA[i][j] + matrixB[i][j] > 255) count++;
      }
    }
    return count;
  }, [matrixA, matrixB, mode, operation]);

  // Count cells clipped at 0 in direct subtraction (underflow)
  const clippedUnderflowCount = useMemo(() => {
    if (operation !== 'sub') return 0;
    let count = 0;
    for (let i = 0; i < matrixA.length; i++) {
      for (let j = 0; j < matrixA[0].length; j++) {
        const valA = matrixA[i][j];
        const valB = matrixB[i][j];
        if (subMode === 'weighted') {
          if (valA - alpha * valB < 0) count++;
        } else if (subMode === 'direct') {
          if (valA - valB < 0) count++;
        }
      }
    }
    return count;
  }, [matrixA, matrixB, subMode, operation, alpha]);

  // Handlers for cell editing
  const handleCellChangeA = (r, c, val) => {
    const next = matrixA.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixA(next);
  };

  const handleCellChangeB = (r, c, val) => {
    const next = matrixB.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixB(next);
  };

  // Swap Matrices A and B
  const handleSwapMatrices = () => {
    const temp = matrixA;
    setMatrixA(matrixB);
    setMatrixB(temp);
  };

  // Select Preset
  const handleSelectPreset = (key) => {
    setCurrentPresetKey(key);
    setMatrixA(PRESET_PAIRS[key].matrixA.map(row => [...row]));
    setMatrixB(PRESET_PAIRS[key].matrixB.map(row => [...row]));
  };

  // Randomize both matrices with clean stepped values (multiples of 15)
  const handleRandomize = () => {
    const rows = 4;
    const cols = 4;
    const newA = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * 17) * 15)
    );
    const newB = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * 17) * 15)
    );
    setMatrixA(newA);
    setMatrixB(newB);
  };

  // Invert matrix values
  const handleInvertA = () => {
    setMatrixA(prev => prev.map(row => row.map(v => 255 - v)));
  };

  const handleInvertB = () => {
    setMatrixB(prev => prev.map(row => row.map(v => 255 - v)));
  };

  // Reset to current preset
  const handleReset = () => {
    handleSelectPreset(currentPresetKey);
    setAlpha(0.5);
  };

  // Current hovered values
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const valA = matrixA[row]?.[col] ?? 0;
    const valB = matrixB[row]?.[col] ?? 0;
    const valC = matrixC[row]?.[col] ?? 0;

    const rawSum = valA + valB;
    const rawDiff = valA - valB;
    const rawWeightedDiff = Math.round(valA - alpha * valB);
    const rawAbsDiff = Math.abs(valA - valB);

    const isOverflow = operation === 'add' && mode === 'direct' && rawSum > 255;
    const isUnderflow = operation === 'sub' && (
      (subMode === 'direct' && rawDiff < 0) ||
      (subMode === 'weighted' && (valA - alpha * valB) < 0)
    );

    return { 
      row, 
      col, 
      valA, 
      valB, 
      valC, 
      rawSum, 
      rawDiff, 
      rawWeightedDiff,
      rawAbsDiff,
      isOverflow, 
      isUnderflow 
    };
  }, [hoveredCell, matrixA, matrixB, matrixC, mode, operation, subMode, alpha]);

  return (
    <motion.div 
      className="step-module addition-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* STEP HEADER */}
      <div className="step-header-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span className="modal-badge-tag" style={{ margin: 0 }}>
              Chapter 8.1
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Element-by-Element Operations
            </span>
          </div>

          {/* Sub-Chapter Switcher */}
          <div className="sub-chapter-nav">
            <button 
              className="sub-chapter-pill active"
              title="Current: 8.1 Matrix Addition (Image Blending)"
            >
              <Blend size={13} />
              <span>8.1 Blend</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(9) : (window.location.hash = '#step9')}
              title="Jump to 8.2 Matrix Subtraction (Background Removal)"
            >
              <Scissors size={13} />
              <span>8.2 Remove BG</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(10) : (window.location.hash = '#step10')}
              title="Jump to 8.3 Matrix Subtraction (Find What Changed)"
            >
              <Scan size={13} />
              <span>8.3 What Changed</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(11) : (window.location.hash = '#step11')}
              title="Jump to 8.4 Image Inversion & X-Ray Effect"
            >
              <Activity size={13} />
              <span>8.4 Invert &amp; X-Ray</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(12) : (window.location.hash = '#step12')}
              title="Jump to 8.5 Determinant: Stretch, Shrink, Flip or Collapse"
            >
              <Maximize2 size={13} />
              <span>8.5 Determinant</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(13) : (window.location.hash = '#step13')}
              title="Jump to 8.6 Matrix Inverse: Undo the Transformation"
            >
              <Undo2 size={13} />
              <span>8.6 Matrix Inverse</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(14) : (window.location.hash = '#step14')}
              title="Jump to 8.7 Matrix Inverse: Zoom In and Zoom Out"
            >
              <ZoomIn size={13} />
              <span>8.7 Zoom In &amp; Out</span>
            </button>
          </div>
        </div>

        <h2 className="step-heading">
          8.1 Matrix Addition: Blend Two Images
        </h2>
        <p className="step-description">
          {operation === 'add' ? (
            <>
              Combine two images of the same size using matrix addition. Since direct addition (<code>C = A + B</code>) can produce pixel values exceeding 255 (causing intensity blowout/saturation), we introduce a blending factor: <strong>C = αA + (1 − α)B</strong>, where <strong>0 ≤ α ≤ 1</strong>. Notice how corresponding pixels combine element-by-element!
            </>
          ) : (
            <>
              Subtract one image matrix from another element-by-element. Direct subtraction (<code>C = clamp(A − B)</code>) clamps negative values to <strong>0 (Black)</strong>, while Absolute Difference (<code>C = |A − B|</code>) measures the exact delta between frames—a core principle of <strong>motion tracking</strong>, <strong>background removal</strong>, and <strong>defect detection</strong>!
            </>
          )}
        </p>
      </div>

      {/* TOP CONTROLS CARD */}
      <div className="top-control-card addition-controls-card">
        <div className="addition-controls-grid">
          
          {/* Part 1: Factor Slider (Alpha Blending or Subtraction Intensity) */}
          <div className="slider-group" style={{ marginBottom: 0 }}>
            <div className="slider-label" style={{ marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Blend size={16} color="var(--accent-purple)" />
                <span>
                  {operation === 'add' 
                    ? 'Blending Factor (α):' 
                    : subMode === 'weighted' 
                      ? 'Subtraction Weight (α):' 
                      : 'Weight Factor (α):'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span className="font-mono" style={{ color: 'var(--accent-purple)', fontSize: '1.25rem', fontWeight: '800' }}>
                  {alpha.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {operation === 'add' 
                    ? `(${Math.round(alpha * 100)}% A + ${Math.round((1 - alpha) * 100)}% B)`
                    : subMode === 'weighted' 
                      ? `(A − ${alpha.toFixed(2)} × B)` 
                      : subMode === 'abs'
                        ? '(|A − B| unweighted)'
                        : '(Direct A − B)'}
                </span>
              </div>
            </div>

            <input
              type="range"
              className="slider-input"
              min="0.0"
              max="1.0"
              step="0.01"
              value={alpha}
              disabled={operation === 'add' ? mode === 'direct' : subMode !== 'weighted'}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              onInput={(e) => setAlpha(parseFloat(e.target.value))}
              style={{ 
                '--slider-pct': `${alpha * 100}%`, 
                '--slider-color': 'var(--accent-purple)',
                opacity: (operation === 'add' ? mode === 'direct' : subMode !== 'weighted') ? 0.35 : 1 
              }}
            />

            {/* Quick Presets for Alpha */}
            <div className="alpha-presets-row">
              <button 
                className={`mini-preset-pill ${alpha === 1.0 ? 'active' : ''}`}
                onClick={() => {
                  if (operation === 'add') setMode('blend');
                  if (operation === 'sub') setSubMode('weighted');
                  setAlpha(1.0);
                }}
                title={operation === 'add' ? '100% Image A' : '100% Subtraction Weight'}
              >
                {operation === 'add' ? '100% A' : '1.00×'}
              </button>
              <button 
                className={`mini-preset-pill ${alpha === 0.75 ? 'active' : ''}`}
                onClick={() => {
                  if (operation === 'add') setMode('blend');
                  if (operation === 'sub') setSubMode('weighted');
                  setAlpha(0.75);
                }}
                title={operation === 'add' ? '75% Image A, 25% Image B' : '75% Subtraction Weight'}
              >
                {operation === 'add' ? '75% A' : '0.75×'}
              </button>
              <button 
                className={`mini-preset-pill ${alpha === 0.5 ? 'active' : ''}`}
                onClick={() => {
                  if (operation === 'add') setMode('blend');
                  if (operation === 'sub') setSubMode('weighted');
                  setAlpha(0.5);
                }}
                title={operation === 'add' ? 'Equal 50/50 blend' : '50% Subtraction Weight'}
              >
                {operation === 'add' ? '50/50' : '0.50×'}
              </button>
              <button 
                className={`mini-preset-pill ${alpha === 0.25 ? 'active' : ''}`}
                onClick={() => {
                  if (operation === 'add') setMode('blend');
                  if (operation === 'sub') setSubMode('weighted');
                  setAlpha(0.25);
                }}
                title={operation === 'add' ? '25% Image A, 75% Image B' : '25% Subtraction Weight'}
              >
                {operation === 'add' ? '25% A' : '0.25×'}
              </button>
              <button 
                className={`mini-preset-pill ${alpha === 0.0 ? 'active' : ''}`}
                onClick={() => {
                  if (operation === 'add') setMode('blend');
                  if (operation === 'sub') setSubMode('weighted');
                  setAlpha(0.0);
                }}
                title={operation === 'add' ? '100% Image B' : '0% Subtraction (No effect)'}
              >
                {operation === 'add' ? '100% B' : '0.00×'}
              </button>
            </div>
          </div>

          {/* Part 2: Arithmetic Operation & Modes & Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            
            {/* Primary Operation Switch: Addition vs Subtraction */}
            <div className="control-row-group">
              <span className="control-row-label">
                Operation:
              </span>
              <div className="addition-mode-toggle operation-method-toggle">
                <button
                  className={`mode-btn ${operation === 'add' ? 'active' : ''}`}
                  onClick={() => setOperation('add')}
                  title="Element-wise Matrix Addition"
                >
                  <Plus size={13} /> <span>Addition (+)</span>
                </button>
                <button
                  className={`mode-btn ${operation === 'sub' ? 'active' : ''}`}
                  onClick={() => {
                    setOperation('sub');
                    // Automatically recommend motion/delta preset if coming from default
                    if (currentPresetKey === 'crossAndFrame') {
                      handleSelectPreset('motionDetect');
                    }
                  }}
                  title="Element-wise Matrix Subtraction & Change Detection"
                >
                  <Minus size={13} /> <span>Subtraction (−)</span>
                </button>
              </div>
            </div>

            {/* Sub-modes for the Active Operation */}
            <div className="control-row-group">
              <span className="control-row-label">
                {operation === 'add' ? 'Addition Mode:' : 'Subtraction Mode:'}
              </span>
              <div className="addition-mode-toggle">
                {operation === 'add' ? (
                  <>
                    <button
                      className={`mode-btn ${mode === 'blend' ? 'active' : ''}`}
                      onClick={() => setMode('blend')}
                    >
                      <Blend size={13} /> <span>Blending</span> <span className="mode-pill-math">αA + (1-α)B</span>
                    </button>
                    <button
                      className={`mode-btn ${mode === 'direct' ? 'active' : ''}`}
                      onClick={() => setMode('direct')}
                    >
                      <Plus size={13} /> <span>Direct</span> <span className="mode-pill-math">A + B</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`mode-btn ${subMode === 'direct' ? 'active' : ''}`}
                      onClick={() => setSubMode('direct')}
                      title="Direct subtraction C = clamp(A − B)"
                    >
                      <Minus size={13} /> <span>Direct</span> <span className="mode-pill-math">clamp(A−B)</span>
                    </button>
                    <button
                      className={`mode-btn ${subMode === 'abs' ? 'active' : ''}`}
                      onClick={() => setSubMode('abs')}
                      title="Absolute difference C = |A − B| (Motion/Delta analysis)"
                    >
                      <Scan size={13} /> <span>Absolute</span> <span className="mode-pill-math">|A−B|</span>
                    </button>
                    <button
                      className={`mode-btn ${subMode === 'weighted' ? 'active' : ''}`}
                      onClick={() => setSubMode('weighted')}
                      title="Weighted subtraction C = clamp(A − αB)"
                    >
                      <Sliders size={13} /> <span>Weighted</span> <span className="mode-pill-math">clamp(A−αB)</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Presets & Actions Row */}
            <div className="addition-presets-actions-container">
              <div className="addition-presets-strip">
                <span className="control-row-label" style={{ marginRight: '0.15rem' }}>
                  Presets:
                </span>
                {Object.entries(PRESET_PAIRS).map(([key, data]) => (
                  <button
                    key={key}
                    className={`preset-btn mini-btn ${currentPresetKey === key ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(key)}
                    title={data.desc}
                  >
                    {data.name}
                  </button>
                ))}
              </div>

              <div className="addition-actions-group">
                <button 
                  className="preset-btn mini-btn icon-only-btn" 
                  onClick={handleSwapMatrices}
                  title="Swap Matrix A and Matrix B (Non-commutative in subtraction!)"
                >
                  <ArrowLeftRight size={13} />
                  <span>Swap A ⇄ B</span>
                </button>
                <button 
                  className="preset-btn mini-btn icon-only-btn" 
                  onClick={handleRandomize}
                  title="Generate Random Clean Pixel Matrices"
                >
                  <Shuffle size={13} />
                  <span>Random</span>
                </button>
                <button 
                  className="preset-btn mini-btn icon-only-btn" 
                  onClick={handleReset}
                  title="Reset to default preset"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ELEMENT-BY-ELEMENT LIVE FORMULA INSPECTOR STRIP */}
      <div className="addition-formula-inspector">
        {hoveredInfo ? (
          <div className="formula-inspector-content active">
            <span className="inspector-pill">
              Cell ({hoveredInfo.row + 1}, {hoveredInfo.col + 1})
            </span>
            <div className="formula-math-tokens">
              {operation === 'add' ? (
                mode === 'blend' ? (
                  <>
                    <span className="token-var">C<sub>{hoveredInfo.row+1},{hoveredInfo.col+1}</sub></span>
                    <span className="token-op">=</span>
                    <span className="token-val" style={{ color: 'var(--accent-purple)' }}>{alpha.toFixed(2)} × {hoveredInfo.valA}</span>
                    <span className="token-op">+</span>
                    <span className="token-val" style={{ color: '#F59E0B' }}>{(1 - alpha).toFixed(2)} × {hoveredInfo.valB}</span>
                    <span className="token-op">=</span>
                    <span className="token-sub">
                      {Math.round(alpha * hoveredInfo.valA)} + {Math.round((1 - alpha) * hoveredInfo.valB)}
                    </span>
                    <span className="token-op">=</span>
                    <span className="token-result">{hoveredInfo.valC}</span>
                  </>
                ) : (
                  <>
                    <span className="token-var">C<sub>{hoveredInfo.row+1},{hoveredInfo.col+1}</sub></span>
                    <span className="token-op">=</span>
                    <span className="token-val" style={{ color: 'var(--accent-purple)' }}>{hoveredInfo.valA}</span>
                    <span className="token-op">+</span>
                    <span className="token-val" style={{ color: '#F59E0B' }}>{hoveredInfo.valB}</span>
                    <span className="token-op">=</span>
                    <span className="token-sub">{hoveredInfo.rawSum}</span>
                    {hoveredInfo.isOverflow && (
                      <span className="token-clipped-warning">
                        <AlertTriangle size={13} /> Clamped to max 255!
                      </span>
                    )}
                    <span className="token-op">➔</span>
                    <span className="token-result">{hoveredInfo.valC}</span>
                  </>
                )
              ) : (
                /* SUBTRACTION INSPECTOR */
                subMode === 'abs' ? (
                  <>
                    <span className="token-var">C<sub>{hoveredInfo.row+1},{hoveredInfo.col+1}</sub></span>
                    <span className="token-op">=</span>
                    <span className="token-op">|</span>
                    <span className="token-val" style={{ color: 'var(--accent-purple)' }}>{hoveredInfo.valA}</span>
                    <span className="token-op">−</span>
                    <span className="token-val" style={{ color: '#F59E0B' }}>{hoveredInfo.valB}</span>
                    <span className="token-op">|</span>
                    <span className="token-op">=</span>
                    <span className="token-sub">|{hoveredInfo.rawDiff}|</span>
                    <span className="token-op">➔</span>
                    <span className="token-result">{hoveredInfo.valC}</span>
                  </>
                ) : subMode === 'weighted' ? (
                  <>
                    <span className="token-var">C<sub>{hoveredInfo.row+1},{hoveredInfo.col+1}</sub></span>
                    <span className="token-op">=</span>
                    <span className="token-val" style={{ color: 'var(--accent-purple)' }}>{hoveredInfo.valA}</span>
                    <span className="token-op">−</span>
                    <span className="token-val" style={{ color: '#F59E0B' }}>({alpha.toFixed(2)} × {hoveredInfo.valB})</span>
                    <span className="token-op">=</span>
                    <span className="token-sub">{hoveredInfo.valA} − {Math.round(alpha * hoveredInfo.valB)} = {hoveredInfo.rawWeightedDiff}</span>
                    {hoveredInfo.isUnderflow && (
                      <span className="token-clipped-warning underflow-warning">
                        <AlertTriangle size={13} /> Clamped to min 0!
                      </span>
                    )}
                    <span className="token-op">➔</span>
                    <span className="token-result">{hoveredInfo.valC}</span>
                  </>
                ) : (
                  <>
                    <span className="token-var">C<sub>{hoveredInfo.row+1},{hoveredInfo.col+1}</sub></span>
                    <span className="token-op">=</span>
                    <span className="token-val" style={{ color: 'var(--accent-purple)' }}>{hoveredInfo.valA}</span>
                    <span className="token-op">−</span>
                    <span className="token-val" style={{ color: '#F59E0B' }}>{hoveredInfo.valB}</span>
                    <span className="token-op">=</span>
                    <span className="token-sub">{hoveredInfo.rawDiff}</span>
                    {hoveredInfo.isUnderflow && (
                      <span className="token-clipped-warning underflow-warning">
                        <AlertTriangle size={13} /> Clamped to min 0!
                      </span>
                    )}
                    <span className="token-op">➔</span>
                    <span className="token-result">{hoveredInfo.valC}</span>
                  </>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="formula-inspector-content idle">
            <Sparkles size={14} className="sparkle-idle-icon" />
            <span>
              <strong>Element-by-Element Principle:</strong>{' '}
              {operation === 'add'
                ? 'Corresponding pixels of Matrix A and Matrix B are combined individually. Hover over any cell below to inspect its exact arithmetic!'
                : 'Corresponding pixels of Matrix A and Matrix B are subtracted individually. Hover over any cell below to inspect difference arithmetic!'}
            </span>
          </div>
        )}

        {/* Warning Badges for Saturated Overflow or Negative Underflow */}
        {operation === 'add' && mode === 'direct' && clippedOverflowCount > 0 && (
          <div className="clipped-summary-badge">
            <AlertTriangle size={13} />
            <span>{clippedOverflowCount} cell{clippedOverflowCount > 1 ? 's' : ''} saturated (&gt; 255)</span>
          </div>
        )}

        {operation === 'sub' && (subMode === 'direct' || subMode === 'weighted') && clippedUnderflowCount > 0 && (
          <div className="clipped-summary-badge underflow-summary-badge">
            <AlertTriangle size={13} />
            <span>{clippedUnderflowCount} cell{clippedUnderflowCount > 1 ? 's' : ''} underflowed (&lt; 0)</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          THE HORIZONTAL / RESPONSIVE LINE:
          MATRIX A  ➕/➖  MATRIX B  🟰  RESULTANT MATRIX C
         ========================================================================= */}
      <div className="addition-horizontal-line-container">
        
        {/* COLUMN 1: MATRIX & IMAGE A */}
        <div className="addition-column-card card-matrix-a">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-a">A</span>
              <div>
                <h3 className="addition-card-title">Image & Matrix A</h3>
                <span className="addition-card-subtitle">Editable Inputs (0–255)</span>
              </div>
            </div>
            <div className="col-header-right">
              {operation === 'add' && mode === 'blend' && (
                <span className="addition-weight-pill pill-a" title="Current alpha weight for Image A">
                  α = {alpha.toFixed(2)}
                </span>
              )}
              <span className="matrix-dims">4 × 4</span>
            </div>
          </div>

          {/* Interactive Visual + Numerical Matrix Stack */}
          <div className="addition-card-body">
            {/* Visual Canvas Preview */}
            <div className="canvas-subrow">
              <CompactPixelCanvas
                matrix={matrixA}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={28}
                highlightColor="var(--accent-purple)"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label">Visual Representation A</span>
                <span className="subrow-hint">Grayscale: 0 (black) to 255 (white)</span>
                <div className="subrow-actions">
                  <button className="text-action-btn" onClick={handleInvertA} title="Invert colors (255 - x)">
                    Invert A
                  </button>
                  <button 
                    className="text-action-btn" 
                    onClick={() => setMatrixA(createEmptyMatrix(4, 4, 128))}
                    title="Fill with mid-gray (128)"
                  >
                    128 Gray
                  </button>
                </div>
              </div>
            </div>

            {/* Editable 4x4 Numerical Matrix Grid */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixA[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixA.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    return (
                      <div
                        key={`a-${i}-${j}`}
                        className={`matrix-cell editable-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--cell-accent': 'var(--accent-purple)',
                          borderColor: isHovered ? 'var(--accent-purple)' : undefined,
                          background: `linear-gradient(135deg, rgba(${val},${val},${val},0.14) 0%, var(--bg-secondary) 100%)`
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onWheel={(e) => {
                          e.preventDefault();
                          const delta = e.deltaY < 0 ? 5 : -5;
                          handleCellChangeA(i, j, Math.min(255, Math.max(0, val + delta)));
                        }}
                      >
                        <div className="editable-cell-inner compact-inner">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={val}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value);
                              const valid = isNaN(parsed) ? 0 : Math.min(255, Math.max(0, parsed));
                              handleCellChangeA(i, j, valid);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                                e.preventDefault();
                                handleCellChangeA(i, j, Math.min(255, val + 5));
                              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                                e.preventDefault();
                                handleCellChangeA(i, j, Math.max(0, val - 5));
                              }
                            }}
                            className="matrix-cell-input compact-input"
                            style={{ color: 'var(--accent-purple)' }}
                          />
                          <div className="stepper-arrow-buttons compact-steppers">
                            <button
                              type="button"
                              className="stepper-arrow-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellChangeA(i, j, Math.min(255, val + 10));
                              }}
                              title="+10"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="stepper-arrow-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellChangeA(i, j, Math.max(0, val - 10));
                              }}
                              title="-10"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MATH OPERATOR: ➕ or ➖ */}
        <div className="addition-operator-divider">
          <div 
            className={`operator-badge ${operation === 'add' ? 'plus-badge' : 'minus-badge'}`} 
            title={operation === 'add' ? "Matrix Addition Operator" : "Matrix Subtraction Operator"}
          >
            {operation === 'add' ? (
              <Plus size={22} strokeWidth={2.8} />
            ) : (
              <Minus size={22} strokeWidth={2.8} />
            )}
          </div>
          <span className="operator-label">
            {operation === 'add' ? (
              mode === 'blend' ? 'αA + (1-α)B' : 'A + B'
            ) : (
              subMode === 'abs' ? '|A − B|' : subMode === 'weighted' ? 'A − αB' : 'A − B'
            )}
          </span>
        </div>

        {/* COLUMN 2: MATRIX & IMAGE B */}
        <div className="addition-column-card card-matrix-b">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-b">B</span>
              <div>
                <h3 className="addition-card-title">Image & Matrix B</h3>
                <span className="addition-card-subtitle">Editable Inputs (0–255)</span>
              </div>
            </div>
            <div className="col-header-right">
              {operation === 'add' && mode === 'blend' && (
                <span className="addition-weight-pill pill-b" title="Current (1-alpha) weight for Image B">
                  1-α = {(1 - alpha).toFixed(2)}
                </span>
              )}
              {operation === 'sub' && subMode === 'weighted' && (
                <span className="addition-weight-pill pill-b" title="Current alpha scalar applied to Image B">
                  α = {alpha.toFixed(2)}
                </span>
              )}
              <span className="matrix-dims" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)' }}>
                4 × 4
              </span>
            </div>
          </div>

          {/* Interactive Visual + Numerical Matrix Stack */}
          <div className="addition-card-body">
            {/* Visual Canvas Preview */}
            <div className="canvas-subrow">
              <CompactPixelCanvas
                matrix={matrixB}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={28}
                highlightColor="#F59E0B"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label">Visual Representation B</span>
                <span className="subrow-hint">Grayscale: 0 (black) to 255 (white)</span>
                <div className="subrow-actions">
                  <button className="text-action-btn" onClick={handleInvertB} title="Invert colors (255 - x)">
                    Invert B
                  </button>
                  <button 
                    className="text-action-btn" 
                    onClick={() => setMatrixB(createEmptyMatrix(4, 4, 128))}
                    title="Fill with mid-gray (128)"
                  >
                    128 Gray
                  </button>
                </div>
              </div>
            </div>

            {/* Editable 4x4 Numerical Matrix Grid */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixB[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixB.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    return (
                      <div
                        key={`b-${i}-${j}`}
                        className={`matrix-cell editable-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--cell-accent': '#F59E0B',
                          borderColor: isHovered ? '#F59E0B' : undefined,
                          background: `linear-gradient(135deg, rgba(${val},${val},${val},0.14) 0%, var(--bg-secondary) 100%)`
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onWheel={(e) => {
                          e.preventDefault();
                          const delta = e.deltaY < 0 ? 5 : -5;
                          handleCellChangeB(i, j, Math.min(255, Math.max(0, val + delta)));
                        }}
                      >
                        <div className="editable-cell-inner compact-inner">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={val}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value);
                              const valid = isNaN(parsed) ? 0 : Math.min(255, Math.max(0, parsed));
                              handleCellChangeB(i, j, valid);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                                e.preventDefault();
                                handleCellChangeB(i, j, Math.min(255, val + 5));
                              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                                e.preventDefault();
                                handleCellChangeB(i, j, Math.max(0, val - 5));
                              }
                            }}
                            className="matrix-cell-input compact-input"
                            style={{ color: '#F59E0B' }}
                          />
                          <div className="stepper-arrow-buttons compact-steppers">
                            <button
                              type="button"
                              className="stepper-arrow-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellChangeB(i, j, Math.min(255, val + 10));
                              }}
                              title="+10"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="stepper-arrow-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellChangeB(i, j, Math.max(0, val - 10));
                              }}
                              title="-10"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MATH OPERATOR: 🟰 */}
        <div className="addition-operator-divider">
          <div className="operator-badge equals-badge" title="Equals Result">
            <Equal size={22} strokeWidth={2.8} />
          </div>
          <span className="operator-label">
            Output C
          </span>
        </div>

        {/* COLUMN 3: RESULTANT MATRIX & IMAGE C */}
        <div className="addition-column-card card-matrix-c">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-c">C</span>
              <div>
                <h3 className="addition-card-title">Result Matrix C</h3>
                <span className="addition-card-subtitle" style={{ color: 'var(--accent-emerald)' }}>
                  {operation === 'add' ? (
                    mode === 'blend' ? 'Live Blended Output' : 'Live Direct Sum'
                  ) : (
                    subMode === 'abs' 
                      ? 'Live Absolute Delta' 
                      : subMode === 'weighted' 
                        ? 'Live Weighted Difference' 
                        : 'Live Direct Difference'
                  )}
                </span>
              </div>
            </div>
            <div className="col-header-right">
              <span className="addition-weight-pill pill-c" title="Resulting mathematical formulation">
                {operation === 'add' ? (
                  mode === 'blend' ? 'C = αA + (1-α)B' : 'C = A + B'
                ) : (
                  subMode === 'abs' ? 'C = |A − B|' : subMode === 'weighted' ? 'C = clamp(A − αB)' : 'C = clamp(A − B)'
                )}
              </span>
              <span className="matrix-dims" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)' }}>
                4 × 4
              </span>
            </div>
          </div>

          {/* Interactive Visual + Numerical Matrix Stack */}
          <div className="addition-card-body">
            {/* Visual Canvas Preview */}
            <div className="canvas-subrow">
              <CompactPixelCanvas
                matrix={matrixC}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={28}
                highlightColor="var(--accent-emerald)"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label" style={{ color: 'var(--text-primary)' }}>
                  {operation === 'add' ? 'Combined Image C' : 'Difference Image C'}
                </span>
                <span className="subrow-hint">
                  {operation === 'add' ? (
                    mode === 'blend' ? (
                      `Smooth convex transition at α = ${alpha.toFixed(2)}`
                    ) : (
                      clippedOverflowCount > 0 ? `${clippedOverflowCount} saturated pixels` : 'Direct element sum'
                    )
                  ) : (
                    subMode === 'abs' ? (
                      'Absolute change / motion detection'
                    ) : subMode === 'weighted' ? (
                      `Weighted subtraction at α = ${alpha.toFixed(2)}`
                    ) : (
                      clippedUnderflowCount > 0 ? `${clippedUnderflowCount} underflow pixels clamped to 0` : 'Direct difference clamp(A − B)'
                    )
                  )}
                </span>
                <div className="subrow-actions">
                  <span className="status-live-indicator">
                    <span className="pulse-dot"></span> Live Reactive
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only Resulting 4x4 Matrix Grid */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixC[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixC.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    const valA = matrixA[i][j];
                    const valB = matrixB[i][j];

                    const rawDirectAdd = valA + valB;
                    const isOverflow = operation === 'add' && mode === 'direct' && rawDirectAdd > 255;

                    const rawDirectSub = valA - valB;
                    const rawWeightedSub = valA - alpha * valB;
                    const isUnderflow = operation === 'sub' && (
                      (subMode === 'direct' && rawDirectSub < 0) ||
                      (subMode === 'weighted' && rawWeightedSub < 0)
                    );

                    return (
                      <div
                        key={`c-${i}-${j}`}
                        className={`matrix-cell result-cell compact-cell ${isHovered ? 'hovered' : ''} ${isOverflow ? 'clipped-cell' : ''} ${isUnderflow ? 'underflow-cell' : ''}`}
                        style={{
                          '--cell-accent': 'var(--accent-emerald)',
                          borderColor: isHovered ? 'var(--accent-emerald)' : undefined,
                          background: `linear-gradient(135deg, rgba(${val},${val},${val},0.18) 0%, var(--bg-secondary) 100%)`
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                      >
                        <span 
                          className="matrix-cell-val compact-val" 
                          style={{ 
                            color: isOverflow ? '#EF4444' : isUnderflow ? '#F59E0B' : isHovered ? '#FFFFFF' : 'var(--accent-emerald)',
                            fontWeight: '800'
                          }}
                        >
                          {val}
                        </span>
                        {isOverflow && (
                          <span className="clipped-corner-tag" title={`Unclipped sum was ${rawDirectAdd}`}>
                            MAX
                          </span>
                        )}
                        {isUnderflow && (
                          <span className="clipped-corner-tag underflow-corner-tag" title={`Raw negative difference was ${subMode === 'weighted' ? Math.round(rawWeightedSub) : rawDirectSub}`}>
                            MIN
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FLOATING CURSOR TOOLTIP (Guarded against right-edge overflow to eliminate layout shaking) */}
      {hoveredCell && hoveredCell.x !== undefined && (() => {
        const tooltipWidth = 320;
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const leftPos = hoveredCell.x > (screenWidth - tooltipWidth - 20)
          ? Math.max(10, hoveredCell.x - tooltipWidth - 14)
          : hoveredCell.x + 14;

        return (
          <div 
            className="cursor-tooltip"
            style={{
              position: 'fixed',
              left: `${leftPos}px`,
              top: `${hoveredCell.y + 14}px`,
              pointerEvents: 'none',
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              borderRadius: '20px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
              ({hoveredCell.row + 1}, {hoveredCell.col + 1})
            </span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>A: <strong style={{ color: 'var(--accent-purple)' }}>{matrixA[hoveredCell.row][hoveredCell.col]}</strong></span>
            <span style={{ opacity: 0.3 }}>+</span>
            <span>B: <strong style={{ color: '#F59E0B' }}>{matrixB[hoveredCell.row][hoveredCell.col]}</strong></span>
            <span style={{ opacity: 0.3 }}>=</span>
            <span>C: <strong style={{ color: '#10B981' }}>{matrixC[hoveredCell.row][hoveredCell.col]}</strong></span>
          </div>
        );
      })()}
    </motion.div>
  );
}
