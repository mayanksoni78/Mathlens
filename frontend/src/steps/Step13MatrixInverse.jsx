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
  FlipHorizontal,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Sliders,
  Info,
  Compass,
  CheckCircle2,
  Layers,
  ArrowRight,
  Undo2,
  Play,
  Pause,
  RefreshCw,
  Grid,
  ZoomIn
} from 'lucide-react';
import { 
  computeDeterminant, 
  getDeterminantAnalysis, 
  computeInverseMatrix, 
  multiply2x2,
  interpolateMatrix 
} from '../core/transformEngine';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';

// Curated presets specifically designed for matrix inversion exploration
const INVERSE_PRESETS = [
  {
    id: 'user_stretch',
    name: 'Horizontal Stretch',
    badge: 'Classic Example',
    matrixA: { a: 2.0, b: 0.0, c: 0.0, d: 1.0 },
    icon: Maximize2,
    color: '#3B82F6',
    desc: 'A=[2 0; 0 1] stretches horizontally. A⁻¹=[0.5 0; 0 1] compresses it back.'
  },
  {
    id: 'vertical_stretch',
    name: 'Vertical Stretch',
    badge: 'Scale Y',
    matrixA: { a: 1.0, b: 0.0, c: 0.0, d: 1.8 },
    icon: Maximize2,
    color: '#06B6D4',
    desc: 'A=[1 0; 0 1.8] elongates vertically. A⁻¹=[1 0; 0 0.56] restores original height.'
  },
  {
    id: 'rotation_45',
    name: 'Rotation (+45°)',
    badge: 'Orthogonal',
    matrixA: { a: 0.71, b: -0.71, c: 0.71, d: 0.71 },
    icon: Compass,
    color: '#10B981',
    desc: 'Rotates by +45°. Inverse rotates by -45° (R⁻¹ = Rᵀ).'
  },
  {
    id: 'shear_x',
    name: 'Horizontal Shear',
    badge: 'Tilt Geometry',
    matrixA: { a: 1.0, b: 1.0, c: 0.0, d: 1.0 },
    icon: Grid,
    color: '#8B5CF6',
    desc: 'A=[1 1; 0 1] shears space to the right. A⁻¹=[1 -1; 0 1] un-skews it to the left.'
  },
  {
    id: 'mirror_flip',
    name: 'Horizontal Mirror',
    badge: 'Self-Inverse (A²=I)',
    matrixA: { a: -1.0, b: 0.0, c: 0.0, d: 1.0 },
    icon: FlipHorizontal,
    color: '#EC4899',
    desc: 'A flips left and right. Inverting a mirror reflection means mirroring again (A⁻¹ = A)!'
  },
  {
    id: 'general_affine',
    name: 'General Matrix',
    badge: 'Combined Scale+Shear',
    matrixA: { a: 1.2, b: 0.4, c: -0.3, d: 1.1 },
    icon: Sparkles,
    color: '#F59E0B',
    desc: 'Combined scaling and shearing. Analytical inverse restores exact pixel coordinates.'
  },
  {
    id: 'singular_collapse',
    name: 'Singular (det=0)',
    badge: '⚠️ Cannot Invert',
    matrixA: { a: 1.0, b: 1.0, c: 1.0, d: 1.0 },
    icon: AlertTriangle,
    color: '#EF4444',
    desc: 'det(A)=0: Squashes 2D image into 1D line. A⁻¹ DOES NOT EXIST (division by zero)!'
  }
];

const IDENTITY_MATRIX = { a: 1.0, b: 0.0, c: 0.0, d: 1.0 };

