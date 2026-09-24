import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  Scissors, 
  Minus, 
  Equal, 
  Filter, 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  Blend, 
  Eye, 
  Sliders, 
  AlertCircle,
  Camera,
  Upload,
  Layers,
  ArrowRight,
  Move,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  HelpCircle,
  Video,
  VideoOff,
  Image as ImageIcon,
  Zap,
  Grid,
  Activity,
  Maximize2,
  Undo2,
  ZoomIn
} from 'lucide-react';
import { clampPixel, createEmptyMatrix, subtractMatrices, thresholdMatrix } from '../core/mathEngine';

// Presets representing 3 core scenarios: Added, Removed, Moved
const CHANGE_PRESETS = {
  objectAdded: {
    id: 'objectAdded',
    name: 'Object Added (+)',
    badge: 'Added',
    type: 'added',
    badgeColor: '#10B981',
    scenario: 'Coffee Mug Placed on Clean Desk',
    desc: 'Scene A shows a wooden tabletop. In Scene B, a coffee mug is placed in the center-right.',
    defaultT: 25,
    matrixA: [
      [75, 78, 72, 80],
      [72, 70, 75, 78],
      [76, 74, 72, 75],
      [78, 80, 76, 74]
    ],
    matrixB: [
      [75, 78,  72,  80],
      [72, 70, 235, 235],
      [76, 74, 235, 235],
      [78, 80,  76,  74]
    ]
  },
  objectRemoved: {
    id: 'objectRemoved',
    name: 'Object Removed (−)',
    badge: 'Removed',
    type: 'removed',
    badgeColor: '#EF4444',
    scenario: 'Keys Missing from Entry Table',
    desc: 'Scene A has a bright set of keys on the table. In Scene B, the keys were picked up and removed.',
    defaultT: 25,
    matrixA: [
      [55,  52,  56, 50],
      [52, 230, 230, 52],
      [56, 230, 230, 56],
      [50,  55,  52, 54]
    ],
    matrixB: [
      [55, 52, 56, 50],
      [52, 54, 52, 52],
      [56, 52, 55, 56],
      [50, 55, 52, 54]
    ]
  },
  objectMoved: {
    id: 'objectMoved',
    name: 'Object Moved (⇄)',
    badge: 'Motion / Moved',
    type: 'moved',
    badgeColor: '#38BDF8',
    scenario: 'Chess Pawn Shifted to New Square',
    desc: 'Scene A shows a white piece at Top-Left (0, 0). In Scene B, it moved to Bottom-Right (2, 2). Subtraction reveals two change hotspots!',
    defaultT: 30,
    matrixA: [
      [240, 240, 48, 48],
      [240, 240, 48, 48],
      [48,   48, 48, 48],
      [48,   48, 48, 48]
    ],
    matrixB: [
      [48, 48,  48,  48],
      [48, 48,  48,  48],
      [48, 48, 240, 240],
      [48, 48, 240, 240]
    ]
  },
  securityDoor: {
    id: 'securityDoor',
    name: 'Security Cam Intruder',
    badge: 'Surveillance',
    type: 'added',
    badgeColor: '#A855F7',
    scenario: 'Person Walking Through Hallway',
    desc: 'Surveillance camera monitors empty corridor. Subtraction detects intruder stepping into doorway.',
    defaultT: 25,
    matrixA: [
      [35, 45, 55, 65],
      [35, 45, 55, 65],
      [35, 45, 55, 65],
      [35, 45, 55, 65]
    ],
    matrixB: [
      [35,  45,  55, 65],
      [35, 215, 215, 65],
      [35, 215, 215, 65],
      [35,  45,  55, 65]
    ]
  }
};

/**
 * Compact Canvas Component with change highlight bounding box & glow
 */
function PipelineCanvas({
  matrix,
  hoveredCell,
  onHoverCell,
  pixelSize = 26,
  highlightColor = 'var(--accent-purple)',
  title,
  mode = 'normal', // 'normal', 'diff', 'highlightOverlay', 'mask'
  threshold = 25,
  matrixA = null,
  matrixB = null
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

    // Retina display crispness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    // Track bounding box of changed pixels if in highlight mode
    let minR = rows, maxR = -1, minC = cols, maxC = -1;
    let hasChanges = false;

    // 1. Draw base pixel tiles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let val = matrix[r][c];

        if (mode === 'mask') {
          val = val === 1 ? 255 : 0;
          ctx.fillStyle = val === 255 ? '#10B981' : (isLight ? '#E5E7EB' : '#111827');
        } else if (mode === 'diff') {
          const isChanged = val > threshold;
          if (isChanged) {
            ctx.fillStyle = `rgb(${Math.min(255, val * 1.5)}, ${Math.min(240, val * 1.2)}, 255)`;
          } else {
            ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
          }
        } else if (mode === 'highlightOverlay') {
          // Highlight overlay over Image B
          const delta = Math.abs((matrixB?.[r]?.[c] ?? 0) - (matrixA?.[r]?.[c] ?? 0));
          const isChanged = delta > threshold;
          const baseB = matrixB ? matrixB[r][c] : val;

          if (isChanged) {
            hasChanges = true;
            if (r < minR) minR = r;
            if (r > maxR) maxR = r;
            if (c < minC) minC = c;
            if (c > maxC) maxC = c;

            // Determine if pixel got brighter (added) or darker (removed)
            const signedDelta = (matrixB?.[r]?.[c] ?? 0) - (matrixA?.[r]?.[c] ?? 0);
            if (signedDelta > 0) {
              // Added: Emerald tint
              ctx.fillStyle = `rgba(16, 185, 129, 0.85)`;
            } else {
              // Removed: Amber/Rose tint
              ctx.fillStyle = `rgba(239, 68, 68, 0.85)`;
            }
          } else {
            // Unchanged: standard grayscale pixel
            ctx.fillStyle = `rgb(${baseB}, ${baseB}, ${baseB})`;
          }
        } else {
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        }

        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);

        // Grid lines
        ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.2)';
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

    // 2. In highlight mode, draw an animated bounding box around changed cluster
    if (mode === 'highlightOverlay' && hasChanges && maxR >= minR && maxC >= minC) {
      const boxX = minC * pixelSize;
      const boxY = minR * pixelSize;
      const boxW = (maxC - minC + 1) * pixelSize;
      const boxH = (maxR - minR + 1) * pixelSize;

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10B981';
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);
      ctx.setLineDash([]); // reset dash

      // Corner tags
      ctx.fillStyle = '#10B981';
      ctx.fillRect(boxX, boxY, 5, 5);
      ctx.fillRect(boxX + boxW - 5, boxY, 5, 5);
      ctx.fillRect(boxX, boxY + boxH - 5, 5, 5);
      ctx.fillRect(boxX + boxW - 5, boxY + boxH - 5, 5, 5);
    }

    ctx.restore();
  }, [matrix, hoveredCell, rows, cols, pixelSize, highlightColor, mode, threshold, matrixA, matrixB]);

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

