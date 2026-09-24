import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  Blend, 
  Scissors, 
  Scan, 
  Eye, 
  Sliders, 
  AlertCircle,
  Camera,
  Upload,
  Layers,
  ArrowRight,
  Plus,
  Minus,
  Equal,
  HelpCircle,
  Video,
  VideoOff,
  Image as ImageIcon,
  CheckCircle2,
  Activity,
  Maximize2,
  Undo2,
  ZoomIn,
  Zap,
  Info
} from 'lucide-react';
import { clampPixel, createEmptyMatrix, invertMatrix } from '../core/mathEngine';

// Presets representing diverse imagery for inversion
const INVERSION_PRESETS = {
  handSkeleton: {
    id: 'handSkeleton',
    name: 'Hand Radiograph',
    category: 'Anatomy Silhouette',
    desc: 'Simulated silhouette of human hand with dense bone structure on dark tissue background',
    // Original Grayscale Matrix A: Dark background (20-30), skin tissue (90-110), dense bone (220-245)
    matrixA: [
      [25,  25,  25,  25],
      [25, 235, 235,  25],
      [25, 235, 235,  25],
      [25, 110, 110,  25]
    ],
    // High-resolution rendering data for the original canvas
    renderType: 'hand'
  },
  botanicalLeaf: {
    id: 'botanicalLeaf',
    name: 'Botanical Leaf',
    category: 'Nature',
    desc: 'Intricate leaf structure with dark veins and luminous blade edges',
    matrixA: [
      [35,  180, 180,  35],
      [180,  45,  45, 180],
      [180,  45,  45, 180],
      [35,  180, 180,  35]
    ],
    renderType: 'leaf'
  },
  mechanicalGear: {
    id: 'mechanicalGear',
    name: 'Mechanical Gear',
    category: 'Engineering',
    desc: 'Machine cog with dark metallic core and polished teeth',
    matrixA: [
      [220,  50,  50, 220],
      [50,  240, 240,  50],
      [50,  240, 240,  50],
      [220,  50,  50, 220]
    ],
    renderType: 'gear'
  },
  contrastSteps: {
    id: 'contrastSteps',
    name: 'Numerical Gradient',
    category: 'Mathematical Steps',
    desc: 'Pure mathematical step values showing explicit 0 ➔ 255 and 255 ➔ 0 arithmetic flips',
    matrixA: [
      [0,    50, 100, 128],
      [150, 180, 210, 255],
      [255, 210, 180, 150],
      [128, 100,  50,   0]
    ],
    renderType: 'gradient'
  }
};

/**
 * Compact Pipeline Canvas Component
 */
function PipelineCanvas({
  matrix,
  hoveredCell,
  onHoverCell,
  pixelSize = 24,
  highlightColor = 'var(--accent-purple)',
  title,
  themeMode = 'grayscale', // 'colorOriginal', 'grayscale', 'inverted', 'xrayCool'
  renderType = 'gradient'
}) {
  const canvasRef = useRef(null);
  const rows = matrix.length;
  const cols = matrix[0].length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = cols * pixelSize;
    const height = rows * pixelSize;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];

        if (themeMode === 'colorOriginal') {
          // Color rendering representation
          if (renderType === 'hand') {
            // Flesh / warm amber tone
            ctx.fillStyle = `rgb(${Math.min(255, val + 40)}, ${Math.max(0, val - 10)}, ${Math.max(0, val - 30)})`;
          } else if (renderType === 'leaf') {
            // Green botanical tone
            ctx.fillStyle = `rgb(${Math.max(0, val - 40)}, ${Math.min(255, val + 35)}, ${Math.max(0, val - 30)})`;
          } else if (renderType === 'gear') {
            // Metallic brass/gold
            ctx.fillStyle = `rgb(${Math.min(255, val + 30)}, ${Math.min(255, val + 15)}, ${Math.max(0, val - 40)})`;
          } else {
            // Rainbow gradient
            const hue = (val / 255) * 260;
            ctx.fillStyle = `hsl(${hue}, 75%, ${Math.max(15, Math.min(85, val / 3))}%)`;
          }
        } else if (themeMode === 'xrayCool') {
          // Radiographic cyan/cool blue glow
          // Dense regions (high value in inverted) glow cyan-white, dark regions deep navy
          const blueVal = Math.min(255, Math.round(val * 1.15));
          const cyanVal = Math.min(255, Math.round(val * 1.05));
          const redVal = Math.round(val * 0.7);
          ctx.fillStyle = `rgb(${redVal}, ${cyanVal}, ${blueVal})`;
        } else {
          // Standard grayscale
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        }

        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Grid border lines
        ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * pixelSize + 0.5, r * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);

        // Highlight hovered cell
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
  }, [matrix, hoveredCell, rows, cols, pixelSize, highlightColor, themeMode, renderType]);

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
        className={`compact-pixel-canvas ${themeMode === 'xrayCool' ? 'radiograph-canvas-cool' : ''}`}
        onMouseMove={handleMouseMove}
        onClick={handleMouseMove}
        title={title}
      />
    </div>
  );
}