export default function Step13MatrixInverse({ onSelectStep }) {
  // Matrix A definition
  const [matrixA, setMatrixA] = useState({ a: 2.0, b: 0.0, c: 0.0, d: 1.0 });
  const [activePreset, setActivePreset] = useState('user_stretch');

  // Transformation Stage:
  // 'original': Showing original geometry (Identity I)
  // 'transformed': Showing deformed geometry (Matrix A)
  // 'inverted': After applying inverse A^-1 (returns to original!)
  const [currentStage, setCurrentStage] = useState('transformed');

  // Animation interpolation state (0 = transformed A, 1 = inverted / restored I)
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0); // 0 to 1
  const animFrameRef = useRef(null);

  // Visualization subject
  const [subjectType, setSubjectType] = useState('portrait'); // 'portrait' | 'geometry' | 'rocket' | 'custom'
  const [customImage, setCustomImage] = useState(null);
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Determinant and Inverse Calculation
  const detA = computeDeterminant(matrixA);
  const inverseA = useMemo(() => computeInverseMatrix(matrixA), [matrixA]);
  const isSingular = !inverseA;

  // Identity product verification: A^-1 * A
  const identityProduct = useMemo(() => {
    if (!inverseA) return null;
    return multiply2x2(inverseA, matrixA);
  }, [inverseA, matrixA]);

  // Current effective matrix displayed on the canvas
  const effectiveMatrix = useMemo(() => {
    if (isAnimating) {
      // Interpolate from matrixA (at t=0) to Identity (at t=1)
      return interpolateMatrix(matrixA, IDENTITY_MATRIX, animProgress);
    }
    if (currentStage === 'original') return IDENTITY_MATRIX;
    if (currentStage === 'inverted') return IDENTITY_MATRIX;
    return matrixA; // 'transformed'
  }, [currentStage, matrixA, isAnimating, animProgress]);

  // Sliders handler
  const handleSliderChange = (key, value) => {
    const num = parseFloat(value);
    setMatrixA(prev => ({ ...prev, [key]: num }));
    setActivePreset(null);
    setCurrentStage('transformed');
  };

  const handleStepValue = (key, delta) => {
    setMatrixA(prev => {
      const nextVal = Math.round((prev[key] + delta) * 100) / 100;
      return { ...prev, [key]: nextVal };
    });
    setActivePreset(null);
    setCurrentStage('transformed');
  };

  const handleApplyPreset = (preset) => {
    setMatrixA(preset.matrixA);
    setActivePreset(preset.id);
    setCurrentStage('transformed');
    setAnimProgress(0);
    setIsAnimating(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  // Animated "Undo Using Inverse" execution
  const handleUndoUsingInverse = () => {
    if (isSingular) return;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(true);
    setAnimProgress(0);

    const startTime = performance.now();
    const duration = 900; // 900ms smooth undo transition

    const stepAnimation = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Smooth cubic ease-in-out curve
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

  // Re-apply forward transformation A
  const handleReapplyTransform = () => {
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

      // Reverse interpolation from Identity back to A
      setAnimProgress(1 - eased);

      if (progress < 1.0) {
        animFrameRef.current = requestAnimationFrame(stepAnimation);
      } else {
        setIsAnimating(false);
        setCurrentStage('transformed');
      }
    };

    animFrameRef.current = requestAnimationFrame(stepAnimation);
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

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
            <span className="modal-badge-tag" style={{ margin: 0, background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)', borderColor: 'rgba(139, 92, 246, 0.35)' }}>
              Chapter 8.6
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Reversible Geometry &amp; Inversion: x = A⁻¹x′
            </span>
          </div>

          {/* Sub-Chapter Switcher with all 6 sub-chapters */}
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
              className="sub-chapter-pill active"
              title="Current: 8.6 Matrix Inverse: Undo the Transformation"
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
          8.6 Matrix Inverse: Undo the Transformation
        </h2>
        <p className="step-description">
          First transform an image using <code>x′ = Ax</code> where <strong>A</strong> can be any linear operation: 
          horizontal stretch, rotation, shearing, or mirror reflection. Then click <strong>Undo Using Inverse (A⁻¹)</strong>. 
          If the inverse matrix <code>A⁻¹</code> exists (<code>det(A) ≠ 0</code>), applying <code>x = A⁻¹x′</code> 
          perfectly returns the image geometry to its original position and shape!
        </p>

        {/* 3-STAGE TRANSFORMATION FLOW BAR */}
        <div style={{
          marginTop: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Stage 1: Original */}
          <div 
            onClick={() => { setCurrentStage('original'); setIsAnimating(false); }}
            style={{
              padding: '0.85rem 1rem',
              background: currentStage === 'original' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-secondary)',
              border: currentStage === 'original' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                1. Original Geometry
              </span>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                I = [1 0; 0 1]
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Undeformed original coordinate space x
            </span>
          </div>

          {/* Stage 2: Transformed x' = Ax */}
          <div 
            onClick={() => { setCurrentStage('transformed'); setIsAnimating(false); }}
            style={{
              padding: '0.85rem 1rem',
              background: currentStage === 'transformed' ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-secondary)',
              border: currentStage === 'transformed' ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                2. Forward Transform
              </span>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                x′ = Ax
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Stretched, tilted, or mirrored by matrix A
            </span>
          </div>

          {/* Stage 3: Undo via A^-1 */}
          <div 
            onClick={() => { if (!isSingular) handleUndoUsingInverse(); }}
            style={{
              padding: '0.85rem 1rem',
              background: currentStage === 'inverted' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
              border: currentStage === 'inverted' ? '1.5px solid var(--accent-green)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              cursor: isSingular ? 'not-allowed' : 'pointer',
              opacity: isSingular ? 0.6 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSingular ? '#EF4444' : 'var(--accent-green)' }}>
                3. Restored Geometry
              </span>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: isSingular ? '#EF4444' : 'var(--accent-green)' }}>
                x = A⁻¹x′
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {isSingular ? 'det(A)=0: Cannot invert!' : 'Inverse A⁻¹ returns image to original shape'}
            </span>
          </div>
        </div>

        {/* HERO ACTION ROW: UNDO USING INVERSE BUTTON */}
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
          {/* THE BIG "UNDO USING INVERSE" BUTTON */}
          <button
            type="button"
            disabled={isSingular || isAnimating || currentStage === 'inverted'}
            onClick={handleUndoUsingInverse}
            className="action-btn"
            style={{
              padding: '0.75rem 1.6rem',
              background: isSingular 
                ? 'rgba(239, 68, 68, 0.12)' 
                : currentStage === 'inverted'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              color: isSingular ? '#EF4444' : '#FFFFFF',
              border: isSingular ? '1px solid #EF4444' : 'none',
              borderRadius: '12px',
              fontSize: '0.98rem',
              fontWeight: 800,
              cursor: isSingular || isAnimating || currentStage === 'inverted' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              boxShadow: isSingular ? 'none' : '0 8px 20px rgba(139, 92, 246, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            {isSingular ? (
              <>
                <AlertTriangle size={18} />
                <span>Cannot Undo (det(A) = 0)</span>
              </>
            ) : isAnimating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Applying A⁻¹...</span>
              </>
            ) : currentStage === 'inverted' ? (
              <>
                <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                <span>Undone! Restored via A⁻¹</span>
              </>
            ) : (
              <>
                <Undo2 size={18} />
                <span>Undo Using Inverse (A⁻¹)</span>
              </>
            )}
          </button>

          {/* Re-apply forward transform button */}
          {currentStage === 'inverted' && (
            <button
              type="button"
              onClick={handleReapplyTransform}
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
              <span>Re-apply Forward Transform A</span>
            </button>
          )}

          {/* Live Status readout */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Current State:
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: currentStage === 'inverted' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : currentStage === 'original'
                  ? 'rgba(56, 189, 248, 0.15)'
                  : 'rgba(168, 85, 247, 0.15)',
              color: currentStage === 'inverted' 
                ? '#10B981' 
                : currentStage === 'original'
                  ? 'var(--accent-cyan)'
                  : 'var(--accent-purple)'
            }}>
              {currentStage === 'inverted' ? 'Restored (x = A⁻¹x′)' : currentStage === 'original' ? 'Original (I)' : 'Transformed (x′ = Ax)'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAB WORKBENCH */}
      <div className="interactive-lab-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Matrices Side-by-Side, Presets, Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. SIDE-BY-SIDE MATRICES: FORWARD A vs INVERSE A^-1 */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>Transformation A and Inverse A⁻¹</span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                A⁻¹·A = I
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              
              {/* Box 1: Matrix A */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--accent-purple)',
                borderRadius: '12px',
                padding: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--accent-purple)' }}>Forward Matrix A</strong>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    det(A) = {detA.toFixed(2)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    borderLeft: '2.5px solid var(--accent-purple)',
                    borderRight: '2.5px solid var(--accent-purple)',
                    borderRadius: '5px',
                    padding: '0.2rem 0.75rem',
                    gap: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{matrixA.a.toFixed(2)}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{matrixA.c.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{matrixA.b.toFixed(2)}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{matrixA.d.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Maps point <code>[x, y]ᵀ</code> to <code>[x', y']ᵀ</code>
                </div>
              </div>

              {/* Box 2: Inverse Matrix A^-1 */}
              <div style={{
                background: 'var(--bg-primary)',
                border: isSingular ? '1.5px solid #EF4444' : '1.5px solid var(--accent-green)',
                borderRadius: '12px',
                padding: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.88rem', color: isSingular ? '#EF4444' : 'var(--accent-green)' }}>
                    Inverse Matrix A⁻¹
                  </strong>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: isSingular ? '#EF4444' : 'var(--text-secondary)' }}>
                    {isSingular ? 'Non-Invertible' : `1/det = ${(1 / detA).toFixed(2)}`}
                  </span>
                </div>

                {isSingular ? (
                  <div style={{
                    padding: '0.85rem 0.5rem',
                    textAlign: 'center',
                    color: '#EF4444',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem'
                  }}>
                    <span>⚠️ A⁻¹ DOES NOT EXIST</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      det(A) = 0 causes division by zero: 1 / 0
                    </span>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.1rem'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      borderLeft: '2.5px solid var(--accent-green)',
                      borderRight: '2.5px solid var(--accent-green)',
                      borderRadius: '5px',
                      padding: '0.2rem 0.75rem',
                      gap: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inverseA.a.toFixed(2)}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inverseA.c.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inverseA.b.toFixed(2)}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inverseA.d.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {isSingular ? 'Geometry collapsed; cannot be restored' : 'Maps point [x\', y\']ᵀ back to [x, y]ᵀ'}
                </div>
              </div>
            </div>

            {/* Formula Breakdown Card */}
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}>
              <div>
                <strong>Inverse Formula:</strong> A⁻¹ = (1 / (ad − bc)) · [ d  −b; −c  a ]
              </div>
              {!isSingular && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  Calculation: (1 / {detA.toFixed(2)}) · [ {matrixA.d.toFixed(2)}  {(-matrixA.b).toFixed(2)}; {(-matrixA.c).toFixed(2)}  {matrixA.a.toFixed(2)} ]
                </div>
              )}
              {identityProduct && (
                <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '0.78rem' }}>
                  Verification: A⁻¹ · A = [ {identityProduct.a.toFixed(2)}  {identityProduct.b.toFixed(2)}; {identityProduct.c.toFixed(2)}  {identityProduct.d.toFixed(2)} ] = I
                </div>
              )}
            </div>
          </div>

          {/* 2. MATRIX SLIDERS FOR A */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>Adjust Matrix A Elements</span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Live Inversion Recalculation
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {/* Slider a */}
              <div className="matrix-slider-card">
                <div className="matrix-slider-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="matrix-cell-key">a</span>
                    <span className="matrix-cell-subtext">A₁₁ (Scale X)</span>
                  </div>
                  <div className="matrix-slider-val-box">
                    <span className="font-mono">{matrixA.a.toFixed(2)}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-2.5"
                  max="2.5"
                  step="0.05"
                  value={matrixA.a}
                  onChange={(e) => handleSliderChange('a', e.target.value)}
                  className="styled-slider"
                />
                <div className="matrix-slider-actions">
                  <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue('a', -0.1)}>-0.1</button>
                  <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue('a', 0.1)}>+0.1</button>
                  <button type="button" className="stepper-mini-btn" onClick={() => handleSliderChange('a', 1.0)} style={{ marginLeft: 'auto' }}>Reset (1)</button>
                </div>
              </div>

              {/* Slider b */}
              <div className="matrix-slider-card">
                <div className="matrix-slider-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="matrix-cell-key">b</span>
                    <span className="matrix-cell-subtext">A₁₂ (Shear X)</span>
                  </div>
                  <div className="matrix-slider-val-box">
                    <span className="font-mono">{matrixA.b.toFixed(2)}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-2.5"
                  max="2.5"
                  step="0.05"
                  value={matrixA.b}
                  onChange={(e) => handleSliderChange('b', e.target.value)}
                  className="styled-slider"
                />
                <div className="matrix-slider-actions">
                  <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue('b', -0.1)}>-0.1</button>
                  <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue('b', 0.1)}>+0.1</button>
                  <button type="button" className="stepper-mini-btn" onClick={() => handleSliderChange('b', 0.0)} style={{ marginLeft: 'auto' }}>Reset (0)</button>
                </div>
              </div>

              {/* Slider c */}
              <div className="matrix-slider-card">
                <div className="matrix-slider-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="matrix-cell-key">c</span>
                    <span className="matrix-cell-subtext">A₂₁ (Shear Y)</span>
                  </div>
                  <div className="matrix-slider-val-box">
                    <span className="font-mono">{matrixA.c.toFixed(2)}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-2.5"
                  max="2.5"
                  step="0.05"
                  value={matrixA.c}
                  onChange={(e) => handleSliderChange('c', e.target.value)}
                  className="styled-slider"
                />
                <div className="matrix-slider-actions">
                  <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue('c', -0.1)}>-0.1</button>
                  <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue('c', 0.1)}>+0.1</button>
                  <button type="button" className="stepper-mini-btn" onClick={() => handleSliderChange('c', 0.0)} style={{ marginLeft: 'auto' }}>Reset (0)</button>
                </div>
              </div>

              {/* Slider d */}
              <div className="matrix-slider-card">
                <div className="matrix-slider-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="matrix-cell-key">d</span>
                    <span className="matrix-cell-subtext">A₂₂ (Scale Y)</span>
                  </div>
                  <div className="matrix-slider-val-box">
                    <span className="font-mono">{matrixA.d.toFixed(2)}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-2.5"
                  max="2.5"
                  step="0.05"
                  value={matrixA.d}
                  onChange={(e) => handleSliderChange('d', e.target.value)}
                  className="styled-slider"
                />
                <div className="matrix-slider-actions">
                  <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue('d', -0.1)}>-0.1</button>
                  <button type="button" className="stepper-mini-btn" onClick={() => handleStepValue('d', 0.1)}>+0.1</button>
                  <button type="button" className="stepper-mini-btn" onClick={() => handleSliderChange('d', 1.0)} style={{ marginLeft: 'auto' }}>Reset (1)</button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PRESETS GALLERY */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>Inversion Presets</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click to Test</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '0.65rem',
              marginTop: '0.85rem'
            }}>
              {INVERSE_PRESETS.map((preset) => {
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
                        fontSize: '0.72rem', 
                        color: preset.color, 
                        fontWeight: 700,
                        background: `${preset.color}15`,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px'
                      }}
                    >
                      {preset.badge}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.25 }}>
                      {preset.desc.split(':')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. SUBJECT SELECTOR & UPLOAD */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={16} style={{ color: 'var(--accent-green)' }} />
                <span>Image Subject</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Choose What to Transform</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
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
                <span>🔲 Grid &amp; Letter 'R'</span>
              </button>
              <button
                type="button"
                className={`sub-chapter-pill ${subjectType === 'rocket' ? 'active' : ''}`}
                onClick={() => setSubjectType('rocket')}
              >
                <span>🚀 Space Rocket</span>
              </button>
              <button
                type="button"
                className={`sub-chapter-pill ${subjectType === 'custom' ? 'active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={13} />
                <span>Upload Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {customImagePreview && subjectType === 'custom' && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <img 
                  src={customImagePreview} 
                  alt="Custom preview" 
                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  <strong>Custom Photo Active</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Undergoing forward &amp; inverse transformation</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Transformation & Inversion Canvas */}
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
            showOrientationArc={true}
            title={
              isAnimating 
                ? "Applying Inverse: x = A⁻¹x′ (Animating...)" 
                : currentStage === 'inverted' 
                  ? "Restored Geometry: x = A⁻¹x′ (Identity Shape)" 
                  : "Forward Transformed: x′ = Ax"
            }
            subtitle={
              isSingular 
                ? "Singular Matrix: No Inverse" 
                : currentStage === 'inverted'
                  ? "Undone! Original geometry successfully restored"
                  : "Click 'Undo Using Inverse' to reverse this deformation"
            }
          />

          {/* EDUCATIONAL CASE SUMMARY */}
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
              <Compass size={18} style={{ color: 'var(--accent-purple)' }} />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                How Matrix Inversion Works: The Undo Mechanism
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <div>
                <strong>1. The Algebraic Meaning:</strong> If matrix <code>A</code> mapped the coordinates via <code>x′ = Ax</code>, 
                then multiplying both sides by <code>A⁻¹</code> yields <code>A⁻¹x′ = A⁻¹Ax = Ix = x</code>. 
                Applying <code>A⁻¹</code> to every transformed pixel mathematically pulls each coordinate back to its original location!
              </div>

              <div>
                <strong>2. The User Example [2 0; 0 1]:</strong>
                The matrix <code>A = [2 0; 0 1]</code> stretches every point horizontally by factor 2 (<code>x′ = 2x, y′ = y</code>). 
                Its inverse is <code>A⁻¹ = [0.5 0; 0 1]</code>, which scales the X-coordinate by <code>0.5</code> (<code>x = 0.5x′</code>), 
                precisely cancelling the stretch and returning the image to its pristine original proportions!
              </div>

              <div>
                <strong>3. Why det(A) = 0 Cannot Be Undone:</strong>
                Notice the term <code>1 / det(A)</code> in the inverse formula. When <code>det(A) = 0</code>, 
                the determinant is in the denominator, resulting in an undefined division by zero. 
                Geometrically, collapsing 2D space onto a 1D line squashes infinitely many pixels onto the same point. 
                Because multiple inputs produced the same output, there is no single-valued inverse function to recover the lost coordinates!
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
