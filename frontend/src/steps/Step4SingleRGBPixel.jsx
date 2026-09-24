import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Step4SingleRGBPixel() {
  const [r, setR] = useState(128);
  const [g, setG] = useState(0);
  const [b, setB] = useState(128);

  const setPreset = (redVal, greenVal, blueVal) => {
    setR(redVal);
    setG(greenVal);
    setB(blueVal);
  };

  return (
    <motion.div 
      className="step-module"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="step-header-box">
        <h2 className="step-heading">Single RGB Pixel Vector</h2>
        <p className="step-description">
          A colour pixel is not represented by a single number. Instead, it contains three intensity components: <strong>[R, G, B]</strong> (Red, Green, Blue), each ranging from 0 to 255.
        </p>
      </div>

      <div className="top-control-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Preset RGB Vectors:
          </span>
          <div className="preset-buttons" style={{ margin: 0 }}>
            <button className="preset-btn" onClick={() => setPreset(255, 0, 0)}>🔴 Red [255, 0, 0]</button>
            <button className="preset-btn" onClick={() => setPreset(0, 255, 0)}>🟢 Green [0, 255, 0]</button>
            <button className="preset-btn" onClick={() => setPreset(0, 0, 255)}>🔵 Blue [0, 0, 255]</button>
            <button className="preset-btn" onClick={() => setPreset(128, 0, 128)}>💜 Purple [128, 0, 128]</button>
            <button className="preset-btn" onClick={() => setPreset(255, 255, 0)}>💛 Yellow [255, 255, 0]</button>
          </div>
        </div>
      </div>

      <div className="side-by-side-container">
        <div className="slider-card">
          <div className="canvas-header">
            <h3>Channel Intensity Sliders</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="slider-group">
              <div className="slider-label">
                <span style={{ color: '#EF4444', fontWeight: '700' }}>Red Channel (R):</span>
                <span className="font-mono" style={{ color: '#EF4444', fontWeight: '800' }}>{r}</span>
              </div>
              <input type="range" className="slider-input" min="0" max="255" value={r} onChange={(e) => setR(parseInt(e.target.value))} style={{ '--slider-pct': `${(r / 255) * 100}%`, '--slider-color': '#EF4444' }} />
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span style={{ color: '#10B981', fontWeight: '700' }}>Green Channel (G):</span>
                <span className="font-mono" style={{ color: '#10B981', fontWeight: '800' }}>{g}</span>
              </div>
              <input type="range" className="slider-input" min="0" max="255" value={g} onChange={(e) => setG(parseInt(e.target.value))} style={{ '--slider-pct': `${(g / 255) * 100}%`, '--slider-color': '#10B981' }} />
            </div>

            <div className="slider-group">
              <div className="slider-label">
                <span style={{ color: '#3B82F6', fontWeight: '700' }}>Blue Channel (B):</span>
                <span className="font-mono" style={{ color: '#3B82F6', fontWeight: '800' }}>{b}</span>
              </div>
              <input type="range" className="slider-input" min="0" max="255" value={b} onChange={(e) => setB(parseInt(e.target.value))} style={{ '--slider-pct': `${(b / 255) * 100}%`, '--slider-color': '#3B82F6' }} />
            </div>
          </div>
        </div>

        <div className="canvas-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="canvas-header" style={{ width: '100%' }}>
            <h3>Resulting Pixel Colour</h3>
          </div>
          <div className="canvas-wrapper" style={{ padding: '0.5rem 0' }}>
            <div
              className="color-swatch-square"
              style={{
                width: '100%',
                maxWidth: '220px',
                aspectRatio: '1 / 1',
                borderRadius: '16px',
                backgroundColor: `rgb(${r}, ${g}, ${b})`,
                border: '2px solid var(--border-color)',
                boxShadow: `0 12px 36px rgba(0, 0, 0, 0.6), 0 0 35px rgba(${r}, ${g}, ${b}, 0.45)`,
                transition: 'background-color 0.15s ease, box-shadow 0.15s ease'
              }}
            />
          </div>
          <div className="hover-info-box" style={{ width: '100%', minHeight: '48px', justifyContent: 'center' }}>
            <span>RGB Vector:</span>
            <span className="font-mono" style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', fontWeight: '800' }}>
              [{r}, {g}, {b}]
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
