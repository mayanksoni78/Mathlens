import React, { useState, useMemo, useRef } from 'react';
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
  TrendingDown,
  Grid,
  Undo2,
  ZoomIn
} from 'lucide-react';
import { computeDeterminant, getDeterminantAnalysis } from '../core/transformEngine';
import CoordinateTransformCanvas from '../components/visualizers/CoordinateTransformCanvas';

// Curated presets specifically demonstrating the 4 core cases requested
const DETERMINANT_PRESETS = [
  {
    id: 'stretch',
    name: 'Area Stretch',
    badge: '|det| > 1',
    matrix: { a: 1.5, b: 0.0, c: 0.0, d: 1.5 },
    category: 'stretch',
    icon: Maximize2,
    color: '#3B82F6',
    desc: 'Uniform expansion: det = 2.25. Transformed area is 225% of original.'
  },
  {
    id: 'shrink',
    name: 'Area Shrink',
    badge: '0 < |det| < 1',
    matrix: { a: 0.6, b: 0.0, c: 0.0, d: 0.6 },
    category: 'shrink',
    icon: Minimize2,
    color: '#F59E0B',
    desc: 'Uniform compression: det = 0.36. Transformed area shrinks down to 36%.'
  },
  {
    id: 'collapse_line',
    name: 'Dimension Collapse',
    badge: 'det = 0',
    matrix: { a: 1.0, b: 1.0, c: 1.0, d: 1.0 },
    category: 'collapse',
    icon: AlertTriangle,
    color: '#EF4444',
    desc: 'Colinear columns: det = 0.00. 2D geometry squashes onto the 1D line y = x.'
  },
  {
    id: 'collapse_axis',
    name: 'Axis Collapse',
    badge: 'det = 0',
    matrix: { a: 1.2, b: 0.0, c: 0.0, d: 0.0 },
    category: 'collapse',
    icon: TrendingDown,
    color: '#EF4444',
    desc: 'Projection: det = 0.00. Y-dimension is flattened completely onto the X-axis.'
  },
  {
    id: 'flip_mirror',
    name: 'Orientation Flip',
    badge: 'det < 0',
    matrix: { a: -1.0, b: 0.0, c: 0.0, d: 1.0 },
    category: 'flip',
    icon: FlipHorizontal,
    color: '#8B5CF6',
    desc: 'Horizontal mirror: det = -1.00. Area preserved (1.00×), but left and right flip!'
  },
  {
    id: 'flip_stretch',
    name: 'Flip + Stretch',
    badge: 'det < -1',
    matrix: { a: -1.4, b: 0.2, c: 0.3, d: 1.2 },
    category: 'flip',
    icon: Maximize2,
    color: '#A855F7',
    desc: 'Reflected and enlarged: det = -1.74. Orientation reversed with 174% area scaling.'
  },
  {
    id: 'shear_preserve',
    name: 'Pure Shear',
    badge: 'det = 1.00',
    matrix: { a: 1.0, b: 0.8, c: 0.0, d: 1.0 },
    category: 'preserve',
    icon: Grid,
    color: '#10B981',
    desc: 'Skewed geometry: det = 1.00. Shapes tilt, but total area remains invariant.'
  },
  {
    id: 'rotation_45',
    name: 'Rotation 45°',
    badge: 'det = 1.00',
    matrix: { a: 0.71, b: -0.71, c: 0.71, d: 0.71 },
    category: 'preserve',
    icon: Compass,
    color: '#06B6D4',
    desc: 'Rigid rotation: det = 1.00. Isometry preserving both distances and orientation.'
  },
  {
    id: 'identity',
    name: 'Identity (Reset)',
    badge: 'det = 1.00',
    matrix: { a: 1.0, b: 0.0, c: 0.0, d: 1.0 },
    category: 'preserve',
    icon: RotateCcw,
    color: 'var(--text-secondary)',
    desc: 'Unaltered standard basis: i = [1, 0]^T and j = [0, 1]^T.'
  }
];