export default function Step10FindWhatChanged({ onSelectStep }) {
  // Main view mode: 'matrix' (4x4 numerical pipeline) or 'photoLab' (custom photos upload/camera)
  const [activeTab, setActiveTab] = useState('matrix');

  // Preset Selection for Matrix Mode
  const [currentPresetKey, setCurrentPresetKey] = useState('objectAdded');

  // Matrices for Scene 1 (A) and Scene 2 (B)
  const [matrixA, setMatrixA] = useState(CHANGE_PRESETS.objectAdded.matrixA);
  const [matrixB, setMatrixB] = useState(CHANGE_PRESETS.objectAdded.matrixB);

  // Threshold T for change detection
  const [threshold, setThreshold] = useState(25);

  // Sensor Noise Level: 0 (clean), 3 (low), 6 (medium), 12 (high)
  const [noiseLevel, setNoiseLevel] = useState(0);

  // Card 4 View: 'highlight' (Scene B + Glowing Overlay), 'diffMask' (Binary Mask), 'signed' (B - A with + / -)
  const [card4View, setCard4View] = useState('highlight');

  // Synchronized hovered cell: { row, col, x, y }
  const [hoveredCell, setHoveredCell] = useState(null);

  // -------------------------------------------------------------
  // Custom Photo Lab State
  // -------------------------------------------------------------
  const [photoA, setPhotoA] = useState(null);
  const [photoB, setPhotoB] = useState(null);
  const [photoLabResolution, setPhotoLabResolution] = useState(8); // 8x8 or 16x16
  const [photoMatrixA, setPhotoMatrixA] = useState(null);
  const [photoMatrixB, setPhotoMatrixB] = useState(null);
  const [photoThreshold, setPhotoThreshold] = useState(30);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStep, setCameraStep] = useState(1); // 1 = capturing photo 1, 2 = capturing photo 2
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null);

  // Apply deterministic sensor noise to matrix B if enabled
  const noisyMatrixB = useMemo(() => {
    if (noiseLevel === 0) return matrixB;
    return matrixB.map((row, r) =>
      row.map((val, c) => {
        const jitter = Math.sin(r * 3.7 + c * 5.9) * noiseLevel;
        return clampPixel(val + Math.round(jitter));
      })
    );
  }, [matrixB, noiseLevel]);

  // Difference Matrix D = |A - B|
  const matrixD = useMemo(() => {
    return subtractMatrices(matrixA, noisyMatrixB, true);
  }, [matrixA, noisyMatrixB]);

  // Binary Change Mask M = 1 if D > T, else 0
  const matrixM = useMemo(() => {
    return thresholdMatrix(matrixD, threshold, 1);
  }, [matrixD, threshold]);

  // Change Detection Intelligence & Statistics
  const changeAnalysis = useMemo(() => {
    const rows = matrixA.length;
    const cols = matrixA[0].length;
    let changedCount = 0;
    let totalPixels = rows * cols;
    let maxDelta = 0;
    let posDeltaCount = 0;
    let negDeltaCount = 0;

    let minR = rows, maxR = -1, minC = cols, maxC = -1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const delta = matrixD[r][c];
        if (delta > maxDelta) maxDelta = delta;

        if (delta > threshold) {
          changedCount++;
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;

          const signed = matrixB[r][c] - matrixA[r][c];
          if (signed > 0) posDeltaCount++;
          else if (signed < 0) negDeltaCount++;
        }
      }
    }

    // Determine classification
    let classification = 'No Significant Change';
    let classBadge = 'Static';
    let classColor = 'var(--text-muted)';

    if (changedCount > 0) {
      if (posDeltaCount > 0 && negDeltaCount > 0) {
        classification = 'Object Moved (Displacement)';
        classBadge = '⇄ Moved / Motion';
        classColor = '#38BDF8';
      } else if (posDeltaCount >= negDeltaCount) {
        classification = 'Object Added (Brightness Gain)';
        classBadge = '+ Object Added';
        classColor = '#10B981';
      } else {
        classification = 'Object Removed (Returned to BG)';
        classBadge = '− Object Removed';
        classColor = '#EF4444';
      }
    }

    const pctChanged = ((changedCount / totalPixels) * 100).toFixed(0);
    const hasBoundingBox = maxR >= minR && maxC >= minC;

    return {
      changedCount,
      totalPixels,
      pctChanged,
      maxDelta,
      posDeltaCount,
      negDeltaCount,
      classification,
      classBadge,
      classColor,
      hasBoundingBox,
      boundingBox: hasBoundingBox ? { minR, maxR, minC, maxC } : null
    };
  }, [matrixA, matrixB, matrixD, threshold]);

  // Handle cell value change in Scene 1 (A)
  const handleCellChangeA = (r, c, val) => {
    const next = matrixA.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixA(next);
  };

  // Handle cell value change in Scene 2 (B)
  const handleCellChangeB = (r, c, val) => {
    const next = matrixB.map(row => [...row]);
    next[r][c] = Math.min(255, Math.max(0, val));
    setMatrixB(next);
  };

  // Preset Selection
  const handleSelectPreset = (key) => {
    setCurrentPresetKey(key);
    const p = CHANGE_PRESETS[key];
    setMatrixA(p.matrixA.map(row => [...row]));
    setMatrixB(p.matrixB.map(row => [...row]));
    setThreshold(p.defaultT);
  };

  // Reset to default preset
  const handleReset = () => {
    handleSelectPreset(currentPresetKey);
    setNoiseLevel(0);
  };

  // Swap Scene A and Scene B
  const handleSwapScenes = () => {
    const tempA = matrixA.map(row => [...row]);
    setMatrixA(matrixB.map(row => [...row]));
    setMatrixB(tempA);
  };

  // Hovered Info
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const { row, col } = hoveredCell;
    const valA = matrixA[row]?.[col] ?? 0;
    const valB = noisyMatrixB[row]?.[col] ?? 0;
    const valD = matrixD[row]?.[col] ?? 0;
    const isAboveT = valD > threshold;
    const signedDiff = valB - valA;

    return { row, col, valA, valB, valD, isAboveT, signedDiff };
  }, [hoveredCell, matrixA, noisyMatrixB, matrixD, threshold]);

  // -----------------------------------------------------------------
  // Photo Lab: Convert image file/data to downsampled matrix
  // -----------------------------------------------------------------
  const processImageToMatrix = (imageSrc, targetSize) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetSize, targetSize);
        const imgData = ctx.getImageData(0, 0, targetSize, targetSize).data;

        const mat = [];
        for (let r = 0; r < targetSize; r++) {
          const row = [];
          for (let c = 0; c < targetSize; c++) {
            const idx = (r * targetSize + c) * 4;
            const red = imgData[idx];
            const green = imgData[idx + 1];
            const blue = imgData[idx + 2];
            // Standard luminance formula
            const gray = clampPixel(0.299 * red + 0.587 * green + 0.114 * blue);
            row.push(gray);
          }
          mat.push(row);
        }
        resolve(mat);
      };
      img.src = imageSrc;
    });
  };

  // Handle file uploads
  const handleFileUpload = (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (slot === 'A') {
        setPhotoA(dataUrl);
        const mat = await processImageToMatrix(dataUrl, photoLabResolution);
        setPhotoMatrixA(mat);
      } else {
        setPhotoB(dataUrl);
        const mat = await processImageToMatrix(dataUrl, photoLabResolution);
        setPhotoMatrixB(mat);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load procedural demo sample photos
  const loadSamplePhotos = async (scenarioType) => {
    // Generate two synthetic canvas pictures
    const createSampleCanvas = (hasObject, isMoved) => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');

      // Tabletop background with wood texture
      ctx.fillStyle = '#4B3621';
      ctx.fillRect(0, 0, 160, 160);
      ctx.fillStyle = '#5C4033';
      for (let i = 0; i < 160; i += 20) {
        ctx.fillRect(0, i, 160, 10);
      }

      // Add object if specified
      if (hasObject) {
        const objX = isMoved ? 115 : 45;
        const objY = isMoved ? 110 : 45;
        // Bright mug
        ctx.beginPath();
        ctx.arc(objX, objY, 26, 0, Math.PI * 2);
        ctx.fillStyle = '#F3F4F6';
        ctx.fill();
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Mug coffee center
        ctx.beginPath();
        ctx.arc(objX, objY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#271506';
        ctx.fill();
      }

      return canvas.toDataURL('image/png');
    };

    if (scenarioType === 'added') {
      const urlA = createSampleCanvas(false, false);
      const urlB = createSampleCanvas(true, false);
      setPhotoA(urlA);
      setPhotoB(urlB);
      const matA = await processImageToMatrix(urlA, photoLabResolution);
      const matB = await processImageToMatrix(urlB, photoLabResolution);
      setPhotoMatrixA(matA);
      setPhotoMatrixB(matB);
    } else if (scenarioType === 'removed') {
      const urlA = createSampleCanvas(true, false);
      const urlB = createSampleCanvas(false, false);
      setPhotoA(urlA);
      setPhotoB(urlB);
      const matA = await processImageToMatrix(urlA, photoLabResolution);
      const matB = await processImageToMatrix(urlB, photoLabResolution);
      setPhotoMatrixA(matA);
      setPhotoMatrixB(matB);
    } else {
      // Moved
      const urlA = createSampleCanvas(true, false);
      const urlB = createSampleCanvas(true, true);
      setPhotoA(urlA);
      setPhotoB(urlB);
      const matA = await processImageToMatrix(urlA, photoLabResolution);
      const matB = await processImageToMatrix(urlB, photoLabResolution);
      setPhotoMatrixA(matA);
      setPhotoMatrixB(matB);
    }
  };

  // Re-process photo matrices when resolution changes
  useEffect(() => {
    if (photoA) {
      processImageToMatrix(photoA, photoLabResolution).then(setPhotoMatrixA);
    }
    if (photoB) {
      processImageToMatrix(photoB, photoLabResolution).then(setPhotoMatrixB);
    }
  }, [photoLabResolution]);

  // Webcam capture functionality
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 320, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraStep(1);
    } catch (err) {
      setCameraError('Camera access denied or unavailable. You can still upload photos from disk!');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 160, 160);
    const dataUrl = canvas.toDataURL('image/jpeg');

    if (cameraStep === 1) {
      setPhotoA(dataUrl);
      const mat = await processImageToMatrix(dataUrl, photoLabResolution);
      setPhotoMatrixA(mat);
      setCameraStep(2);
    } else {
      setPhotoB(dataUrl);
      const mat = await processImageToMatrix(dataUrl, photoLabResolution);
      setPhotoMatrixB(mat);
      stopCamera();
    }
  };

  // Photo Lab Difference Matrix
  const photoMatrixD = useMemo(() => {
    if (!photoMatrixA || !photoMatrixB) return null;
    return subtractMatrices(photoMatrixA, photoMatrixB, true);
  }, [photoMatrixA, photoMatrixB]);

  // Photo Lab Stats
  const photoStats = useMemo(() => {
    if (!photoMatrixD) return null;
    let changed = 0;
    const total = photoMatrixD.length * photoMatrixD[0].length;
    for (let r = 0; r < photoMatrixD.length; r++) {
      for (let c = 0; c < photoMatrixD[0].length; c++) {
        if (photoMatrixD[r][c] > photoThreshold) changed++;
      }
    }
    return {
      changed,
      total,
      pct: ((changed / total) * 100).toFixed(0)
    };
  }, [photoMatrixD, photoThreshold]);

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
            <span className="modal-badge-tag" style={{ margin: 0, background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.35)' }}>
              Chapter 8.3
            </span>
            <span style={{ fontSize: '0.85rem', color: '#38BDF8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Change & Motion Detection Pipeline
            </span>
          </div>

          {/* Sub-Chapter Switcher with all 3 chapters */}
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
              className="sub-chapter-pill active"
              title="Current: 8.3 Matrix Subtraction (Find What Changed)"
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

        <h2 className="step-heading">8.3 Matrix Subtraction: Find What Changed</h2>
        <p className="step-description">
          Take two photographs of the same scene where an object has been <strong>added</strong>, <strong>removed</strong>, or <strong>moved</strong>. Represent them as matrices <strong>A</strong> and <strong>B</strong>, and calculate the absolute difference <code>D = |A − B|</code>. Pixels that stayed the same yield values near zero, while altered regions produce large differences. You can also upload or take your own two photographs!
        </p>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
          <button
            className={`preset-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 1rem' }}
          >
            <Grid size={15} />
            <span>Interactive Matrix Pipeline (4×4)</span>
          </button>
          <button
            className={`preset-btn ${activeTab === 'photoLab' ? 'active' : ''}`}
            onClick={() => setActiveTab('photoLab')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 1rem' }}
          >
            <Camera size={15} />
            <span>Photo Change Detection Lab (Upload / Camera)</span>
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* TOP CONTROLS CARD */}
          <div className="top-control-card subtraction-controls-card">
            <div className="subtraction-controls-grid">
              
              {/* Part 1: Threshold Slider & Presets */}
              <div className="slider-group" style={{ marginBottom: 0 }}>
                <div className="slider-label" style={{ marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} color="var(--accent-cyan)" />
                    <span>Change Sensitivity Threshold (T):</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontSize: '1.25rem', fontWeight: '800' }}>
                      {threshold}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      (|A − B| &gt; {threshold} ➔ Change)
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
                    '--slider-color': 'var(--accent-cyan)' 
                  }}
                />

                {/* Quick Threshold Presets */}
                <div className="alpha-presets-row">
                  <button 
                    className={`mini-preset-pill ${threshold === 0 ? 'active' : ''}`}
                    onClick={() => setThreshold(0)}
                    title="T = 0 (Detect all differences including tiny noise)"
                  >
                    T = 0 (Raw)
                  </button>
                  <button 
                    className={`mini-preset-pill ${threshold === 15 ? 'active' : ''}`}
                    onClick={() => setThreshold(15)}
                    title="T = 15 (High sensitivity)"
                  >
                    T = 15 (Sensitive)
                  </button>
                  <button 
                    className={`mini-preset-pill ${threshold === 25 ? 'active' : ''}`}
                    onClick={() => setThreshold(25)}
                    title="T = 25 (Recommended default)"
                  >
                    T = 25 (Balanced)
                  </button>
                  <button 
                    className={`mini-preset-pill ${threshold === 50 ? 'active' : ''}`}
                    onClick={() => setThreshold(50)}
                    title="T = 50 (High contrast only)"
                  >
                    T = 50 (High)
                  </button>
                </div>
              </div>

              {/* Part 2: Presets & Noise Simulator */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div className="control-row-group">
                  <span className="control-row-label">
                    Scenarios:
                  </span>
                  <div className="addition-presets-strip" style={{ flexWrap: 'wrap' }}>
                    {Object.entries(CHANGE_PRESETS).map(([key, data]) => (
                      <button
                        key={key}
                        className={`preset-btn mini-btn ${currentPresetKey === key ? 'active' : ''}`}
                        onClick={() => handleSelectPreset(key)}
                        title={data.desc}
                        style={{
                          borderColor: currentPresetKey === key ? data.badgeColor : undefined,
                          color: currentPresetKey === key ? data.badgeColor : undefined
                        }}
                      >
                        {data.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Camera Sensor Noise Simulation */}
                <div className="control-row-group" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="control-row-label">Camera Sensor Noise:</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>(Real photography jitter)</span>
                  </div>
                  <div className="noise-pill-group">
                    <button
                      className={`noise-btn ${noiseLevel === 0 ? 'active' : ''}`}
                      onClick={() => setNoiseLevel(0)}
                      title="Noise = 0 (Ideal perfect math)"
                    >
                      ±0
                    </button>
                    <button
                      className={`noise-btn ${noiseLevel === 3 ? 'active' : ''}`}
                      onClick={() => setNoiseLevel(3)}
                      title="Noise = ±3 (Realistic sensor noise)"
                    >
                      ±3
                    </button>
                    <button
                      className={`noise-btn ${noiseLevel === 7 ? 'active' : ''}`}
                      onClick={() => setNoiseLevel(7)}
                      title="Noise = ±7 (Dim lighting / webcam)"
                    >
                      ±7
                    </button>
                    <button
                      className={`noise-btn ${noiseLevel === 14 ? 'active' : ''}`}
                      onClick={() => setNoiseLevel(14)}
                      title="Noise = ±14 (Heavy sensor grain)"
                    >
                      ±14
                    </button>
                  </div>
                </div>

                {/* Actions: Swap & Reset */}
                <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.15rem' }}>
                  <button
                    className="preset-btn mini-btn"
                    onClick={handleSwapScenes}
                    title="Swap Scene A and Scene B"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Move size={12} />
                    <span>Swap A ⇄ B</span>
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

          {/* PIPELINE CARDS: Image 1 → Image 2 → Subtract → Highlight the Change */}
          <div className="addition-pipeline-row">
            
            {/* COLUMN 1: IMAGE 1 (A) */}
            <div className="addition-column-card card-mat-a">
              <div className="addition-column-header">
                <div className="col-header-left">
                  <span className="matrix-title-badge badge-a">A</span>
                  <div>
                    <h3 className="addition-card-title">Image 1 (A)</h3>
                    <span className="addition-card-subtitle">Initial Scene State</span>
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
                    title="Scene 1 (Reference A)"
                  />
                  <div className="canvas-subrow-info">
                    <span className="subrow-label">Scene 1 (A)</span>
                    <span className="subrow-hint">Before any alteration</span>
                    <div className="subrow-actions">
                      <span className="badge-tag-mini">Editable</span>
                    </div>
                  </div>
                </div>

                {/* 4x4 Grid for A */}
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
                              background: `linear-gradient(135deg, rgba(${val},${val},${val},0.16) 0%, var(--bg-secondary) 100%)`
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

            {/* OPERATOR 1: ➔ COMPARE */}
            <div className="addition-operator-divider">
              <div className="operator-badge minus-badge" title="Subtract matrices element-by-element">
                <Minus size={20} strokeWidth={2.8} />
              </div>
              <span className="operator-label">Compare</span>
            </div>

            {/* COLUMN 2: IMAGE 2 (B) */}
            <div className="addition-column-card card-mat-b">
              <div className="addition-column-header">
                <div className="col-header-left">
                  <span className="matrix-title-badge badge-b">B</span>
                  <div>
                    <h3 className="addition-card-title">Image 2 (B)</h3>
                    <span className="addition-card-subtitle" style={{ color: '#F59E0B' }}>
                      Modified Scene
                    </span>
                  </div>
                </div>
                <div className="col-header-right">
                  <span className="matrix-dims">4 × 4</span>
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
                    title="Scene 2 (Modified B)"
                  />
                  <div className="canvas-subrow-info">
                    <span className="subrow-label">Scene 2 (B)</span>
                    <span className="subrow-hint">Object added, removed, or moved</span>
                    <div className="subrow-actions">
                      <span className="badge-tag-mini" style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        Editable
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4x4 Grid for B */}
                <div className="matrix-bracket-container compact-bracket">
                  <div 
                    className="matrix-grid compact-grid"
                    style={{ gridTemplateColumns: `repeat(${matrixB[0].length}, 1fr)` }}
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

            {/* OPERATOR 2: 🟰 SUBTRACT */}
            <div className="addition-operator-divider">
              <div className="operator-badge equals-badge" title="Difference Matrix D = |A - B|">
                <Equal size={20} strokeWidth={2.8} />
              </div>
              <span className="operator-label">Subtract</span>
            </div>

            {/* COLUMN 3: DIFFERENCE (D) */}
            <div className="addition-column-card card-diff-d">
              <div className="addition-column-header">
                <div className="col-header-left">
                  <span className="matrix-title-badge badge-d">D</span>
                  <div>
                    <h3 className="addition-card-title">Difference Image (D)</h3>
                    <span className="addition-card-subtitle" style={{ color: 'var(--accent-cyan)' }}>
                      D = |A − B|
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
                    mode="diff"
                    threshold={threshold}
                    title="Difference Matrix Heatmap (D)"
                  />
                  <div className="canvas-subrow-info">
                    <span className="subrow-label">Delta Magnitudes</span>
                    <span className="subrow-hint">Blue glow: D &gt; {threshold}</span>
                    <div className="subrow-actions">
                      <span className="badge-tag-mini" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                        Live |A − B|
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4x4 Grid for D */}
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
                                ? `linear-gradient(135deg, rgba(6, 182, 212, 0.28) 0%, var(--bg-secondary) 100%)`
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
                                Δ
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

            {/* OPERATOR 3: ➔ HIGHLIGHT CHANGE */}
            <div className="addition-operator-divider">
              <div className="operator-badge filter-badge" title="Highlight differences where D > T">
                <Scan size={18} strokeWidth={2.6} />
              </div>
              <span className="operator-label">Highlight</span>
            </div>

            {/* COLUMN 4: HIGHLIGHT THE CHANGE */}
            <div className="addition-column-card card-mask-m" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <div className="addition-column-header">
                <div className="col-header-left">
                  <span className="matrix-title-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                    ★
                  </span>
                  <div>
                    <h3 className="addition-card-title">Highlight the Change</h3>
                    <span className="addition-card-subtitle" style={{ color: '#10B981' }}>
                      Change & Motion Detected
                    </span>
                  </div>
                </div>
                <div className="col-header-right">
                  <span className="matrix-dims" style={{ borderColor: 'rgba(16, 185, 129, 0.35)', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)' }}>
                    {changeAnalysis.pctChanged}% Δ
                  </span>
                </div>
              </div>

              <div className="addition-card-body">
                {/* View Selector Bar */}
                <div className="mask-view-toggle-bar">
                  <button
                    type="button"
                    className={`mask-toggle-pill ${card4View === 'highlight' ? 'active' : ''}`}
                    onClick={() => setCard4View('highlight')}
                    title="View Image 2 with Neon Highlight Overlay"
                  >
                    <Eye size={12} />
                    <span>Overlay</span>
                  </button>
                  <button
                    type="button"
                    className={`mask-toggle-pill ${card4View === 'diffMask' ? 'active' : ''}`}
                    onClick={() => setCard4View('diffMask')}
                    title="View Binary Change Mask (1 = Change, 0 = Static)"
                  >
                    <Grid size={12} />
                    <span>Mask (M)</span>
                  </button>
                  <button
                    type="button"
                    className={`mask-toggle-pill ${card4View === 'signed' ? 'active' : ''}`}
                    onClick={() => setCard4View('signed')}
                    title="View Signed Difference (B - A)"
                  >
                    <Sliders size={12} />
                    <span>Signed Δ</span>
                  </button>
                </div>

                <div className="canvas-subrow">
                  <PipelineCanvas
                    matrix={card4View === 'diffMask' ? matrixM : noisyMatrixB}
                    matrixA={matrixA}
                    matrixB={noisyMatrixB}
                    hoveredCell={hoveredCell}
                    onHoverCell={setHoveredCell}
                    pixelSize={24}
                    highlightColor="#10B981"
                    mode={card4View === 'highlight' ? 'highlightOverlay' : card4View === 'diffMask' ? 'mask' : 'normal'}
                    threshold={threshold}
                    title="Highlighted Change Visualizer"
                  />
                  <div className="canvas-subrow-info">
                    <span className="subrow-label" style={{ color: changeAnalysis.classColor, fontWeight: 700 }}>
                      {changeAnalysis.classBadge}
                    </span>
                    <span className="subrow-hint">
                      {changeAnalysis.changedCount} / {changeAnalysis.totalPixels} cells altered
                    </span>
                    <div className="subrow-actions">
                      <span className="status-live-indicator" style={{ color: '#10B981' }}>
                        <span className="pulse-dot" style={{ background: '#10B981' }}></span> Live Tracking
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4x4 Grid for Card 4 */}
                <div className="matrix-bracket-container compact-bracket">
                  <div 
                    className="matrix-grid compact-grid"
                    style={{ gridTemplateColumns: `repeat(${matrixM[0].length}, 1fr)` }}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {matrixM.map((row, i) =>
                      row.map((val, j) => {
                        const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                        const isChanged = val === 1;
                        const signedVal = noisyMatrixB[i][j] - matrixA[i][j];

                        return (
                          <div
                            key={`c4-${i}-${j}`}
                            className={`matrix-cell result-cell compact-cell ${isHovered ? 'hovered' : ''}`}
                            style={{
                              '--cell-accent': '#10B981',
                              borderColor: isHovered ? '#10B981' : isChanged ? 'rgba(16, 185, 129, 0.5)' : undefined,
                              background: isChanged 
                                ? (signedVal > 0 
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, var(--bg-secondary) 100%)' 
                                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, var(--bg-secondary) 100%)')
                                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0%, var(--bg-secondary) 100%)'
                            }}
                            onMouseEnter={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                            onMouseMove={(e) => setHoveredCell({ row: i, col: j, x: e.clientX, y: e.clientY })}
                          >
                            <span 
                              className="matrix-cell-val compact-val"
                              style={{ 
                                color: isChanged ? (signedVal > 0 ? '#10B981' : '#EF4444') : 'var(--text-muted)',
                                fontWeight: isChanged ? '800' : '600'
                              }}
                            >
                              {card4View === 'diffMask' ? val : card4View === 'signed' ? (signedVal > 0 ? `+${signedVal}` : `${signedVal}`) : (isChanged ? 'Δ' : '·')}
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

          {/* REAL-TIME MATHEMATICAL INSPECTOR & HOVER HUD */}
          <div className="hover-calculation-card">
            {hoveredInfo ? (
              <div className="hover-calc-content">
                <div className="calc-cell-target">
                  <span className="font-mono">Pixel ({hoveredInfo.row}, {hoveredInfo.col})</span>
                </div>
                <div className="calc-formula-row">
                  <span className="calc-part" style={{ color: 'var(--accent-purple)' }}>
                    Image 1: <strong>{hoveredInfo.valA}</strong>
                  </span>
                  <span className="calc-op">−</span>
                  <span className="calc-part" style={{ color: '#F59E0B' }}>
                    Image 2: <strong>{hoveredInfo.valB}</strong>
                  </span>
                  <span className="calc-op">=</span>
                  <span className="calc-part" style={{ color: 'var(--accent-cyan)' }}>
                    Delta |A−B|: <strong>{hoveredInfo.valD}</strong>
                  </span>
                  <span className="calc-op">➔</span>
                  <span 
                    className="calc-part" 
                    style={{ 
                      color: hoveredInfo.isAboveT ? '#10B981' : 'var(--text-muted)',
                      fontWeight: 700 
                    }}
                  >
                    {hoveredInfo.isAboveT 
                      ? `CHANGE DETECTED (${hoveredInfo.valD} > ${threshold}) [${hoveredInfo.signedDiff > 0 ? '+' : ''}${hoveredInfo.signedDiff}]` 
                      : `Unchanged / Static (${hoveredInfo.valD} ≤ ${threshold})`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="hover-calc-placeholder">
                <HelpCircle size={15} color="var(--text-muted)" />
                <span>Hover or scroll over any matrix cell above to inspect the element-by-element subtraction mathematics</span>
              </div>
            )}
          </div>
        </>
      ) : (
        /* -------------------------------------------------------------
           CUSTOM PHOTO LAB (UPLOAD OR SNAP 2 PHOTOGRAPHS)
           ------------------------------------------------------------- */
        <div className="top-control-card" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={19} color="#38BDF8" />
                <span>Custom Photography Laboratory: Find What Changed</span>
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Upload two photos or snap them with your webcam to watch matrix subtraction detect changes automatically!
              </p>
            </div>

            {/* Resolution selector for downsampled matrix */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Analysis Resolution:</span>
              <div className="noise-pill-group">
                <button
                  className={`noise-btn ${photoLabResolution === 8 ? 'active' : ''}`}
                  onClick={() => setPhotoLabResolution(8)}
                  title="8x8 Matrix (64 numerical cells)"
                >
                  8 × 8
                </button>
                <button
                  className={`noise-btn ${photoLabResolution === 16 ? 'active' : ''}`}
                  onClick={() => setPhotoLabResolution(16)}
                  title="16x16 Matrix (256 numerical cells)"
                >
                  16 × 16
                </button>
              </div>
            </div>
          </div>

          {/* Quick Demo Sample Photo Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try Ready-Made Test Photos:</span>
            <button
              className="preset-btn mini-btn"
              onClick={() => loadSamplePhotos('added')}
              title="Desk without Coffee Mug ➔ Coffee Mug Added"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={13} color="#10B981" />
              <span>Coffee Mug Added</span>
            </button>
            <button
              className="preset-btn mini-btn"
              onClick={() => loadSamplePhotos('removed')}
              title="Desk with Coffee Mug ➔ Coffee Mug Removed"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <MinusCircle size={13} color="#EF4444" />
              <span>Mug Removed</span>
            </button>
            <button
              className="preset-btn mini-btn"
              onClick={() => loadSamplePhotos('moved')}
              title="Mug shifted across the desk"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Move size={13} color="#38BDF8" />
              <span>Mug Moved (Motion)</span>
            </button>

            {/* Webcam Button */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              {!isCameraActive ? (
                <button
                  className="preset-btn mini-btn"
                  onClick={startCamera}
                  style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
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

          {/* Active Webcam Streaming Card */}
          {isCameraActive && (
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--accent-cyan)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative', width: '220px', height: '220px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--border-color)', background: '#000' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '6px', fontSize: '0.75rem', color: '#FFF' }}>
                  {cameraStep === 1 ? 'Step 1: Snap Scene 1' : 'Step 2: Move an item & Snap Scene 2!'}
                </div>
              </div>
              <button
                className="mode-btn active"
                onClick={capturePhotoFromCamera}
                style={{ background: '#38BDF8', color: '#000', fontWeight: 700, padding: '0.55rem 1.25rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Camera size={16} />
                <span>{cameraStep === 1 ? '📸 Capture Photo 1 (Reference)' : '📸 Capture Photo 2 (After Change)'}</span>
              </button>
            </div>
          )}

          {/* PHOTO SLOTS: PHOTO 1 & PHOTO 2 UPLOAD TILES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Slot A: Photo 1 */}
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-purple)' }}>Photo 1 (Scene A - Before)</span>
              
              {photoA ? (
                <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={photoA} alt="Photo 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '140px', height: '140px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <ImageIcon size={28} />
                  <span style={{ fontSize: '0.74rem' }}>No Photo Selected</span>
                </div>
              )}

              <input 
                ref={fileInputRefA}
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'A')}
              />
              <button
                className="preset-btn mini-btn"
                onClick={() => fileInputRefA.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Upload size={13} />
                <span>Upload Photo 1</span>
              </button>
            </div>

            {/* Slot B: Photo 2 */}
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F59E0B' }}>Photo 2 (Scene B - After)</span>
              
              {photoB ? (
                <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={photoB} alt="Photo 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '140px', height: '140px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <ImageIcon size={28} />
                  <span style={{ fontSize: '0.74rem' }}>No Photo Selected</span>
                </div>
              )}

              <input 
                ref={fileInputRefB}
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'B')}
              />
              <button
                className="preset-btn mini-btn"
                onClick={() => fileInputRefB.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Upload size={13} />
                <span>Upload Photo 2</span>
              </button>
            </div>
          </div>

          {/* Photo Difference Results Pipeline */}
          {photoMatrixA && photoMatrixB && photoMatrixD ? (
            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Live Matrix Difference: D = |A − B| ({photoLabResolution}×{photoLabResolution} Grid)
                </span>
                
                {/* Threshold Slider for Photos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Filter Threshold:</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={photoThreshold}
                    onChange={(e) => setPhotoThreshold(parseInt(e.target.value))}
                    style={{ width: '90px' }}
                  />
                  <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 700 }}>
                    {photoThreshold}
                  </span>
                </div>
              </div>

              {/* 4 Pipeline Canvases for Photos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                
                {/* Canvas 1: Photo Matrix A */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)' }}>Photo Matrix A</span>
                  <PipelineCanvas
                    matrix={photoMatrixA}
                    pixelSize={photoLabResolution === 8 ? 16 : 8}
                    highlightColor="var(--accent-purple)"
                    title="Photo A Grayscale Matrix"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>−</div>

                {/* Canvas 2: Photo Matrix B */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F59E0B' }}>Photo Matrix B</span>
                  <PipelineCanvas
                    matrix={photoMatrixB}
                    pixelSize={photoLabResolution === 8 ? 16 : 8}
                    highlightColor="#F59E0B"
                    title="Photo B Grayscale Matrix"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>=</div>

                {/* Canvas 3: Difference Matrix D */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Difference (D)</span>
                  <PipelineCanvas
                    matrix={photoMatrixD}
                    pixelSize={photoLabResolution === 8 ? 16 : 8}
                    mode="diff"
                    threshold={photoThreshold}
                    highlightColor="var(--accent-cyan)"
                    title="Photo Difference Heatmap"
                  />
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>➔</div>

                {/* Canvas 4: Highlight Changes on Photo B */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>Highlight What Changed</span>
                  <PipelineCanvas
                    matrix={photoMatrixB}
                    matrixA={photoMatrixA}
                    matrixB={photoMatrixB}
                    pixelSize={photoLabResolution === 8 ? 16 : 8}
                    mode="highlightOverlay"
                    threshold={photoThreshold}
                    highlightColor="#10B981"
                    title="Changes Highlighted on Photo B"
                  />
                </div>
              </div>

              {/* Detection Summary Banner */}
              {photoStats && (
                <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.15rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <CheckCircle2 size={18} color="#10B981" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem' }}>
                        Change Detection Complete!
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Detected <strong>{photoStats.changed}</strong> changed matrix pixels out of {photoStats.total} ({photoStats.pct}% of scene).
                      </div>
                    </div>
                  </div>
                  <span style={{ padding: '0.3rem 0.75rem', background: '#10B981', color: '#000', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {photoStats.pct}% Area Altered
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Choose a sample pair above or upload both Photo 1 and Photo 2 to run matrix subtraction!
            </div>
          )}
        </div>
      )}

      {/* EDUCATIONAL THEORY ACCORDION */}
      <div className="explanation-accordion-card">
        <h3 className="explanation-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-purple)" />
          <span>Real-World Mathematics: How Difference Matrices Detect Changes</span>
        </h3>
        
        <div className="math-concept-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.85rem' }}>
          
          <div className="math-concept-box">
            <h4 style={{ color: 'var(--accent-purple)', fontSize: '0.92rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>1. Absolute Difference D = |A − B|</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Subtracting image matrices element-by-element reveals changes between temporal frames. If an object is introduced or moves, <code>A(x, y) ≠ B(x, y)</code>, resulting in non-zero delta values at those coordinates while stationary background stays near 0.
            </p>
          </div>

          <div className="math-concept-box">
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.92rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>2. Why Threshold T is Vital</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              In real-world cameras, two consecutive photos of an empty room never yield an exact 0 difference because of sensor thermal noise, minor lighting flickers, and shadow shifts. The threshold <code>T</code> eliminates background noise so only meaningful physical alterations trigger detection.
            </p>
          </div>

          <div className="math-concept-box">
            <h4 style={{ color: '#10B981', fontSize: '0.92rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>3. Surveillance & Video Compression</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Security cameras use frame difference matrices to trigger motion alarms and store footage only when delta exceeds <code>T</code>. Furthermore, modern video formats (MPEG/H.264/H.265) transmit frame difference matrices instead of full pictures, reducing streaming bandwidth by over 95%!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