export default function Step11ImageInversionXRay({ onSelectStep }) {
  // Active Tab: 'matrix' (4x4 pipeline) or 'photoLab' (upload/camera)
  const [activeTab, setActiveTab] = useState('matrix');

  // Selected Preset
  const [currentPresetKey, setCurrentPresetKey] = useState('handSkeleton');

  // Matrix A (Grayscale Intensity)
  const [matrixA, setMatrixA] = useState(INVERSION_PRESETS.handSkeleton.matrixA);

  // Inversion factor k in [0, 1] (Default 1.0 = Full 255 - A inversion)
  const [inversionFactor, setInversionFactor] = useState(1.0);

  // X-ray Visual Effect Style in Stage 4: 'xrayCool' (Medical Cyan Glow) or 'classicNegative' (Monochrome)
  const [xrayColorMode, setXrayColorMode] = useState('xrayCool');

  // Synchronized hovered cell
  const [hoveredCell, setHoveredCell] = useState(null);

  // -------------------------------------------------------------
  // Custom Photo Lab State
  // -------------------------------------------------------------
  const [customPhotoUrl, setCustomPhotoUrl] = useState(null);
  const [photoResolution, setPhotoResolution] = useState(8);
  const [customMatrixA, setCustomMatrixA] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Inverted Matrix A' = 255 - A (weighted by inversionFactor)
  const matrixInverted = useMemo(() => {
    return invertMatrix(matrixA, inversionFactor);
  }, [matrixA, inversionFactor]);

  // Matrix editing handlers
  const handleCellChangeA = (r, c, val) => {
    const next = matrixA.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixA(next);
  };

  // Preset Selection
  const handleSelectPreset = (key) => {
    setCurrentPresetKey(key);
    const p = INVERSION_PRESETS[key];
    setMatrixA(p.matrixA.map(row => [...row]));
    setInversionFactor(1.0);
  };

  // Reset to default preset values
  const handleReset = () => {
    handleSelectPreset(currentPresetKey);
    setInversionFactor(1.0);
  };

  // Randomize values
  const handleRandomize = () => {
    const rows = matrixA.length;
    const cols = matrixA[0].length;
    const rand = createEmptyMatrix(rows, cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rand[r][c] = Math.round(Math.random() * 255);
      }
    }
    setMatrixA(rand);
  };

  // Hovered Cell Info
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const origVal = matrixA[row]?.[col] ?? 0;
    const invertedVal = matrixInverted[row]?.[col] ?? (255 - origVal);
    const mathDiff = 255 - origVal;

    let commentary = '';
    if (origVal < 50) {
      commentary = `Dark Shadow (${origVal}) flips to Luminous Highlight (${invertedVal})`;
    } else if (origVal > 200) {
      commentary = `Bright Highlight (${origVal}) flips to Deep Black (${invertedVal})`;
    } else if (Math.abs(origVal - 128) <= 15) {
      commentary = `Midpoint Gray (${origVal}) flips to (~${invertedVal}) — near the invariant center!`;
    } else {
      commentary = `Midtone (${origVal}) symmetrically mirrors across 127.5 to (${invertedVal})`;
    }

    return { row, col, origVal, invertedVal, mathDiff, commentary };
  }, [hoveredCell, matrixA, matrixInverted]);

  // -----------------------------------------------------------------
  // Custom Photo Processing
  // -----------------------------------------------------------------
  const processImageToGrayscaleMatrix = (imgSrc, size) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        const mat = [];
        for (let r = 0; r < size; r++) {
          const row = [];
          for (let c = 0; c < size; c++) {
            const idx = (r * size + c) * 4;
            const gray = clampPixel(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
            row.push(gray);
          }
          mat.push(row);
        }
        resolve(mat);
      };
      img.src = imgSrc;
    });
  };

  // Upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      setCustomPhotoUrl(dataUrl);
      const mat = await processImageToGrayscaleMatrix(dataUrl, photoResolution);
      setCustomMatrixA(mat);
    };
    reader.readAsDataURL(file);
  };

  // Camera capture
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      setCameraError('Camera access denied or unavailable. You can still upload images from your device!');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const snapCameraPhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 180, 180);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCustomPhotoUrl(dataUrl);
    const mat = await processImageToGrayscaleMatrix(dataUrl, photoResolution);
    setCustomMatrixA(mat);
    stopCamera();
  };

  // Procedural demo photo loader
  const loadDemoPhoto = async (type) => {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    if (type === 'hand') {
      // Dark radiograph background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 180, 180);

      // Palm & fingers silhouette
      ctx.fillStyle = '#9CA3AF';
      ctx.beginPath();
      ctx.ellipse(90, 115, 45, 50, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fingers
      const fingerPositions = [55, 78, 102, 125];
      fingerPositions.forEach(fx => {
        ctx.beginPath();
        ctx.roundRect(fx - 9, 30, 18, 70, 9);
        ctx.fill();
      });

      // Dense bone highlights (white)
      ctx.fillStyle = '#FFFFFF';
      fingerPositions.forEach(fx => {
        ctx.beginPath();
        ctx.roundRect(fx - 4, 38, 8, 55, 4);
        ctx.fill();
      });
    } else {
      // Botanical leaf
      ctx.fillStyle = '#064E3B';
      ctx.fillRect(0, 0, 180, 180);
      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.ellipse(90, 90, 35, 70, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.strokeStyle = '#065F46';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(70, 150);
      ctx.lineTo(110, 30);
      ctx.stroke();
    }

    const dataUrl = canvas.toDataURL('image/png');
    setCustomPhotoUrl(dataUrl);
    const mat = await processImageToGrayscaleMatrix(dataUrl, photoResolution);
    setCustomMatrixA(mat);
  };

  // Re-process custom matrix when resolution changes
  useEffect(() => {
    if (customPhotoUrl) {
      processImageToGrayscaleMatrix(customPhotoUrl, photoResolution).then(setCustomMatrixA);
    }
  }, [photoResolution]);

  // Custom photo inverted matrix
  const customMatrixInverted = useMemo(() => {
    if (!customMatrixA) return null;
    return invertMatrix(customMatrixA, 1.0);
  }, [customMatrixA]);

  return (
    <motion.div 
      className="step-module subtraction-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* STEP HEADER */}
      <div className="step-header-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span className="modal-badge-tag" style={{ margin: 0, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.35)' }}>
              Chapter 8.4
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Point Transformations: A′ = 255 − A
            </span>
          </div>

          {/* Sub-Chapter Switcher with all 4 chapters */}
          <div className="sub-chapter-nav">
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(8) : (window.location.hash = '#step8')}
              title="8.1 Matrix Addition (Image Blending)"
            >
              <Blend size={13} />
              <span>8.1 Blend</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(9) : (window.location.hash = '#step9')}
              title="8.2 Matrix Subtraction (Background Removal)"
            >
              <Scissors size={13} />
              <span>8.2 Remove BG</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(10) : (window.location.hash = '#step10')}
              title="8.3 Matrix Subtraction (Find What Changed)"
            >
              <Scan size={13} />
              <span>8.3 What Changed</span>
            </button>
            <button 
              className="sub-chapter-pill active"
              title="Current: 8.4 Image Inversion & X-Ray Effect"
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

        <h2 className="step-heading">8.4 Image Inversion: The X-ray-like Effect</h2>
        <p className="step-description">
          Convert an image into a grayscale intensity matrix <strong>A</strong>, then reverse its pixel intensities: <code>A′ = 255 − A</code>. Consequently, <strong>0 → 255</strong> and <strong>255 → 0</strong>. Dark regions become bright and bright regions become dark, producing a familiar negative / X-ray-like visual appearance. Inspect individual pixels before and after to observe how a single subtraction transforms the entire image!
        </p>

        {/* SCIENTIFIC / MEDICAL DISCLAIMER */}
        <div className="xray-disclaimer-card">
          <div className="xray-disclaimer-header">
            <Info size={17} />
            <span>Scientific & Medical Clarification: X-Ray-like Visual Effect</span>
          </div>
          <p className="xray-disclaimer-text">
            This digital negative is an <strong>X-ray-like visual effect</strong> generated through element-by-element matrix inversion (<code>A′ = 255 − A</code>), <strong>not an authentic clinical X-ray</strong>. Genuine medical radiography shoots penetrating electromagnetic photons through anatomical matter, where high-density materials (such as calcium in bone) absorb more radiation than softer muscle tissue to cast anatomical density shadows.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
          <button
            className={`preset-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 1rem' }}
          >
            <Sliders size={15} />
            <span>4-Stage Comparison Pipeline (4×4 Grid)</span>
          </button>
          <button
            className={`preset-btn ${activeTab === 'photoLab' ? 'active' : ''}`}
            onClick={() => setActiveTab('photoLab')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 1rem' }}
          >
            <Camera size={15} />
            <span>Photo Inversion Laboratory (Upload / Camera)</span>
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* TOP CONTROLS CARD */}
          <div className="top-control-card subtraction-controls-card">
            <div className="subtraction-controls-grid">
              
              {/* Part 1: Inversion Transition Slider */}
              <div className="slider-group" style={{ marginBottom: 0 }}>
                <div className="slider-label" style={{ marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sliders size={16} color="var(--accent-cyan)" />
                    <span>Inversion Blend Factor (k):</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontSize: '1.25rem', fontWeight: '800' }}>
                      {(inversionFactor * 100).toFixed(0)}%
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {inversionFactor === 1.0 ? '(Full A′ = 255 − A)' : inversionFactor === 0.0 ? '(Original A)' : '(Partial Flip)'}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  className="slider-input"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={inversionFactor}
                  onChange={(e) => setInversionFactor(parseFloat(e.target.value))}
                  onInput={(e) => setInversionFactor(parseFloat(e.target.value))}
                  style={{ 
                    '--slider-pct': `${inversionFactor * 100}%`, 
                    '--slider-color': 'var(--accent-cyan)' 
                  }}
                />

                {/* Quick Presets for Inversion Factor */}
                <div className="alpha-presets-row">
                  <button 
                    className={`mini-preset-pill ${inversionFactor === 0.0 ? 'active' : ''}`}
                    onClick={() => setInversionFactor(0.0)}
                    title="0% (Unchanged Original)"
                  >
                    0% (Original)
                  </button>
                  <button 
                    className={`mini-preset-pill ${inversionFactor === 0.5 ? 'active' : ''}`}
                    onClick={() => setInversionFactor(0.5)}
                    title="50% (Midway Flat Gray Point)"
                  >
                    50% (Neutral 128)
                  </button>
                  <button 
                    className={`mini-preset-pill ${inversionFactor === 1.0 ? 'active' : ''}`}
                    onClick={() => setInversionFactor(1.0)}
                    title="100% (Complete Negative / X-Ray)"
                  >
                    100% (Full Invert)
                  </button>
                </div>
              </div>

              {/* Part 2: Presets & X-Ray Radiograph View Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div className="control-row-group">
                  <span className="control-row-label">
                    Subject Presets:
                  </span>
                  <div className="addition-presets-strip" style={{ flexWrap: 'wrap' }}>
                    {Object.entries(INVERSION_PRESETS).map(([key, data]) => (
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
                </div>

                {/* X-Ray Radiographic Styling */}
                <div className="control-row-group" style={{ alignItems: 'center' }}>
                  <span className="control-row-label">Effect Tint:</span>
                  <div className="noise-pill-group">
                    <button
                      className={`noise-btn ${xrayColorMode === 'xrayCool' ? 'active' : ''}`}
                      onClick={() => setXrayColorMode('xrayCool')}
                      title="Medical Cyan/Blue Radiographic Illuminator"
                      style={{ color: xrayColorMode === 'xrayCool' ? 'var(--accent-cyan)' : undefined }}
                    >
                      Cyan Radiograph
                    </button>
                    <button
                      className={`noise-btn ${xrayColorMode === 'classicNegative' ? 'active' : ''}`}
                      onClick={() => setXrayColorMode('classicNegative')}
                      title="Monochrome Photographic Film Negative"
                    >
                      B&W Film Negative
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Reset & Random */}
                <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.15rem' }}>
                  <button
                    className="preset-btn mini-btn"
                    onClick={handleRandomize}
                    title="Generate Random Intensity Matrix"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Shuffle size={12} />
                    <span>Random Matrix</span>
                  </button>
                  <button
                    className="preset-btn mini-btn"
                    onClick={handleReset}
                    title="Reset to default preset values"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4-STAGE PIPELINE: Original → Grayscale → Invert Pixel Values → X-ray-like Effect */}
          <div className="addition-pipeline-row">
            
            {/* STAGE 1: ORIGINAL IMAGE */}
            <div className="addition-column-card" style={{ borderColor: 'rgba(168, 85, 247, 0.35)' }}>
              <div className="addition-column-header">
                <div className="col-header-left">
                  <span className="matrix-title-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
                    1
                  </span>
                  <div>
                    <h3 className="addition-card-title">Original Image</h3>
                    <span className="addition-card-subtitle" style={{ color: '#A855F7' }}>
                      Color / Physical Scene
                    </span>
                  </div>
                </div>
                <div className="col-header-right">
                  <span className="matrix-dims">Scene</span>
                </div>
              </div>

              <div className="addition-card-body">
                <div className="canvas-subrow">
                  <PipelineCanvas
                    matrix={matrixA}
                    hoveredCell={hoveredCell}
                    onHoverCell={setHoveredCell}
                    pixelSize={24}
                    highlightColor="#A855F7"
                    themeMode="colorOriginal"
                    renderType={INVERSION_PRESETS[currentPresetKey]?.renderType || 'gradient'}
                    title="Original Scene Representation"
                  />
                  <div className="canvas-subrow-info">
                    <span className="subrow-label">Visual Subject</span>
                    <span className="subrow-hint">{INVERSION_PRESETS[currentPresetKey]?.category}</span>
                    <div className="subrow-actions">
                      <span className="badge-tag-mini" style={{ color: '#A855F7', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                        Source Image
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info swatch */}
                <div style={{ padding: '0.65rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Natural scene containing optical light reflections before digital intensity quantization.
                </div>
              </div>
            </div>

            {/* OPERATOR 1: ➔ CONVERT TO GRAYSCALE */}
            <div className="addition-operator-divider">
              <div className="operator-badge filter-badge" title="Quantize RGB photons to Luminance A">
                <ArrowRight size={18} strokeWidth={2.6} />
              </div>
              <span className="operator-label">Grayscale</span>
            </div>

            {/* STAGE 2: GRAYSCALE INTENSITY MATRIX (A) */}
            <div className="addition-column-card card-mat-a">
              <div className="addition-column-header">
                <div className="col-header-left">
                  <span className="matrix-title-badge badge-a">A</span>
                  <div>
                    <h3 className="addition-card-title">Grayscale Matrix (A)</h3>
                    <span className="addition-card-subtitle">Intensities: [0 = Black, 255 = White]</span>
                  </div>
                </div>
                <div className="col-header-right">
                  <span className="matrix-dims">4 × 4</span>
                </div>
              </div>

              <div className="addition-card-body">
                <div className="canvas-subrow">
                  <PipelineCanvas
                    matrix={matrixA}
                    hoveredCell={hoveredCell}
                    onHoverCell={setHoveredCell}
                    pixelSize={24}
                    highlightColor="var(--accent-purple)"
                    themeMode="grayscale"
                    title="Grayscale Intensity Matrix A"
                  />
                  <div className="canvas-subrow-info">
                    <span className="subrow-label">Matrix A</span>
                    <span className="subrow-hint">Original luminance values</span>
                    <div className="subrow-actions">
                      <span className="badge-tag-mini">Editable</span>
                    </div>
                  </div>
                </div>

                {/* 4x4 Grid for Matrix A */}
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
                              background: `linear-gradient(135deg, rgba(${val},${val},${val},0.18) 0%, var(--bg-secondary) 100%)`
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

            {/* OPERATOR 2: 🟰 255 - A */}
            <div className="addition-operator-divider">
              <div className="operator-badge minus-badge" title="Reverse pixel intensities: A′ = 255 − A">
                <Minus size={18} strokeWidth={2.8} />
              </div>
              <span className="operator-label">255 − A</span>
            </div>

            {/* STAGE 3: INVERT PIXEL VALUES MATRIX (A′ = 255 − A) */}
            <div className="addition-column-card card-diff-d">
              <div className="addition-column-header">
                <div className="col-header-left">
                  <span className="matrix-title-badge badge-d" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.35)' }}>
                    A′
                  </span>
                  <div>
                    <h3 className="addition-card-title">Invert Pixel Values</h3>
                    <span className="addition-card-subtitle" style={{ color: 'var(--accent-cyan)' }}>
                      A′ = 255 − A
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
                    matrix={matrixInverted}
                    hoveredCell={hoveredCell}
                    onHoverCell={setHoveredCell}
                    pixelSize={24}
                    highlightColor="var(--accent-cyan)"
                    themeMode="grayscale"
                    title="Inverted Pixel Matrix A′"
                  />
                  <div className="canvas-subrow-info">
                    <span className="subrow-label">Reversed Intensity</span>
                    <span className="subrow-hint">0 ➔ 255 &amp; 255 ➔ 0</span>
                    <div className="subrow-actions">
                      <span className="badge-tag-mini" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                        Live 255 − A
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4x4 Grid for Inverted Matrix */}
                <div className="matrix-bracket-container compact-bracket">
                  <div 
                    className="matrix-grid compact-grid"
                    style={{ gridTemplateColumns: `repeat(${matrixInverted[0].length}, 1fr)` }}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {matrixInverted.map((row, i) =>
                      row.map((val, j) => {
                        const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                        return (
                          <div
                            key={`inv-${i}-${j}`}
                            className={`matrix-cell result-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                            style={{
                              '--cell-accent': 'var(--accent-cyan)',
                              borderColor: isHovered ? 'var(--accent-cyan)' : undefined,
                              background: `linear-gradient(135deg, rgba(${val},${val},${val},0.22) 0%, var(--bg-secondary) 100%)`
                            }}
                            onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                            onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                          >
                            <span 
                              className="matrix-cell-val compact-val" 
                              style={{ 
                                color: 'var(--accent-cyan)',
                                fontWeight: '700'
                              }}
                            >
                              {val}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* OPERATOR 3: ➔ X-RAY RENDERING */}
            <div className="addition-operator-divider">
              <div className="operator-badge filter-badge" style={{ borderColor: 'var(--accent-cyan)' }}>
                <Activity size={18} strokeWidth={2.6} color="var(--accent-cyan)" />
              </div>
              <span className="operator-label">Render</span>
            </div>

            {/* STAGE 4: X-RAY-LIKE VISUAL EFFECT */}
            <div className="addition-column-card" style={{ borderColor: 'rgba(6, 182, 212, 0.45)' }}>
              <div className="addition-column-header">
                <div className="col-header-left">
                  <span className="matrix-title-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
                    ★
                  </span>
                  <div>
                    <h3 className="addition-card-title">X-ray-like Effect</h3>
                    <span className="addition-card-subtitle" style={{ color: 'var(--accent-cyan)' }}>
                      Reversed Tonal Negative
                    </span>
                  </div>
                </div>
                <div className="col-header-right">
                  <span className="matrix-dims" style={{ borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.12)' }}>
                    Negative
                  </span>
                </div>
              </div>

              <div className="addition-card-body">
                <div className="canvas-subrow">
                  <PipelineCanvas
                    matrix={matrixInverted}
                    hoveredCell={hoveredCell}
                    onHoverCell={setHoveredCell}
                    pixelSize={24}
                    highlightColor="var(--accent-cyan)"
                    themeMode={xrayColorMode}
                    title="Radiographic Negative Visual Effect"
                  />
                  <div className="canvas-subrow-info">
                    <span className="subrow-label" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      {xrayColorMode === 'xrayCool' ? 'Cyan Radiograph' : 'Monochrome Film'}
                    </span>
                    <span className="subrow-hint">
                      Dark regions appear bright
                    </span>
                    <div className="subrow-actions">
                      <span className="status-live-indicator" style={{ color: 'var(--accent-cyan)' }}>
                        <span className="pulse-dot" style={{ background: 'var(--accent-cyan)' }}></span> Inverted Negative
                      </span>
                    </div>
                  </div>
                </div>

                {/* Educational Summary Card */}
                <div style={{ padding: '0.65rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Dense internal anatomy that was dark in the scene now shines like a radiographic film illuminator!
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE PIXEL INSPECTION & TRANSFER FUNCTION HUD */}
          <div className="hover-calculation-card" style={{ padding: '1rem 1.25rem' }}>
            {hoveredInfo ? (
              <div className="pixel-inspect-grid">
                
                {/* Visual Color Chips (Before & After Swatches) */}
                <div className="swatch-duo">
                  <div className="pixel-swatch-box">
                    <div 
                      className="pixel-color-chip" 
                      style={{ background: `rgb(${hoveredInfo.origVal}, ${hoveredInfo.origVal}, ${hoveredInfo.origVal})` }}
                      title={`Original Intensity: ${hoveredInfo.origVal}`}
                    />
                    <span className="pixel-swatch-label">Orig: {hoveredInfo.origVal}</span>
                  </div>

                  <ArrowRight size={16} color="var(--accent-cyan)" />

                  <div className="pixel-swatch-box">
                    <div 
                      className="pixel-color-chip" 
                      style={{ 
                        background: xrayColorMode === 'xrayCool'
                          ? `rgb(${Math.round(hoveredInfo.invertedVal * 0.7)}, ${Math.min(255, Math.round(hoveredInfo.invertedVal * 1.05))}, ${Math.min(255, Math.round(hoveredInfo.invertedVal * 1.15))})`
                          : `rgb(${hoveredInfo.invertedVal}, ${hoveredInfo.invertedVal}, ${hoveredInfo.invertedVal})`
                      }}
                      title={`Inverted Intensity: ${hoveredInfo.invertedVal}`}
                    />
                    <span className="pixel-swatch-label" style={{ color: 'var(--accent-cyan)' }}>Invert: {hoveredInfo.invertedVal}</span>
                  </div>
                </div>

                {/* Mathematical Formula Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Pixel ({hoveredInfo.row}, {hoveredInfo.col}):
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      255 − <span style={{ color: 'var(--accent-purple)' }}>{hoveredInfo.origVal}</span> = <span style={{ color: 'var(--accent-cyan)' }}>{hoveredInfo.invertedVal}</span>
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {hoveredInfo.commentary}
                  </span>
                </div>

                {/* SVG Transfer Function Curve */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <svg className="transfer-function-svg" width="60" height="60" viewBox="0 0 60 60">
                    {/* Diagonal line y = 255 - x */}
                    <line x1="8" y1="8" x2="52" y2="52" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="2,2" />
                    <line x1="8" y1="52" x2="52" y2="8" stroke="var(--accent-cyan)" strokeWidth="2.5" />
                    
                    {/* Active point on curve */}
                    {(() => {
                      const px = 8 + (hoveredInfo.origVal / 255) * 44;
                      const py = 52 - (hoveredInfo.invertedVal / 255) * 44;
                      return (
                        <circle cx={px} cy={py} r="4.5" fill="#38BDF8" stroke="#FFF" strokeWidth="1.5" />
                      );
                    })()}
                  </svg>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    f(x) = 255−x
                  </span>
                </div>
              </div>
            ) : (
              <div className="hover-calc-placeholder">
                <HelpCircle size={16} color="var(--accent-cyan)" />
                <span>Hover or scroll over any pixel cell above to inspect the individual before and after pixel inversion arithmetic</span>
              </div>
            )}
          </div>
        </>
      ) : (
        /* -------------------------------------------------------------
           CUSTOM PHOTO INVERSION LABORATORY
           ------------------------------------------------------------- */
        <div className="top-control-card" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={19} color="var(--accent-cyan)" />
                <span>Custom Photo Inversion: Generate X-Ray-like Negatives</span>
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Upload any photograph or snap a picture to see it convert into a grayscale matrix and invert to an X-ray-like negative!
              </p>
            </div>

            {/* Resolution Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Matrix Grid Resolution:</span>
              <div className="noise-pill-group">
                <button
                  className={`noise-btn ${photoResolution === 8 ? 'active' : ''}`}
                  onClick={() => setPhotoResolution(8)}
                  title="8x8 Matrix (64 cells)"
                >
                  8 × 8
                </button>
                <button
                  className={`noise-btn ${photoResolution === 16 ? 'active' : ''}`}
                  onClick={() => setPhotoResolution(16)}
                  title="16x16 Matrix (256 cells)"
                >
                  16 × 16
                </button>
              </div>
            </div>
          </div>

          {/* Quick Demo Test Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try Demo Subject:</span>
            <button
              className="preset-btn mini-btn"
              onClick={() => loadDemoPhoto('hand')}
              title="Hand Anatomy Silhouette"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>🦴 Hand Radiograph</span>
            </button>
            <button
              className="preset-btn mini-btn"
              onClick={() => loadDemoPhoto('leaf')}
              title="Botanical Leaf Veins"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>🌿 Botanical Leaf</span>
            </button>

            {/* Webcam / Upload Buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <button
                className="preset-btn mini-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Upload size={13} />
                <span>Upload Photo</span>
              </button>

              {!isCameraActive ? (
                <button
                  className="preset-btn mini-btn"
                  onClick={startCamera}
                  style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Video size={13} />
                  <span>Use Webcam</span>
                </button>
              ) : (
                <button
                  className="preset-btn mini-btn"
                  onClick={stopCamera}
                  style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <VideoOff size={13} />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* Camera Error banner if any */}
          {cameraError && (
            <div style={{ padding: '0.65rem 1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#EF4444', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={15} />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Active Webcam View */}
          {isCameraActive && (
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--accent-cyan)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative', width: '220px', height: '220px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--border-color)', background: '#000' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button
                className="mode-btn active"
                onClick={snapCameraPhoto}
                style={{ background: 'var(--accent-cyan)', color: '#000', fontWeight: 700, padding: '0.55rem 1.25rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Camera size={16} />
                <span>📸 Capture &amp; Invert Image</span>
              </button>
            </div>
          )}

          {/* RESULTS COMPARISON DISPLAY */}
          {customMatrixA && customMatrixInverted ? (
            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Image Inversion Pipeline: Original ➔ Grayscale Matrix A ➔ Invert (255 − A) ➔ X-ray Effect
                </span>
              </div>

              {/* 4 Canvases for Custom Photo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
                
                {/* 1. Original Uploaded Photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A855F7' }}>1. Original Photo</span>
                  <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={customPhotoUrl} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>➔</div>

                {/* 2. Grayscale Matrix A */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)' }}>2. Grayscale Matrix A</span>
                  <PipelineCanvas
                    matrix={customMatrixA}
                    pixelSize={photoResolution === 8 ? 15 : 7.5}
                    themeMode="grayscale"
                    highlightColor="var(--accent-purple)"
                    title="Grayscale Matrix A"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>➔ [255 − A] ➔</div>

                {/* 3. Inverted Matrix A' */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>3. Inverted Matrix A′</span>
                  <PipelineCanvas
                    matrix={customMatrixInverted}
                    pixelSize={photoResolution === 8 ? 15 : 7.5}
                    themeMode="grayscale"
                    highlightColor="var(--accent-cyan)"
                    title="Inverted Matrix A′"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>➔</div>

                {/* 4. X-ray Visual Effect */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>4. X-Ray-like Effect</span>
                  <PipelineCanvas
                    matrix={customMatrixInverted}
                    pixelSize={photoResolution === 8 ? 15 : 7.5}
                    themeMode="xrayCool"
                    highlightColor="var(--accent-cyan)"
                    title="X-ray-like Radiographic Visual Effect"
                  />
                </div>
              </div>

              {/* Notification Banner */}
              <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.15rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                      Pixel Inversion Complete: A′ = 255 − A
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      All {customMatrixA.length * customMatrixA[0].length} pixels inverted! Dark shadows are now luminous highlights and bright areas are deep absorption blacks.
                    </div>
                  </div>
                </div>
                <span style={{ padding: '0.3rem 0.75rem', background: 'var(--accent-cyan)', color: '#000', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                  X-Ray-like View
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Choose a demo subject above or upload a photo to generate an X-ray-like negative!
            </div>
          )}
        </div>
      )}

      {/* EDUCATIONAL THEORY ACCORDION */}
      <div className="explanation-accordion-card">
        <h3 className="explanation-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <span>Mathematical Foundations: Point Transformations &amp; Digital Negatives</span>
        </h3>
        
        <div className="math-concept-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.85rem' }}>
          
          <div className="math-concept-box">
            <h4 style={{ color: 'var(--accent-purple)', fontSize: '0.92rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>1. Linear Point Transformation: s = 255 − r</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Inversion is the simplest linear point transformation in image processing: <code>s = (L − 1) − r</code>, where <code>L = 256</code> intensity levels. The transformation maps the interval <code>[0, 255]</code> onto itself with a constant slope of <code>−1</code>, symmetrically reversing contrast.
            </p>
          </div>

          <div className="math-concept-box">
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.92rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>2. The Neutral Invariant Point (127.5)</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              At the exact midpoint <code>r = 127.5</code> (rounded to 127 or 128), <code>255 − 128 = 127</code>. Pixels at the middle of the tonal range barely change their intensity value, whereas extreme blacks (0) and extreme whites (255) undergo the maximum possible shift of 255 levels!
            </p>
          </div>

          <div className="math-concept-box">
            <h4 style={{ color: '#10B981', fontSize: '0.92rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>3. Digital Inversion vs. Medical Radiography</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              In real medicine, X-rays are high-energy electromagnetic waves. As X-rays pass through a patient, bones (rich in calcium) absorb more photons than soft flesh, casting a shadow onto film or a digital detector. Our screen effect is a mathematical negative that visualizes this visual reversal!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