export default function Step12DeterminantVisualizer({ onSelectStep }) {
  // 2x2 matrix state
  const [matrix, setMatrix] = useState({ a: 1.5, b: 0.0, c: 0.0, d: 1.5 });
  const [activePreset, setActivePreset] = useState('stretch');

  // Visualization options
  const [subjectType, setSubjectType] = useState('portrait'); // 'portrait' | 'geometry' | 'rocket' | 'custom'
  const [customImage, setCustomImage] = useState(null);
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Layer visibility toggles
  const [showImage, setShowImage] = useState(true);
  const [showParallelogram, setShowParallelogram] = useState(true);
  const [showBasisVectors, setShowBasisVectors] = useState(true);
  const [showGhostOutline, setShowGhostOutline] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showOrientationArc, setShowOrientationArc] = useState(true);

  // Inspector coordinate hover state
  const [hoverCoords, setHoverCoords] = useState(null);

  // Real-time determinant calculation
  const rawDet = computeDeterminant(matrix);
  const detAnalysis = getDeterminantAnalysis(rawDet);

  // Sliders handler
  const handleSliderChange = (key, value) => {
    const num = parseFloat(value);
    setMatrix(prev => ({ ...prev, [key]: num }));
    setActivePreset(null);
  };

  const handleStepValue = (key, delta) => {
    setMatrix(prev => {
      const nextVal = Math.round((prev[key] + delta) * 100) / 100;
      return { ...prev, [key]: nextVal };
    });
    setActivePreset(null);
  };

  const handleApplyPreset = (preset) => {
    setMatrix(preset.matrix);
    setActivePreset(preset.id);
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

  // Render individual matrix entry control
  const renderEntryControl = (key, label, coordLabel) => {
    const val = matrix[key];
    return (
      <div className="matrix-slider-card" key={key}>
        <div className="matrix-slider-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="matrix-cell-key">{key}</span>
            <span className="matrix-cell-subtext">{coordLabel}</span>
          </div>
          <div className="matrix-slider-val-box">
            <span className="font-mono">{val.toFixed(2)}</span>
          </div>
        </div>

        <div className="matrix-slider-row">
          <input
            type="range"
            min="-2.5"
            max="2.5"
            step="0.05"
            value={val}
            onChange={(e) => handleSliderChange(key, e.target.value)}
            className="styled-slider"
          />
        </div>

        <div className="matrix-slider-actions">
          <button 
            type="button"
            className="stepper-mini-btn"
            onClick={() => handleStepValue(key, -0.1)}
            title="Decrease by 0.1"
          >
            -0.1
          </button>
          <button 
            type="button"
            className="stepper-mini-btn"
            onClick={() => handleStepValue(key, 0.1)}
            title="Increase by 0.1"
          >
            +0.1
          </button>
          <button 
            type="button"
            className="stepper-mini-btn"
            onClick={() => handleSliderChange(key, key === 'a' || key === 'd' ? 1.0 : 0.0)}
            title="Reset entry"
            style={{ marginLeft: 'auto' }}
          >
            Reset ({key === 'a' || key === 'd' ? '1' : '0'})
          </button>
        </div>
      </div>
    );
  };

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
              Chapter 8.5
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Spatial Transformations &amp; Area Geometry
            </span>
          </div>

          {/* Sub-Chapter Switcher with all 5 chapters */}
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
              className="sub-chapter-pill active"
              title="Current: 8.5 Determinant: Stretch, Shrink, Flip or Collapse"
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
          8.5 Determinant: Stretch, Shrink, Flip or Collapse?
        </h2>
        <p className="step-description">
          Transform an image using <code>x′ = Ax</code> with matrix <code>A = [a b; c d]</code>. 
          The determinant <code>det(A) = ad − bc</code> is not merely a numerical formula—it is a 
          <strong> visual measure of how linear transformations scale area and orient space</strong>. 
          Modify the sliders below to explore how <strong>|det(A)| &gt; 1</strong> stretches area, 
          <strong>0 &lt; |det(A)| &lt; 1</strong> compresses area, 
          <strong>det(A) = 0</strong> collapses 2D planar space into a line or point, 
          and <strong>det(A) &lt; 0</strong> flips orientation inside-out!
        </p>

        {/* REAL-TIME DETERMINANT FORMULA & STATUS HUD */}
        <div 
          className="determinant-hero-hud"
          style={{
            marginTop: '1.25rem',
            background: 'var(--bg-secondary)',
            border: `1.5px solid ${detAnalysis.borderColor}`,
            borderRadius: '16px',
            padding: '1.2rem 1.4rem',
            boxShadow: `0 12px 30px ${detAnalysis.bgColor}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top Row: Formula Breakdown & Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{
                background: detAnalysis.bgColor,
                color: detAnalysis.color,
                borderRadius: '10px',
                padding: '0.45rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                border: `1px solid ${detAnalysis.borderColor}`
              }}>
                <Sparkles size={16} />
                <span>{detAnalysis.label}</span>
              </div>

              {/* Dynamic Formula Display */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-secondary)' }}>det(A) =</span>
                <span>ad − bc =</span>
                <span style={{ color: 'var(--accent-purple)' }}>({matrix.a.toFixed(2)})({matrix.d.toFixed(2)})</span>
                <span>−</span>
                <span style={{ color: 'var(--accent-cyan)' }}>({matrix.b.toFixed(2)})({matrix.c.toFixed(2)})</span>
                <span>=</span>
                <strong style={{ fontSize: '1.35rem', color: detAnalysis.color, textShadow: `0 0 16px ${detAnalysis.color}40` }}>
                  {rawDet.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Quick Area and Orientation Pills */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div className="stat-pill" style={{ borderColor: 'var(--border-color)' }}>
                <span className="stat-pill-label">Area Factor:</span>
                <span className="stat-pill-val font-mono" style={{ color: detAnalysis.color }}>
                  {Math.abs(rawDet).toFixed(2)}×
                </span>
              </div>
              <div className="stat-pill" style={{ borderColor: 'var(--border-color)' }}>
                <span className="stat-pill-label">Chirality:</span>
                <span className="stat-pill-val font-mono" style={{ color: detAnalysis.orientationFlipped ? '#A855F7' : '#10B981' }}>
                  {detAnalysis.orientationFlipped ? 'Flipped (-)' : 'Standard (+)'}
                </span>
              </div>
            </div>
          </div>

          {/* Description of Current State */}
          <div style={{
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Info size={16} style={{ color: detAnalysis.color, flexShrink: 0 }} />
            <span>{detAnalysis.description}</span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAB WORKBENCH */}
      <div className="interactive-lab-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Controls, Presets, Image Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. MATRIX SLIDERS [a, b; c, d] */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>Matrix Elements A = [a b; c d]</span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                x' = a·x + b·y, y' = c·x + d·y
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {renderEntryControl('a', 'a (Scale X)', 'i\'_x component')}
              {renderEntryControl('b', 'b (Shear X)', 'j\'_x component')}
              {renderEntryControl('c', 'c (Shear Y)', 'i\'_y component')}
              {renderEntryControl('d', 'd (Scale Y)', 'j\'_y component')}
            </div>

            {/* Matrix Equation Mathematical Form Preview */}
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>A =</span>
                <div style={{
                  display: 'inline-flex',
                  borderLeft: '2px solid var(--text-primary)',
                  borderRight: '2px solid var(--text-primary)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  gap: '0.85rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ color: '#EC4899', fontWeight: 700 }}>{matrix.a.toFixed(2)}</span>
                    <span style={{ color: '#EC4899', fontWeight: 700 }}>{matrix.c.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{matrix.b.toFixed(2)}</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{matrix.d.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Basis <span style={{ color: '#EC4899', fontWeight: 700 }}>i'=[{matrix.a.toFixed(2)}, {matrix.c.toFixed(2)}]</span> &amp; <span style={{ color: '#10B981', fontWeight: 700 }}>j'=[{matrix.b.toFixed(2)}, {matrix.d.toFixed(2)}]</span>
              </div>
            </div>
          </div>

          {/* 2. CORE PHENOMENA PRESETS */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>Core Regimes &amp; Presets</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1-Click Scenarios</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
              gap: '0.65rem',
              marginTop: '0.85rem'
            }}>
              {DETERMINANT_PRESETS.map((preset) => {
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

          {/* 3. SUBJECT CHOOSER & PHOTO UPLOAD */}
          <div className="control-panel-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={16} style={{ color: 'var(--accent-green)' }} />
                <span>Image Subject</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transform Any Subject</span>
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

            {/* Custom Image Info if Loaded */}
            {customImagePreview && subjectType === 'custom' && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <img 
                  src={customImagePreview} 
                  alt="Custom uploaded preview" 
                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  <strong>Custom Image Active</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Currently transformed by matrix A</div>
                </div>
              </div>
            )}

            {/* Visual Layer Toggles */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.65rem',
              marginTop: '1rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showImage} 
                  onChange={(e) => setShowImage(e.target.checked)} 
                />
                <span>Show Transformed Image</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showParallelogram} 
                  onChange={(e) => setShowParallelogram(e.target.checked)} 
                />
                <span>Show det(A) Parallelogram</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showBasisVectors} 
                  onChange={(e) => setShowBasisVectors(e.target.checked)} 
                />
                <span>Show Basis Vectors (i', j')</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showGhostOutline} 
                  onChange={(e) => setShowGhostOutline(e.target.checked)} 
                />
                <span>Show Original Boundary</span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Transformation Canvas & Live Readouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <CoordinateTransformCanvas
            matrix2x2={matrix}
            subjectType={subjectType}
            customImage={customImage}
            showImage={showImage}
            showParallelogram={showParallelogram}
            showBasisVectors={showBasisVectors}
            showGhostOutline={showGhostOutline}
            showGrid={showGrid}
            showOrientationArc={showOrientationArc}
            title="Image Transformation: x' = Ax"
            subtitle="Hover to inspect point mapping"
            onHoverCoords={setHoverCoords}
          />

          {/* DYNAMIC CASE COMPARISON CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            
            {/* Case 1: Stretch */}
            <div 
              className={`case-callout-card ${Math.abs(rawDet) > 1.0001 ? 'active' : ''}`}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: Math.abs(rawDet) > 1.0001 ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary)',
                border: Math.abs(rawDet) > 1.0001 ? '1.5px solid #3B82F6' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Maximize2 size={16} style={{ color: '#3B82F6' }} />
                <strong style={{ fontSize: '0.85rem', color: '#3B82F6' }}>|det(A)| &gt; 1: Stretch</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Corresponds to an <strong>increase in 2D area</strong>. The transformation pulls coordinates outward, magnifying geometric features.
              </p>
            </div>

            {/* Case 2: Shrink */}
            <div 
              className={`case-callout-card ${Math.abs(rawDet) < 0.9999 && Math.abs(rawDet) > 0.0001 ? 'active' : ''}`}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: Math.abs(rawDet) < 0.9999 && Math.abs(rawDet) > 0.0001 ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-secondary)',
                border: Math.abs(rawDet) < 0.9999 && Math.abs(rawDet) > 0.0001 ? '1.5px solid #F59E0B' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Minimize2 size={16} style={{ color: '#F59E0B' }} />
                <strong style={{ fontSize: '0.85rem', color: '#F59E0B' }}>0 &lt; |det(A)| &lt; 1: Shrink</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Corresponds to a <strong>decrease in 2D area</strong>. Shapes compress inward, packing image pixels into a tighter footprint.
              </p>
            </div>

            {/* Case 3: Collapse */}
            <div 
              className={`case-callout-card ${Math.abs(rawDet) <= 0.0001 ? 'active' : ''}`}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: Math.abs(rawDet) <= 0.0001 ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-secondary)',
                border: Math.abs(rawDet) <= 0.0001 ? '1.5px solid #EF4444' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <AlertTriangle size={16} style={{ color: '#EF4444' }} />
                <strong style={{ fontSize: '0.85rem', color: '#EF4444' }}>det(A) = 0: Collapse</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                <strong>Dimensionality collapse!</strong> 2D geometry squashes into a 1D line or 0D point. Area is zero and inverse <code>A⁻¹</code> does not exist.
              </p>
            </div>

            {/* Case 4: Orientation Reversal (Flip) */}
            <div 
              className={`case-callout-card ${rawDet < -0.0001 ? 'active' : ''}`}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: rawDet < -0.0001 ? 'rgba(168, 85, 247, 0.14)' : 'var(--bg-secondary)',
                border: rawDet < -0.0001 ? '1.5px solid #A855F7' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <FlipHorizontal size={16} style={{ color: '#A855F7' }} />
                <strong style={{ fontSize: '0.85rem', color: '#A855F7' }}>det(A) &lt; 0: Flip (Chirality)</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                <strong>Orientation reversal!</strong> Space is turned inside-out like looking into a mirror. The counter-clockwise basis flips to clockwise.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* EDUCATIONAL THEORY ACCORDION */}
      <div className="theory-explainer-card" style={{ marginTop: '2rem' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Mathematical Intuition: The Determinant as an Area Scaling Factor</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          <div className="theory-sub-block">
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.92rem', marginBottom: '0.4rem' }}>
              1. Why det(A) = ad − bc measures Area
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Consider the unit square spanned by basis vectors <code>i = [1, 0]ᵀ</code> and <code>j = [0, 1]ᵀ</code> with area <code>1 × 1 = 1</code>. 
              The matrix maps these vectors to <code>i' = [a, c]ᵀ</code> and <code>j' = [b, d]ᵀ</code>. 
              By cross-product geometry, the area of the resulting parallelogram is exactly <code>|a·d − b·c|</code>! 
              Since any complex 2D image is built from infinitesimal square tiles, <strong>every tiny area element scales by |det(A)|</strong>.
            </p>
          </div>

          <div className="theory-sub-block">
            <h4 style={{ color: '#EF4444', fontSize: '0.92rem', marginBottom: '0.4rem' }}>
              2. The Geometry of Collapse: det(A) = 0
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              When <code>ad − bc = 0</code>, the two column vectors <code>[a, c]ᵀ</code> and <code>[b, d]ᵀ</code> are parallel (linearly dependent). 
              Instead of spanning a 2D surface, every pixel in the entire image is forced onto the 1D line defined by their common span. 
              Because infinitely many 2D input points land on the exact same 1D coordinate, <strong>information is irreversibly lost</strong>, which is why matrices with <code>det(A) = 0</code> are non-invertible (singular).
            </p>
          </div>

          <div className="theory-sub-block">
            <h4 style={{ color: '#A855F7', fontSize: '0.92rem', marginBottom: '0.4rem' }}>
              3. The Meaning of Negative Determinants: Orientation Flip
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Why would area ever be "negative"? In linear algebra, the sign indicates <strong>spatial chirality (handedness)</strong>. 
              In the standard coordinate system, rotating from <code>i</code> to <code>j</code> takes a 90° counter-clockwise path. 
              When a matrix performs a reflection across an axis, that rotation becomes clockwise. 
              A negative determinant alerts you that the image has been flipped inside out—like looking at a transparent slide from the reverse side!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
