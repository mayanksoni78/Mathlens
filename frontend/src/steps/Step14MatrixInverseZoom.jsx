import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RotateCcw, 
  Blend, 
  Scissors, 
  Scan, 
  Activity, 
  Maximize2, 
  Minimize2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Sliders,
  Info,
  Compass,
  CheckCircle2,
  ArrowRight,
  Undo2,
  Play,
  Pause,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Cpu
} from 'lucide-react';
import { 
  computeDeterminant, 
  computeInverseMatrix, 
  multiply2x2,
  interpolateMatrix 
} from '../core/transformEngine';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';

// Curated presets specifically fulfilling the user's scenarios
const ZOOM_PRESETS = [
  {
    id: 'zoom_in_2x',
    name: 'Zoom In 2×',
    badge: 'S = [2 0; 0 2]',
    k: 2.0,
    category: 'zoom_in',
    icon: ZoomIn,
    color: '#3B82F6',
    desc: 'Scales coordinates by 2×. S⁻¹=[0.5 0; 0 0.5] restores 1× scale.'
  },
  {
    id: 'zoom_out_half',
    name: 'Zoom Out 0.5×',
    badge: 'S = [0.5 0; 0 0.5]',
    k: 0.5,
    category: 'zoom_out',
    icon: ZoomOut,
    color: '#F59E0B',
    desc: 'Contracts coordinates by half. S⁻¹=[2 0; 0 2] restores 1× scale.'
  },
  {
    id: 'zoom_in_3x',
    name: 'Zoom In 3×',
    badge: 'S = [3 0; 0 3]',
    k: 3.0,
    category: 'zoom_in',
    icon: ZoomIn,
    color: '#8B5CF6',
    desc: 'High magnification: 3× linear scale (9× area). S⁻¹=[0.33 0; 0 0.33].'
  },
  {
    id: 'zoom_out_quarter',
    name: 'Zoom Out 0.25×',
    badge: 'S = [0.25 0; 0 0.25]',
    k: 0.25,
    category: 'zoom_out',
    icon: ZoomOut,
    color: '#06B6D4',
    desc: 'Wide view: 0.25× footprint. S⁻¹=[4 0; 0 4] magnifies it back.'
  },
  {
    id: 'identity_1x',
    name: 'Original 1×',
    badge: 'S = I',
    k: 1.0,
    category: 'identity',
    icon: RotateCcw,
    color: 'var(--text-secondary)',
    desc: 'Unaltered standard 1× coordinate scale: S = S⁻¹ = I.'
  }
];

const IDENTITY_MATRIX = { a: 1.0, b: 0.0, c: 0.0, d: 1.0 };

