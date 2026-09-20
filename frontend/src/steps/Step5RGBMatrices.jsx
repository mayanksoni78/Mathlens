import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RGBExplodedView from '../components/visualizers/RGBExplodedView';
import PixelCanvas from '../components/visualizers/PixelCanvas';

// 16 Unique values for R, G, and B channels so every cell has a distinct shade
const INITIAL_COLOR_GRID = [
  [{ r: 255, g: 250, b: 245 }, { r: 240, g: 235, b: 230 }, { r: 225, g: 220, b: 215 }, { r: 210, g: 205, b: 200 }],
  [{ r: 195, g: 190, b: 185 }, { r: 180, g: 175, b: 170 }, { r: 165, g: 160, b: 155 }, { r: 150, g: 145, b: 140 }],
  [{ r: 135, g: 130, b: 125 }, { r: 120, g: 115, b: 110 }, { r: 105, g: 100, b: 95 }, { r: 90, g: 85, b: 80 }],
  [{ r: 75, g: 70, b: 65 }, { r: 60, g: 55, b: 50 }, { r: 45, g: 40, b: 35 }, { r: 30, g: 25, b: 20 }]
];

export default function Step5RGBMatrices() {
  const [colorGrid, setColorGrid] = useState(INITIAL_COLOR_GRID);
  const [activeTab, setActiveTab] = useState('r');
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleCellChange = ({ row, col, channel, value }) => {
    setColorGrid(prevGrid => {
      return prevGrid.map((rArr, i) =>
        rArr.map((cell, j) => {
          if (i === row && j === col) {
            return { ...cell, [channel]: value };
          }
          return cell;
        })
      );
    });
  };

  const getFilteredColorGrid = () => {
    if (activeTab === 'r') {
      return colorGrid.map(row => row.map(p => ({ r: p.r, g: 0, b: 0 })));
    }
    if (activeTab === 'g') {
      return colorGrid.map(row => row.map(p => ({ r: 0, g: p.g, b: 0 })));
    }
    if (activeTab === 'b') {
      return colorGrid.map(row => row.map(p => ({ r: 0, g: 0, b: p.b })));
    }
    return colorGrid;
  };

  const getCanvasTitle = () => {
    if (activeTab === 'r') return "Red Channel Image (R-Only)";
    if (activeTab === 'g') return "Green Channel Image (G-Only)";
    if (activeTab === 'b') return "Blue Channel Image (B-Only)";
    return "Recombined RGB Colour Image";
  };

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">RGB Channel Matrix Decomposition</h2>
        <p className="step-description">
          A full colour image is represented as a triple tensor <strong>(R, G, B)</strong> using three separate 2D matrices: <code>R_matrix</code>, <code>G_matrix</code>, and <code>B_matrix</code>. Click any matrix element to change its intensity value (0 to 255) live!
        </p>
      </div>

      <div className="side-by-side-container" style={{ alignItems: 'stretch' }}>
        <PixelCanvas
          colorGrid={getFilteredColorGrid()}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          pixelSize={72}
          title={getCanvasTitle()}
        />
        <RGBExplodedView
          colorGrid={colorGrid}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
          onChangeCell={handleCellChange}
        />
      </div>
    </motion.div>
  );
}
