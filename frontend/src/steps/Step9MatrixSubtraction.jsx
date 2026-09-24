import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, 
  Minus, 
  Equal, 
  Filter, 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  Volume2, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Blend,
  Eye,
  Sliders,
  AlertCircle,
  Scan,
  Activity,
  Maximize2,
  Undo2,
  ZoomIn
} from 'lucide-react';
import { clampPixel, createEmptyMatrix, subtractMatrices, thresholdMatrix } from '../core/mathEngine';

// Presets representing Scene with Object (I) and Empty Background (B)
const SUBTRACTION_PRESETS = {
  movingBox: {
    name: 'Moving Box',
    desc: 'Bright physical box placed onto a textured floor background',
    bg: [
      [65, 72, 68, 75],
      [70, 64, 78, 66],
      [68, 76, 65, 72],
      [74, 69, 73, 67]
    ],
    scene: [
      [65, 72,  68,  75],
      [70, 230, 230, 66],
      [68, 230, 230, 72],
      [74, 69,  73,  67]
    ],
    defaultT: 25
  },
  securityHallway: {
    name: 'Hallway Person',
    desc: 'Surveillance scene of a person walking into a hallway',
    bg: [
      [30, 50, 70, 90],
      [30, 50, 70, 90],
      [30, 50, 70, 90],
      [30, 50, 70, 90]
    ],
    scene: [
      [30, 240, 240, 90],
      [30, 240, 240, 90],
      [30, 240, 240, 90],
      [30, 50,  70,  90]
    ],
    defaultT: 30
  },
  centerGem: {
    name: 'Tabletop Gem',
    desc: 'High-contrast glowing diamond placed on a dark tabletop',
    bg: [
      [35, 40, 42, 38],
      [38, 36, 40, 42],
      [42, 40, 38, 36],
      [36, 42, 35, 40]
    ],
    scene: [
      [35,  245, 245, 38],
      [245, 255, 255, 245],
      [245, 255, 255, 245],
      [36,  245, 245, 40]
    ],
    defaultT: 20
  },
  shadowChallenge: {
    name: 'Object & Shadow',
    desc: 'Dark object with faint shadow demonstrating threshold separation',
    bg: [
      [180, 180, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180],
      [180, 180, 180, 180]
    ],
    scene: [
      [180, 180, 180, 180],
      [180, 40,  40,  180],
      [180, 40,  40,  165],
      [180, 180, 165, 165]
    ],
    defaultT: 30
  }
};

/**
 * Compact Canvas Component for the 4-column horizontal pipeline
 */
function PipelineCanvas({
  matrix,
  isMask = false,
  extractedImage = null,
  hoveredCell,
  onHoverCell,
  pixelSize = 26,
  highlightColor = 'var(--accent-purple)',
  title
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
        let fillStyle = '#000000';

        if (extractedImage) {
          const val = extractedImage[r][c];
          fillStyle = `rgb(${val}, ${val}, ${val})`;
        } else if (isMask) {
          // Binary mask: 1 = pure white (255) or cyan, 0 = black (0)
          const isFg = matrix[r][c] === 1 || matrix[r][c] === 255;
          fillStyle = isFg ? '#FFFFFF' : '#0B0F17';
        } else {
          // Grayscale / difference intensity
          const v = matrix[r][c];
          fillStyle = `rgb(${v}, ${v}, ${v})`;
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Adaptive grid borders
        let brightness = matrix[r][c];
        if (extractedImage) brightness = extractedImage[r][c];
        if (isMask) brightness = matrix[r][c] ? 255 : 0;

        if (brightness < 60) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        } else if (brightness > 190) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        } else {
          ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.25)';
        }

        ctx.lineWidth = 1;
        ctx.strokeRect(c * pixelSize + 0.5, r * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);

        // Synchronized hover outline
        if (hoveredCell && hoveredCell.row === r && hoveredCell.col === c) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = highlightColor;
          ctx.strokeRect(c * pixelSize + 1.5, r * pixelSize + 1.5, pixelSize - 3, pixelSize - 3);
          ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.restore();
  }, [matrix, isMask, extractedImage, hoveredCell, rows, cols, pixelSize, highlightColor]);

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
        title={title}
      />
    </div>
  );
}