export default function Step14MatrixInverseZoom({ onSelectStep }) {
  // Zoom factor k
  const [zoomFactorK, setZoomFactorK] = useState(2.0);
  const [activePreset, setActivePreset] = useState('zoom_in_2x');

  // Stages:
  // 'original': 1.0x (Identity I)
  // 'zoomed': k x (Forward Scaling S)
  // 'inverted': 1.0x (Inverse S^-1 applied, returning to original!)
  const [currentStage, setCurrentStage] = useState('zoomed');

  // Animation interpolation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0); // 0 (zoomed) to 1 (restored)
  const animFrameRef = useRef(null);

  // Auto round-trip cycle state
  const [isPlayingCycle, setIsPlayingCycle] = useState(false);
  const cycleTimeoutRef = useRef(null);

  // Visualization subject (Default: Rocket)
  const [subjectType, setSubjectType] = useState('rocket'); // 'rocket' | 'portrait' | 'geometry' | 'macro' | 'custom'
  const [customImage, setCustomImage] = useState(null);
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Scaling matrix S = [k 0; 0 k]
  const matrixS = useMemo(() => ({
    a: zoomFactorK,
    b: 0.0,
    c: 0.0,
    d: zoomFactorK
  }), [zoomFactorK]);

  // Inverse scaling matrix S^-1 = [1/k 0; 0 1/k]
  const inverseS = useMemo(() => {
    if (Math.abs(zoomFactorK) < 1e-4) return null;
    const invK = 1.0 / zoomFactorK;
    return {
      a: invK,
      b: 0.0,
      c: 0.0,
      d: invK,
      kInv: invK
    };
  }, [zoomFactorK]);

  // Identity product verification: S^-1 * S
  const identityProduct = useMemo(() => {
    if (!inverseS) return null;
    return multiply2x2(inverseS, matrixS);
  }, [inverseS, matrixS]);

  // Determinant: det(S) = k^2, det(S^-1) = 1/k^2
  const detS = zoomFactorK * zoomFactorK;
  const detInvS = inverseS ? inverseS.a * inverseS.d : 0;

  // Effective matrix applied to the visual canvas
  const effectiveMatrix = useMemo(() => {
    if (isAnimating) {
      // Interpolate between matrixS (at t=0) and Identity (at t=1)
      return interpolateMatrix(matrixS, IDENTITY_MATRIX, animProgress);
    }
    if (currentStage === 'original' || currentStage === 'inverted') {
      return IDENTITY_MATRIX;
    }
    return matrixS; // 'zoomed'
  }, [currentStage, matrixS, isAnimating, animProgress]);

  // Zoom slider change handler
  const handleSliderChange = (val) => {
    const num = Math.max(0.2, Math.min(3.5, parseFloat(val)));
    setZoomFactorK(num);
    setActivePreset(null);
    setCurrentStage('zoomed');
    setIsPlayingCycle(false);
  };

  const handleStepValue = (delta) => {
    const nextVal = Math.round((zoomFactorK + delta) * 100) / 100;
    if (nextVal >= 0.2 && nextVal <= 3.5) {
      setZoomFactorK(nextVal);
      setActivePreset(null);
      setCurrentStage('zoomed');
      setIsPlayingCycle(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setZoomFactorK(preset.k);
    setActivePreset(preset.id);
    setCurrentStage('zoomed');
    setAnimProgress(0);
    setIsAnimating(false);
    setIsPlayingCycle(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
  };

  // Animated "Apply Inverse S^-1" transition
  const handleApplyInverse = () => {
    if (!inverseS) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setIsAnimating(true);
    setAnimProgress(0);

    const startTime = performance.now();
    const duration = 850; // 850ms smooth camera return

    const stepAnimation = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Smooth cubic easing
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setAnimProgress(eased);

      if (progress < 1.0) {
        animFrameRef.current = requestAnimationFrame(stepAnimation);
      } else {
        setIsAnimating(false);
        setCurrentStage('inverted');
      }
    };

    animFrameRef.current = requestAnimationFrame(stepAnimation);
  };

  // Re-apply forward zoom S
  const handleReapplyZoom = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setIsAnimating(true);
    setAnimProgress(1);

    const startTime = performance.now();
    const duration = 750;

    const stepAnimation = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setAnimProgress(1 - eased);

      if (progress < 1.0) {
        animFrameRef.current = requestAnimationFrame(stepAnimation);
      } else {
        setIsAnimating(false);
        setCurrentStage('zoomed');
      }
    };

    animFrameRef.current = requestAnimationFrame(stepAnimation);
  };

  // Automated round-trip demonstration cycle
  const handlePlayCycle = () => {
    if (isPlayingCycle) {
      setIsPlayingCycle(false);
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      return;
    }

    setIsPlayingCycle(true);
    setCurrentStage('original');

    // 1. Move to Zoomed after 600ms
    cycleTimeoutRef.current = setTimeout(() => {
      handleReapplyZoom();
      // 2. Move to Inverted after 1400ms
      cycleTimeoutRef.current = setTimeout(() => {
        handleApplyInverse();
        // 3. Finish cycle
        cycleTimeoutRef.current = setTimeout(() => {
          setIsPlayingCycle(false);
        }, 1200);
      }, 1400);
    }, 600);
  };

  // Custom photo upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setCustomImage(img);
        setCustomImagePreview(event.target.result);
        setSubjectType('custom');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Clear custom uploaded photo handler
  const handleClearCustomImage = () => {
    setCustomImage(null);
    setCustomImagePreview(null);
    setSubjectType('rocket');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    };
  }, []);

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* CHAPTER HEADER & SUB-CHAPTER NAVIGATION */}
      <div className="step-header-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span className="modal-badge-tag" style={{ margin: 0, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(56, 189, 248, 0.35)' }}>
              Chapter 8.7
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Scaling Inversion: S = [k 0; 0 k] &amp; S⁻¹ = [1/k 0; 0 1/k]
            </span>
          </div>

          {/* Sub-Chapter Switcher with all 7 chapters */}
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
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(11) : (window.location.hash = '#step11')}
              title="8.4 Image Inversion & X-Ray Effect"
            >
              <Activity size={13} />
              <span>8.4 Invert &amp; X-Ray</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(12) : (window.location.hash = '#step12')}
              title="8.5 Determinant: Stretch, Shrink, Flip or Collapse"
            >
              <Maximize2 size={13} />
              <span>8.5 Determinant</span>
            </button>
            <button 
              className="sub-chapter-pill"
              onClick={() => onSelectStep ? onSelectStep(13) : (window.location.hash = '#step13')}
              title="8.6 Matrix Inverse: Undo the Transformation"
            >
              <Undo2 size={13} />
              <span>8.6 Matrix Inverse</span>
            </button>
            <button 
              className="sub-chapter-pill active"
              title="Current: 8.7 Matrix Inverse: Zoom In and Zoom Out"
            >
              <ZoomIn size={13} />
              <span>8.7 Zoom In &amp; Out</span>
            </button>
          </div>
        </div>

        <h2 className="step-heading">
          8.7 Matrix Inverse: Zoom In and Zoom Out
        </h2>
        <p className="step-description">
          Zooming into an image is a geometric scaling transformation: <code>x′ = Sx</code> with 
          scaling matrix <code>S = [k 0; 0 k]</code>. For instance, <code>S = [2 0; 0 2]</code> scales 
          both coordinates by 2×, producing a zoom-in effect. Applying the inverse matrix 
          <code>S⁻¹ = [1/k 0; 0 1/k]</code> (e.g. <code>S⁻¹ = [½ 0; 0 ½]</code>) reverses the zoom and 
          restores the exact original scale, demonstrating visually that <strong>S⁻¹S = I</strong>!
        </p>

        {/* 2 REQUESTED PIPELINES HIGHLIGHT CARD */}
        <div style={{
          marginTop: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1rem'
        }}>
          {/* Pipeline 1: Zoom In 2x -> Apply Inverse -> Original */}
          <div 
            onClick={() => handleApplyPreset(ZOOM_PRESETS[0])}
            style={{
              padding: '1rem 1.2rem',
              background: zoomFactorK > 1 ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary)',
              border: zoomFactorK > 1 ? '1.5px solid #3B82F6' : '1px solid var(--border-color)',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ZoomIn size={16} style={{ color: '#3B82F6' }} />
                <strong style={{ fontSize: '0.88rem', color: '#3B82F6' }}>Scenario A: Zoom In 2×</strong>
              </div>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 700 }}>
                k = 2.0
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span>Original (1×)</span>
              <ArrowRight size={12} />
              <span style={{ color: '#3B82F6', fontWeight: 700 }}>Zoom In 2×</span>
              <ArrowRight size={12} />
              <span style={{ color: '#10B981', fontWeight: 700 }}>Apply S⁻¹ (½×)</span>
              <ArrowRight size={12} />
              <span>Original (1×)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              S = [2 0; 0 2] expands space ➔ S⁻¹ = [0.5 0; 0 0.5] cancels expansion back to identity.
            </span>
          </div>

          {/* Pipeline 2: Zoom Out 0.5x -> Apply Inverse -> Original */}
          <div 
            onClick={() => handleApplyPreset(ZOOM_PRESETS[1])}
            style={{
              padding: '1rem 1.2rem',
              background: zoomFactorK < 1 ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-secondary)',
              border: zoomFactorK < 1 ? '1.5px solid #F59E0B' : '1px solid var(--border-color)',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ZoomOut size={16} style={{ color: '#F59E0B' }} />
                <strong style={{ fontSize: '0.88rem', color: '#F59E0B' }}>Scenario B: Zoom Out 0.5×</strong>
              </div>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>
                k = 0.5
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span>Original (1×)</span>
              <ArrowRight size={12} />
              <span style={{ color: '#F59E0B', fontWeight: 700 }}>Zoom Out 0.5×</span>
              <ArrowRight size={12} />
              <span style={{ color: '#10B981', fontWeight: 700 }}>Apply S⁻¹ (2×)</span>
              <ArrowRight size={12} />
              <span>Original (1×)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              S = [0.5 0; 0 0.5] shrinks space ➔ S⁻¹ = [2 0; 0 2] magnifies it back to identity.
            </span>
          </div>
        </div>

        {/* HERO ACTION ROW */}
        <div style={{
          marginTop: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1rem 1.4rem'
        }}>
          {/* THE "APPLY INVERSE / RESTORE SCALE" BUTTON */}
          <button
            type="button"
            disabled={isAnimating || currentStage === 'inverted'}
            onClick={handleApplyInverse}
            className="action-btn"
            style={{
              padding: '0.75rem 1.6rem',
              background: currentStage === 'inverted'
                ? 'rgba(16, 185, 129, 0.2)'
                : 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
              color: '#FFFFFF',
              border: currentStage === 'inverted' ? '1.5px solid #10B981' : 'none',
              borderRadius: '12px',
              fontSize: '0.98rem',
              fontWeight: 800,
              cursor: isAnimating || currentStage === 'inverted' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              boxShadow: currentStage === 'inverted' ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            {isAnimating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Restoring Scale via S⁻¹...</span>
              </>
            ) : currentStage === 'inverted' ? (
              <>
                <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                <span>Restored to 1× via S⁻¹!</span>
              </>
            ) : (
              <>
                <Undo2 size={18} />
                <span>Apply Inverse: Restore 1× Scale (S⁻¹)</span>
              </>
            )}
          </button>

          {/* Re-apply zoom S button */}
          {currentStage === 'inverted' && (
            <button
              type="button"
              onClick={handleReapplyZoom}
              className="stepper-mini-btn"
              style={{
                padding: '0.65rem 1.1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <RefreshCw size={15} />
              <span>Re-apply Zoom ({zoomFactorK.toFixed(2)}×)</span>
            </button>
          )}

          {/* Play Full Cycle button */}
          <button
            type="button"
            onClick={handlePlayCycle}
            className="stepper-mini-btn"
            style={{
              padding: '0.65rem 1.1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: isPlayingCycle ? 'rgba(56, 189, 248, 0.2)' : undefined,
              borderColor: isPlayingCycle ? 'var(--accent-cyan)' : undefined
            }}
          >
            {isPlayingCycle ? <Pause size={15} /> : <Play size={15} />}
            <span>{isPlayingCycle ? 'Playing Demonstration...' : 'Auto-Play Round-Trip Cycle'}</span>
          </button>

          {/* Current State Indicator */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Camera State:
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: currentStage === 'inverted' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : 'rgba(56, 189, 248, 0.15)',
              color: currentStage === 'inverted' ? '#10B981' : 'var(--accent-cyan)'
            }}>
              {currentStage === 'inverted' ? 'Restored Scale (1.00×)' : `Zoomed (${zoomFactorK.toFixed(2)}×)`}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAB WORKBENCH */}
      <div className="interactive-lab-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Zoom Slider, Matrices, Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. DYNAMIC ZOOM FACTOR SLIDER */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>Zoom Factor (k)</span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {zoomFactorK.toFixed(2)}×
              </span>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="range"
                  min="0.2"
                  max="3.5"
                  step="0.05"
                  value={zoomFactorK}
                  onChange={(e) => handleSliderChange(e.target.value)}
                  className="styled-slider"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue(-0.1)}>-0.1×</button>
                <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue(0.1)}>+0.1×</button>
                <button type="button" className="stepper-mini-btn" onClick={() => handleSliderChange(0.5)}>0.5× (Half)</button>
                <button type="button" className="stepper-mini-btn" onClick={() => handleSliderChange(2.0)}>2.0× (Double)</button>
                <button type="button" className="stepper-mini-btn" onClick={() => handleSliderChange(1.0)} style={{ marginLeft: 'auto' }}>Reset (1.0×)</button>
              </div>
            </div>

            {/* Quick Math Factor Metrics */}
            <div style={{
              marginTop: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.65rem'
            }}>
              <div className="stat-pill" style={{ flexDirection: 'column', alignItems: 'center', padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                <span className="stat-pill-label" style={{ fontSize: '0.7rem' }}>Linear Scale (k)</span>
                <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {zoomFactorK.toFixed(2)}×
                </span>
              </div>
              <div className="stat-pill" style={{ flexDirection: 'column', alignItems: 'center', padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                <span className="stat-pill-label" style={{ fontSize: '0.7rem' }}>Inverse Factor (1/k)</span>
                <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981' }}>
                  {(1 / zoomFactorK).toFixed(2)}×
                </span>
              </div>
              <div className="stat-pill" style={{ flexDirection: 'column', alignItems: 'center', padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                <span className="stat-pill-label" style={{ fontSize: '0.7rem' }}>Area Scale (k²)</span>
                <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                  {detS.toFixed(2)}×
                </span>
              </div>
            </div>
          </div>

          {/* 2. SIDE-BY-SIDE MATRICES: S and S^-1 */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>Scaling Matrix S vs Inverse S⁻¹</span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                S⁻¹·S = I
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              
              {/* Matrix S */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--accent-cyan)',
                borderRadius: '12px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Zoom Matrix S</strong>
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    det(S) = k² = {detS.toFixed(2)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.15rem'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    borderLeft: '2.5px solid var(--accent-cyan)',
                    borderRight: '2.5px solid var(--accent-cyan)',
                    borderRadius: '5px',
                    padding: '0.2rem 0.85rem',
                    gap: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{matrixS.a.toFixed(2)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>0.00</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>0.00</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{matrixS.d.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Forward Zoom: <code>[x', y'] = [k·x, k·y]</code>
                </div>
              </div>

              {/* Inverse Matrix S^-1 */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1.5px solid #10B981',
                borderRadius: '12px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#10B981' }}>Inverse Matrix S⁻¹</strong>
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    det(S⁻¹) = 1/k² = {detInvS.toFixed(2)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.15rem'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    borderLeft: '2.5px solid #10B981',
                    borderRight: '2.5px solid #10B981',
                    borderRadius: '5px',
                    padding: '0.2rem 0.85rem',
                    gap: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{inverseS.a.toFixed(2)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>0.00</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>0.00</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{inverseS.d.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Reverse Zoom: <code>[x, y] = [(1/k)·x', (1/k)·y']</code>
                </div>
              </div>
            </div>

            {/* Product Identity Verification Box */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div style={{ color: '#10B981', fontWeight: 800 }}>
                Verification: S⁻¹ · S = [ (1/k)·k  0 ; 0  (1/k)·k ] = [ 1  0 ; 0  1 ] = I
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Numerical: [ {identityProduct.a.toFixed(2)}  {identityProduct.b.toFixed(2)} ; {identityProduct.c.toFixed(2)}  {identityProduct.d.toFixed(2)} ] = Identity Matrix
              </div>
            </div>
          </div>

          {/* 3. ZOOM PRESETS */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>Zoom Factor Presets</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click to Load</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.65rem',
              marginTop: '0.85rem'
            }}>
              {ZOOM_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`preset-card-btn ${isSelected ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.65rem 0.75rem',
                      background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-primary)',
                      border: isSelected ? `1.5px solid ${preset.color}` : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {preset.name}
                      </span>
                      <Icon size={14} style={{ color: preset.color }} />
                    </div>
                    <span 
                      className="font-mono"
                      style={{ 
                        fontSize: '0.7rem', 
                        color: preset.color, 
                        fontWeight: 700,
                        background: `${preset.color}15`,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px'
                      }}
                    >
                      {preset.badge}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.25 }}>
                      {preset.desc.split('.')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. SUBJECT SELECTOR & PHOTO UPLOAD */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={16} style={{ color: 'var(--accent-green)' }} />
                <span>Image Subject</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inspect Zoom Details</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`sub-chapter-pill ${subjectType === 'rocket' ? 'active' : ''}`}
                onClick={() => setSubjectType('rocket')}
              >
                <span>🚀 Rocket (Default)</span>
              </button>
              <button
                type="button"
                className={`sub-chapter-pill ${subjectType === 'portrait' ? 'active' : ''}`}
                onClick={() => setSubjectType('portrait')}
              >
                <span>👤 Portrait Face</span>
              </button>
              <button
                type="button"
                className={`sub-chapter-pill ${subjectType === 'geometry' ? 'active' : ''}`}
                onClick={() => setSubjectType('geometry')}
              >
                <span>🔲 Grid &amp; 'R'</span>
              </button>
              <button
                type="button"
                className={`sub-chapter-pill ${subjectType === 'macro' ? 'active' : ''}`}
                onClick={() => setSubjectType('macro')}
              >
                <Cpu size={13} />
                <span>Microchip Core</span>
              </button>
              <button
                type="button"
                className={`sub-chapter-pill ${subjectType === 'custom' ? 'active' : ''}`}
                onClick={() => {
                  if (customImage) {
                    setSubjectType('custom');
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload size={13} />
                <span>{customImage ? 'Custom Photo' : 'Upload Photo'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {customImagePreview && (
              <div style={{ 
                marginTop: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem', 
                background: 'var(--bg-primary)', 
                borderRadius: '10px', 
                border: subjectType === 'custom' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img 
                    src={customImagePreview} 
                    alt="Custom preview" 
                    style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <strong>{subjectType === 'custom' ? 'Custom Photo Active' : 'Uploaded Photo in Storage'}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {subjectType === 'custom' 
                        ? 'Scaling matrix S and inverse S⁻¹ apply to your photo' 
                        : 'Click "Custom Photo" to switch back, or "Remove" to delete'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {subjectType !== 'custom' && (
                    <button
                      type="button"
                      onClick={() => setSubjectType('custom')}
                      className="stepper-mini-btn"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: 'var(--accent-cyan)' }}
                    >
                      Use Photo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearCustomImage}
                    className="stepper-mini-btn"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    title="Remove uploaded photo"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Coordinate & Zoom Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <CoordinateTransformCanvas
            matrix2x2={effectiveMatrix}
            subjectType={subjectType}
            customImage={customImage}
            showImage={true}
            showParallelogram={true}
            showBasisVectors={true}
            showGhostOutline={true}
            showGrid={true}
            showOrientationArc={false}
            title={
              isAnimating 
                ? "Applying Inverse Zoom: x = S⁻¹x′ (Animating...)" 
                : currentStage === 'inverted' 
                  ? "Original 1.00× Scale Restored via S⁻¹" 
                  : `Zoomed Image: x′ = Sx (${zoomFactorK.toFixed(2)}× Scale)`
            }
            subtitle={
              currentStage === 'inverted'
                ? "Scale restored! S⁻¹ · S = I (Identity)"
                : `Coordinates scaled by ${zoomFactorK.toFixed(2)}× (Area scaled by ${(detS).toFixed(2)}×)`
            }
          />

          {/* EDUCATIONAL THEORY ACCORDION */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={18} style={{ color: 'var(--accent-cyan)' }} />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Mathematical Theory: Why S⁻¹ Cancels Zoom
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <div>
                <strong>1. Uniform Scaling Geometry:</strong>
                A uniform zoom matrix <code>S = [k 0; 0 k]</code> scales every coordinate vector equally:
                <code>[x', y']ᵀ = [k·x, k·y]ᵀ</code>. Because both axes are scaled identically, the image retains its aspect ratio without shearing or angular distortion.
              </div>

              <div>
                <strong>2. The Reciprocal Diagonal:</strong>
                Inverting a diagonal matrix simply inverts each diagonal entry:
                <code>S⁻¹ = [1/k 0; 0 1/k]</code>.
                When you zoom in 2× (<code>k = 2</code>), applying <code>S⁻¹</code> multiplies each coordinate by <code>½</code>. 
                When you zoom out to half size (<code>k = 0.5</code>), applying <code>S⁻¹</code> multiplies each coordinate by <code>2</code>.
              </div>

              <div>
                <strong>3. Area Invariance of Inverse Round-Trip:</strong>
                The determinant represents the area scaling factor: <code>det(S) = k²</code>. 
                Its inverse has determinant <code>det(S⁻¹) = 1 / k²</code>. 
                Multiplying them together yields <code>det(S⁻¹) · det(S) = (1/k²) · k² = 1</code>! 
                This guarantees that applying the inverse scaling matrix restores both the exact spatial dimensions and the exact 2D pixel area of the original image.
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
