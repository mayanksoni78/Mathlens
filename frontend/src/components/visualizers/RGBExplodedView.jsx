import React from 'react';
import { motion } from 'framer-motion';
import { Layers, CircleDot } from 'lucide-react';

export default function RGBExplodedView({
  colorGrid,
  activeTab = 'r',
  onSelectTab,
  hoveredCell,
  onHoverCell,
  onClickCell,
  onChangeCell
}) {
  if (!colorGrid) return null;

  const rMatrix = colorGrid.map(row => row.map(p => p.r));
  const gMatrix = colorGrid.map(row => row.map(p => p.g));
  const bMatrix = colorGrid.map(row => row.map(p => p.b));

  const handleTabClick = (tab) => {
    if (onSelectTab) onSelectTab(tab);
  };

  const renderSingleMatrix = (matrix, color, title, channelKey, isCompact = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', flex: isCompact ? 'none' : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: isCompact ? '360px' : '440px', marginBottom: isCompact ? '0.35rem' : '0.75rem' }}>
        <span className="font-serif" style={{ fontSize: isCompact ? '1.05rem' : '1.2rem', fontWeight: 700, color }}>{title}</span>
        <span className="matrix-dims" style={{ borderColor: `${color}60`, color, background: `${color}15` }}>4 × 4</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div className="matrix-bracket-container" style={{ width: '100%', maxWidth: isCompact ? '360px' : '440px' }}>
          <div 
            className="matrix-grid"
            style={{ 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: isCompact ? '6px' : '10px', 
              width: '100%'
            }}
          >
            {matrix.map((row, i) =>
              row.map((val, j) => {
                const isSelected = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;

                return (
                  <motion.div
                    key={`${channelKey}-${i}-${j}`}
                    className={`matrix-cell ${isSelected ? 'hovered' : ''}`}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onMouseEnter={() => onHoverCell && onHoverCell({ row: i, col: j })}
                    style={{
                      '--cell-accent': color,
                      borderColor: isSelected ? color : undefined,
                      borderRadius: isCompact ? '6px' : '10px',
                      padding: isCompact ? '0.2rem 0.1rem' : '0.5rem 0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={val}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        const v = isNaN(raw) ? 0 : Math.min(255, Math.max(0, raw));
                        if (onChangeCell) onChangeCell({ row: i, col: j, channel: channelKey, value: v });
                      }}
                      className="matrix-cell-input"
                      title="Click to edit intensity (0-255)"
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: color,
                        fontWeight: 700,
                        fontSize: isCompact ? '0.95rem' : '1.25rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                    />
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="matrix-grid-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
          <span>Channel Decomposition</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Click cell to edit value</span>
        </div>

        <div className="channel-tab-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem', marginBottom: '1.2rem', width: '100%' }}>
          <button 
            className={`channel-tab-btn ${activeTab === 'r' ? 'active-r' : ''}`} 
            onClick={() => handleTabClick('r')}
          >
            <CircleDot size={15} />
            <span>Red (R)</span>
          </button>
          <button 
            className={`channel-tab-btn ${activeTab === 'g' ? 'active-g' : ''}`} 
            onClick={() => handleTabClick('g')}
          >
            <CircleDot size={15} />
            <span>Green (G)</span>
          </button>
          <button 
            className={`channel-tab-btn ${activeTab === 'b' ? 'active-b' : ''}`} 
            onClick={() => handleTabClick('b')}
          >
            <CircleDot size={15} />
            <span>Blue (B)</span>
          </button>
          <button 
            className={`channel-tab-btn ${activeTab === 'all' ? 'active-all' : ''}`} 
            onClick={() => handleTabClick('all')}
          >
            <Layers size={15} />
            <span>All 3</span>
          </button>
        </div>

        {/* Centered Matrix Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', margin: 'auto 0' }}>
          {activeTab === 'r' && renderSingleMatrix(rMatrix, '#FB7185', 'Red Intensity Matrix (R_matrix)', 'r')}
          {activeTab === 'g' && renderSingleMatrix(gMatrix, '#34D399', 'Green Intensity Matrix (G_matrix)', 'g')}
          {activeTab === 'b' && renderSingleMatrix(bMatrix, '#38BDF8', 'Blue Intensity Matrix (B_matrix)', 'b')}

          {activeTab === 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', margin: 'auto' }}>
              {renderSingleMatrix(rMatrix, '#FB7185', 'Red Channel Matrix (R)', 'r', true)}
              {renderSingleMatrix(gMatrix, '#34D399', 'Green Channel Matrix (G)', 'g', true)}
              {renderSingleMatrix(bMatrix, '#38BDF8', 'Blue Channel Matrix (B)', 'b', true)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
