import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Square, CheckSquare, Grid, TrendingUp } from 'lucide-react';
import PixelCanvas from '../components/visualizers/PixelCanvas';
import MatrixGrid from '../components/matrix/MatrixGrid';

const PRESETS = {
  black: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  white: [
    [255, 255, 255, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255]
  ],
  checkerboard: [
    [0, 255, 0, 255],
    [255, 0, 255, 0],
    [0, 255, 0, 255],
    [255, 0, 255, 0]
  ],
  gradient: [
    [0, 50, 100, 150],
    [50, 100, 150, 200],
    [100, 150, 200, 230],
    [150, 200, 230, 255]
  ]
};

export default function Step1Grayscale() {
  const [matrix, setMatrix] = useState(PRESETS.black);
  const [activePreset, setActivePreset] = useState('black');
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleSelectPreset = (key) => {
    setActivePreset(key);
    setMatrix(PRESETS[key]);
  };

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">From Pixels to Matrices</h2>
        <p className="step-description">
          Every digital image is stored as a 2D numerical array (a <strong>matrix</strong>). In an 8-bit grayscale image, each element represents a pixel intensity from <strong>0 (Black)</strong> to <strong>255 (White)</strong>.
        </p>
      </div>

      <div className="top-control-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Select Matrix Preset:
          </span>
          <div className="preset-buttons">
            <button 
              className={`preset-btn ${activePreset === 'black' ? 'active' : ''}`} 
              onClick={() => handleSelectPreset('black')}
            >
              <Square size={16} fill="currentColor" opacity={0.7} />
              <span>Black (All 0s)</span>
            </button>
            <button 
              className={`preset-btn ${activePreset === 'white' ? 'active' : ''}`} 
              onClick={() => handleSelectPreset('white')}
            >
              <CheckSquare size={16} />
              <span>White (All 255s)</span>
            </button>
            <button 
              className={`preset-btn ${activePreset === 'checkerboard' ? 'active' : ''}`} 
              onClick={() => handleSelectPreset('checkerboard')}
            >
              <Grid size={16} />
              <span>Checkerboard</span>
            </button>
            <button 
              className={`preset-btn ${activePreset === 'gradient' ? 'active' : ''}`} 
              onClick={() => handleSelectPreset('gradient')}
            >
              <TrendingUp size={16} />
              <span>Gradient</span>
            </button>
          </div>
        </div>
      </div>

      <div className="side-by-side-container">
        <PixelCanvas
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title="Digital Image View (4×4 Pixels)"
        />
        <MatrixGrid
          matrix={matrix}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          title="Mathematical Matrix View A"
        />
      </div>
    </motion.div>
  );
}