export default function Step9MatrixSubtraction({ onSelectStep }) {
  // Preset selection
  const [currentPresetKey, setCurrentPresetKey] = useState('movingBox');

  // Matrix I (Scene with Object) and Matrix B (Empty Background)
  const [matrixI, setMatrixI] = useState(SUBTRACTION_PRESETS.movingBox.scene);
  const [matrixB, setMatrixB] = useState(SUBTRACTION_PRESETS.movingBox.bg);

  // Threshold T for binary mask M
  const [threshold, setThreshold] = useState(25);

  // Camera sensor noise level: 0 (clean), 3 (subtle), 7 (medium), 14 (heavy)
  const [noiseLevel, setNoiseLevel] = useState(0);

  // Output representation in Column 4: 'mask' (M binary 1/0) or 'segmented' (I * M)
  const [outputView, setOutputView] = useState('mask');

  // Synchronized hovered cell
  const [hoveredCell, setHoveredCell] = useState(null);

  // Background matrix with optional real-world sensor noise added
  const noisyMatrixB = useMemo(() => {
    if (noiseLevel === 0) return matrixB;
    // Deterministic pseudo-noise based on coordinates so it doesn't flicker endlessly
    return matrixB.map((row, r) =>
      row.map((val, c) => {
        const jitter = Math.sin(r * 4.3 + c * 7.1) * noiseLevel;
        return clampPixel(val + Math.round(jitter));
      })
    );
  }, [matrixB, noiseLevel]);

  // Difference Matrix D = |I - B|
  const matrixD = useMemo(() => {
    return subtractMatrices(matrixI, noisyMatrixB, true);
  }, [matrixI, noisyMatrixB]);

  // Binary Mask Matrix M(x,y) = 1 if D(x,y) > T else 0
  const matrixM = useMemo(() => {
    return thresholdMatrix(matrixD, threshold, 1);
  }, [matrixD, threshold]);

  // Extracted Foreground Object F(x,y) = M(x,y) * I(x,y)
  const extractedObject = useMemo(() => {
    const rows = matrixI.length;
    const cols = matrixI[0].length;
    const res = createEmptyMatrix(rows, cols);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        res[i][j] = matrixM[i][j] === 1 ? matrixI[i][j] : 0;
      }
    }
    return res;
  }, [matrixI, matrixM]);

  // Stats: count of foreground vs background pixels detected
  const stats = useMemo(() => {
    let fgCount = 0;
    let bgCount = 0;
    for (let r = 0; r < matrixM.length; r++) {
      for (let c = 0; c < matrixM[0].length; c++) {
        if (matrixM[r][c] === 1) fgCount++;
        else bgCount++;
      }
    }
    return { fgCount, bgCount, total: matrixM.length * matrixM[0].length };
  }, [matrixM]);

  // Cell editing handlers
  const handleCellChangeI = (r, c, val) => {
    const next = matrixI.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixI(next);
  };

  const handleCellChangeB = (r, c, val) => {
    const next = matrixB.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixB(next);
  };

  // Select Preset
  const handleSelectPreset = (key) => {
    setCurrentPresetKey(key);
    const p = SUBTRACTION_PRESETS[key];
    setMatrixI(p.scene.map(row => [...row]));
    setMatrixB(p.bg.map(row => [...row]));
    setThreshold(p.defaultT);
  };

  // Reset to default
  const handleReset = () => {
    handleSelectPreset(currentPresetKey);
    setNoiseLevel(0);
  };

  // Randomize Scene and Background
  const handleRandomize = () => {
    const rows = 4;
    const cols = 4;
    const bgBase = Math.floor(Math.random() * 80) + 30;
    const newB = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => bgBase + Math.floor(Math.random() * 12) - 6)
    );
    const newI = newB.map(row => [...row]);
    // Place a random bright 2x2 object
    const startR = Math.floor(Math.random() * 2);
    const startC = Math.floor(Math.random() * 2);
    for (let r = startR; r < startR + 2; r++) {
      for (let c = startC; c < startC + 2; c++) {
        newI[r][c] = Math.min(255, bgBase + 140 + Math.floor(Math.random() * 40));
      }
    }
    setMatrixB(newB);
    setMatrixI(newI);
  };

  // Hover arithmetic detail
  const hoverDetail = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const valI = matrixI[row]?.[col] ?? 0;
    const valB = noisyMatrixB[row]?.[col] ?? 0;
    const valD = matrixD[row]?.[col] ?? 0;
    const valM = matrixM[row]?.[col] ?? 0;
    const isFg = valD > threshold;

    return { row, col, valI, valB, valD, valM, isFg };
  }, [hoveredCell, matrixI, noisyMatrixB, matrixD, matrixM, threshold]);

  return (
    <motion.div 
      className="step-module subtraction-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* STEP HEADER WITH SUB-CHAPTER SWITCHER */}
      <div className="step-header-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="modal-badge-tag" style={{ margin: 0 }}>
              Chapter 8.2
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Matrix Subtraction & Background Removal
            </span>
          </div>

          {/* Quick Sub-Chapter Switcher */}
          <div className="sub-chapter-nav">
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(8) : (window.location.hash = '#step8')}
              title="Jump to 8.1 Matrix Addition (Image Blending)"
            >
              <Blend size={13} />
              <span>8.1 Blend</span>
            </button>
            <button 
              className="sub-chapter-pill active"
              title="Current: 8.2 Matrix Subtraction (Background Removal)"
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

        <h2 className="step-heading">8.2 Matrix Subtraction: Remove the Background</h2>
        <p className="step-description">
          Subtract an empty background image matrix <strong>B</strong> from a scene matrix containing an object <strong>I</strong>: <code>D = |I − B|</code>. Unchanged background pixels yield values close to zero, while the introduced object creates a high difference. We then apply threshold <strong>T</strong> to construct a binary mask: <strong>M(x, y) = 1 if D(x, y) &gt; T, else 0</strong>.
        </p>
      </div>

      {/* TOP CONTROLS CARD */}
      <div className="top-control-card subtraction-controls-card">
        <div className="subtraction-controls-grid">
          
          {/* Part 1: Threshold Slider & Presets */}
          <div className="slider-group" style={{ marginBottom: 0 }}>
            <div className="slider-label" style={{ marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--accent-purple)" />
                <span>Detection Threshold (T):</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span className="font-mono" style={{ color: 'var(--accent-purple)', fontSize: '1.25rem', fontWeight: '800' }}>
                  {threshold}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  (D &gt; {threshold} ➔ Foreground 1)
                </span>
              </div>
            </div>

            <input
              type="range"
              className="slider-input"
              min="0"
              max="150"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              onInput={(e) => setThreshold(parseInt(e.target.value, 10))}
              style={{ 
                '--slider-pct': `${(threshold / 150) * 100}%`, 
                '--slider-color': 'var(--accent-purple)' 
              }}
            />

            {/* Quick Threshold Presets */}
            <div className="alpha-presets-row">
              <button 
                className={`mini-preset-pill ${threshold === 0 ? 'active' : ''}`}
                onClick={() => setThreshold(0)}
                title="T = 0 (Detects everything including tiny noise)"
              >
                T = 0 (Raw)
              </button>
              <button 
                className={`mini-preset-pill ${threshold === 12 ? 'active' : ''}`}
                onClick={() => setThreshold(12)}
                title="T = 12 (Low threshold)"
              >
                T = 12 (Low)
              </button>
              <button 
                className={`mini-preset-pill ${threshold === 25 ? 'active' : ''}`}
                onClick={() => setThreshold(25)}
                title="T = 25 (Optimal clean foreground mask)"
              >
                T = 25 (Optimal)
              </button>
              <button 
                className={`mini-preset-pill ${threshold === 50 ? 'active' : ''}`}
                onClick={() => setThreshold(50)}
                title="T = 50 (High threshold)"
              >
                T = 50 (High)
              </button>
              <button 
                className={`mini-preset-pill ${threshold === 100 ? 'active' : ''}`}
                onClick={() => setThreshold(100)}
                title="T = 100 (Too high - drops parts of the object)"
              >
                T = 100 (Strict)
              </button>
            </div>
          </div>

          {/* Part 2: Real-World Sensor Noise Simulation & Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Volume2 size={15} color="#F59E0B" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Camera Noise & Light Jitter:
                </span>
              </div>
              
              {/* Noise Presets */}
              <div className="noise-pill-group">
                <button
                  className={`noise-btn ${noiseLevel === 0 ? 'active' : ''}`}
                  onClick={() => setNoiseLevel(0)}
                  title="Ideal World: Background gives exact D = 0"
                >
                  0 (Ideal)
                </button>
                <button
                  className={`noise-btn ${noiseLevel === 4 ? 'active' : ''}`}
                  onClick={() => setNoiseLevel(4)}
                  title="Subtle camera sensor noise (±4 delta on background)"
                >
                  ±4 (Subtle)
                </button>
                <button
                  className={`noise-btn ${noiseLevel === 10 ? 'active' : ''}`}
                  onClick={() => setNoiseLevel(10)}
                  title="Lighting fluctuations & shadows (±10 delta)"
                >
                  ±10 (Heavy)
                </button>
              </div>
            </div>

            {/* Presets and Actions Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '0.2rem' }}>
                Presets:
              </span>
              {Object.entries(SUBTRACTION_PRESETS).map(([key, data]) => (
                <button
                  key={key}
                  className={`preset-btn mini-btn ${currentPresetKey === key ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(key)}
                  title={data.desc}
                >
                  {data.name}
                </button>
              ))}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                <button 
                  className="preset-btn mini-btn icon-only-btn" 
                  onClick={handleRandomize}
                  title="Generate Random Clean Scene & Background"
                >
                  <Shuffle size={13} />
                  <span>Random</span>
                </button>
                <button 
                  className="preset-btn mini-btn icon-only-btn" 
                  onClick={handleReset}
                  title="Reset to default"
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
        {hoverDetail ? (
          <div className="formula-inspector-content active">
            <span className="inspector-pill">
              Cell ({hoverDetail.row + 1}, {hoverDetail.col + 1})
            </span>
            <div className="formula-math-tokens">
              <span className="token-var">I</span>
              <span className="token-op">=</span>
              <span className="token-val" style={{ color: 'var(--accent-purple)' }}>{hoverDetail.valI}</span>
              <span className="token-op">−</span>
              <span className="token-var">B</span>
              <span className="token-op">=</span>
              <span className="token-val" style={{ color: '#F59E0B' }}>{hoverDetail.valB}</span>
              <span className="token-op">➔</span>
              <span className="token-var">D</span>
              <span className="token-op">=</span>
              <span className="token-sub">|{hoverDetail.valI} − {hoverDetail.valB}| = <strong>{hoverDetail.valD}</strong></span>
              <span className="token-op">|</span>
              <span className="token-op">Check:</span>
              <span className="token-val" style={{ color: hoverDetail.isFg ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                {hoverDetail.valD} {hoverDetail.isFg ? '>' : '≤'} T({threshold})
              </span>
              <span className="token-op">➔</span>
              <span className={`token-badge-status ${hoverDetail.isFg ? 'status-fg' : 'status-bg'}`}>
                {hoverDetail.isFg ? 'Mask M = 1 (FOREGROUND OBJECT ✅)' : 'Mask M = 0 (BACKGROUND FILTERED ❌)'}
              </span>
            </div>
          </div>
        ) : (
          <div className="formula-inspector-content idle">
            <Sparkles size={14} className="sparkle-idle-icon" />
            <span>
              <strong>Threshold Logic:</strong> D(x, y) = |I(x, y) − B(x, y)|. If D &gt; {threshold}, M(x, y) = 1 (Foreground). Otherwise M(x, y) = 0 (Background). Hover any cell to inspect!
            </span>
          </div>
        )}

        {/* Real-world Noise Insight Tag */}
        {noiseLevel > 0 && (
          <div className="noise-active-badge" title="Small background differences caused by camera sensor noise or ambient light">
            <AlertCircle size={13} />
            <span>Noise Active: Unchanged BG has small delta (2–{noiseLevel})</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          THE 4-COLUMN HORIZONTAL LINE PIPELINE:
          IMAGE WITH OBJECT (I)  ➖  BACKGROUND (B)  🟰  DIFFERENCE (D)  ➔  MASK (M)
          All placed side-by-side in ONE horizontal line so changes are visible instantly!
         ========================================================================= */}
      <div className="subtraction-horizontal-line-container">
        
        {/* COLUMN 1: SCENE WITH OBJECT (I) */}
        <div className="addition-column-card card-scene-i">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-i">I</span>
              <div>
                <h3 className="addition-card-title">Scene with Object</h3>
                <span className="addition-card-subtitle">Editable Image I (0–255)</span>
              </div>
            </div>
            <div className="col-header-right">
              <span className="matrix-dims">4 × 4</span>
            </div>
          </div>

          <div className="addition-card-body">
            <div className="canvas-subrow">
              <PipelineCanvas
                matrix={matrixI}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={24}
                highlightColor="var(--accent-purple)"
                title="Scene with Object (I)"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label">Scene Matrix I</span>
                <span className="subrow-hint">Object placed inside background</span>
                <div className="subrow-actions">
                  <span className="badge-tag-mini">Editable</span>
                </div>
              </div>
            </div>

            {/* Editable 4x4 Grid */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixI[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixI.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    return (
                      <div
                        key={`i-${i}-${j}`}
                        className={`matrix-cell editable-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--cell-accent': 'var(--accent-purple)',
                          borderColor: isHovered ? 'var(--accent-purple)' : undefined,
                          background: `linear-gradient(135deg, rgba(${val},${val},${val},0.16) 0%, var(--bg-secondary) 100%)`
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onWheel={(e) => {
                          e.preventDefault();
                          const delta = e.deltaY < 0 ? 5 : -5;
                          handleCellChangeI(i, j, Math.min(255, Math.max(0, val + delta)));
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
                              handleCellChangeI(i, j, valid);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                                e.preventDefault();
                                handleCellChangeI(i, j, Math.min(255, val + 5));
                              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                                e.preventDefault();
                                handleCellChangeI(i, j, Math.max(0, val - 5));
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
                                handleCellChangeI(i, j, Math.min(255, val + 10));
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
                                handleCellChangeI(i, j, Math.max(0, val - 10));
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

        {/* OPERATOR 1: ➖ */}
        <div className="addition-operator-divider">
          <div className="operator-badge minus-badge" title="Matrix Subtraction: [I - B]">
            <Minus size={20} strokeWidth={2.8} />
          </div>
          <span className="operator-label">Subtract</span>
        </div>

        {/* COLUMN 2: EMPTY BACKGROUND (B) */}
        <div className="addition-column-card card-bg-b">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-b">B</span>
              <div>
                <h3 className="addition-card-title">Empty Background</h3>
                <span className="addition-card-subtitle">
                  {noiseLevel > 0 ? `Matrix B (±${noiseLevel} noise)` : 'Editable Background B'}
                </span>
              </div>
            </div>
            <div className="col-header-right">
              <span className="matrix-dims" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)' }}>
                4 × 4
              </span>
            </div>
          </div>

          <div className="addition-card-body">
            <div className="canvas-subrow">
              <PipelineCanvas
                matrix={noisyMatrixB}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={24}
                highlightColor="#F59E0B"
                title="Empty Background (B)"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label">Background Matrix B</span>
                <span className="subrow-hint">Scene without the object</span>
                <div className="subrow-actions">
                  <span className="badge-tag-mini" style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                    Reference
                  </span>
                </div>
              </div>
            </div>

            {/* Editable 4x4 Grid */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${noisyMatrixB[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {noisyMatrixB.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    return (
                      <div
                        key={`b-${i}-${j}`}
                        className={`matrix-cell editable-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--cell-accent': '#F59E0B',
                          borderColor: isHovered ? '#F59E0B' : undefined,
                          background: `linear-gradient(135deg, rgba(${val},${val},${val},0.16) 0%, var(--bg-secondary) 100%)`
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

        {/* OPERATOR 2: 🟰 */}
        <div className="addition-operator-divider">
          <div className="operator-badge equals-badge" title="Difference Matrix D = |I - B|">
            <Equal size={20} strokeWidth={2.8} />
          </div>
          <span className="operator-label">Difference</span>
        </div>

        {/* COLUMN 3: DIFFERENCE MATRIX (D) */}
        <div className="addition-column-card card-diff-d">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-d">D</span>
              <div>
                <h3 className="addition-card-title">Difference Matrix D</h3>
                <span className="addition-card-subtitle" style={{ color: 'var(--accent-cyan)' }}>
                  D = |I − B|
                </span>
              </div>
            </div>
            <div className="col-header-right">
              <span className="matrix-dims" style={{ borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.12)' }}>
                4 × 4
              </span>
            </div>
          </div>

          <div className="addition-card-body">
            <div className="canvas-subrow">
              <PipelineCanvas
                matrix={matrixD}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={24}
                highlightColor="var(--accent-cyan)"
                title="Difference Matrix Heatmap (D)"
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label">Delta Intensity</span>
                <span className="subrow-hint">Object: large delta. BG: ~0 delta</span>
                <div className="subrow-actions">
                  <span className="badge-tag-mini" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                    Live |I - B|
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only 4x4 Grid for D */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixD[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixD.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    const exceedsT = val > threshold;
                    return (
                      <div
                        key={`d-${i}-${j}`}
                        className={`matrix-cell result-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--cell-accent': 'var(--accent-cyan)',
                          borderColor: isHovered ? 'var(--accent-cyan)' : undefined,
                          background: exceedsT 
                            ? `linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, var(--bg-secondary) 100%)`
                            : `linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, var(--bg-secondary) 100%)`
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                      >
                        <span 
                          className="matrix-cell-val compact-val" 
                          style={{ 
                            color: exceedsT ? '#38BDF8' : 'var(--text-muted)',
                            fontWeight: exceedsT ? '800' : '600'
                          }}
                        >
                          {val}
                        </span>
                        {exceedsT && (
                          <span className="delta-fg-indicator" title={`Delta ${val} > T (${threshold})`}>
                            &gt;T
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

        {/* OPERATOR 3: ➔ THRESHOLD T */}
        <div className="addition-operator-divider">
          <div className="operator-badge filter-badge" title={`Threshold Test: D(x, y) > ${threshold}`}>
            <Filter size={18} strokeWidth={2.6} />
          </div>
          <span className="operator-label">&gt; T({threshold})</span>
        </div>

        {/* COLUMN 4: BINARY MASK (M) & EXTRACTED OBJECT */}
        <div className="addition-column-card card-mask-m">
          <div className="addition-column-header">
            <div className="col-header-left">
              <span className="matrix-title-badge badge-m">M</span>
              <div>
                <h3 className="addition-card-title">Binary Mask M</h3>
                <span className="addition-card-subtitle" style={{ color: 'var(--accent-emerald)' }}>
                  1: Foreground, 0: Background
                </span>
              </div>
            </div>
            <div className="col-header-right">
              <span className="matrix-dims">4 × 4</span>
            </div>
          </div>

          <div className="addition-card-body">
            {/* Toggle View: Mask vs Extracted (Contained inside outer card box) */}
            <div className="mask-view-toggle-bar">
              <button
                type="button"
                className={`mask-toggle-pill ${outputView === 'mask' ? 'active' : ''}`}
                onClick={() => setOutputView('mask')}
                title="View Binary Mask M(x, y)"
              >
                <Eye size={12} />
                <span>Mask (M)</span>
              </button>
              <button
                type="button"
                className={`mask-toggle-pill ${outputView === 'segmented' ? 'active' : ''}`}
                onClick={() => setOutputView('segmented')}
                title="View Extracted Object (I * M)"
              >
                <Scissors size={12} />
                <span>Extracted</span>
              </button>
            </div>
            <div className="canvas-subrow">
              <PipelineCanvas
                matrix={matrixM}
                isMask={outputView === 'mask'}
                extractedImage={outputView === 'segmented' ? extractedObject : null}
                hoveredCell={hoveredCell}
                onHoverCell={setHoveredCell}
                pixelSize={24}
                highlightColor="var(--accent-emerald)"
                title={outputView === 'mask' ? 'Binary Mask M' : 'Segmented Foreground Object'}
              />
              <div className="canvas-subrow-info">
                <span className="subrow-label" style={{ color: 'var(--text-primary)' }}>
                  {outputView === 'mask' ? 'Isolated Object Mask' : 'Clean Segmented Object'}
                </span>
                <span className="subrow-hint">
                  {stats.fgCount} FG pixel{stats.fgCount !== 1 ? 's' : ''}, {stats.bgCount} BG pixel{stats.bgCount !== 1 ? 's' : ''}
                </span>
                <div className="subrow-actions">
                  <span className="status-live-indicator">
                    <span className="pulse-dot"></span> Segmented
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only 4x4 Grid for Mask M */}
            <div className="matrix-bracket-container compact-bracket">
              <div 
                className="matrix-grid compact-grid"
                style={{ gridTemplateColumns: `repeat(${matrixM[0].length}, 1fr)` }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {matrixM.map((row, i) =>
                  row.map((val, j) => {
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    const isFg = val === 1;

                    return (
                      <div
                        key={`m-${i}-${j}`}
                        className={`matrix-cell result-cell compact-cell ${isHovered ? 'hovered' : ''} ${isFg ? 'mask-fg-cell' : 'mask-bg-cell'}`}
                        style={{
                          '--cell-accent': 'var(--accent-emerald)',
                          borderColor: isHovered ? 'var(--accent-emerald)' : undefined
                        }}
                        onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                      >
                        <span 
                          className="matrix-cell-val compact-val" 
                          style={{ 
                            color: isFg ? '#10B981' : 'var(--text-muted)',
                            fontWeight: '800'
                          }}
                        >
                          {val}
                        </span>
                        <span className="mask-sub-tag">
                          {isFg ? 'FG' : 'BG'}
                        </span>
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
        const tooltipWidth = 340;
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
            <span>I: <strong style={{ color: 'var(--accent-purple)' }}>{matrixI[hoveredCell.row][hoveredCell.col]}</strong></span>
            <span style={{ opacity: 0.3 }}>−</span>
            <span>B: <strong style={{ color: '#F59E0B' }}>{noisyMatrixB[hoveredCell.row][hoveredCell.col]}</strong></span>
            <span style={{ opacity: 0.3 }}>=</span>
            <span>D: <strong style={{ color: 'var(--accent-cyan)' }}>{matrixD[hoveredCell.row][hoveredCell.col]}</strong></span>
            <span style={{ opacity: 0.3 }}>➔</span>
            <span>M: <strong style={{ color: matrixM[hoveredCell.row][hoveredCell.col] === 1 ? '#10B981' : '#64748B' }}>
              {matrixM[hoveredCell.row][hoveredCell.col]} ({matrixM[hoveredCell.row][hoveredCell.col] === 1 ? 'FG' : 'BG'})
            </strong></span>
          </div>
        );
      })()}
    </motion.div>
  );
}
