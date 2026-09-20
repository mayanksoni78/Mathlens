import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';

export default function Header({ currentLevel, onSelectLevel, onOpenLevelModal, theme, onToggleTheme }) {
  return (
    <header className="header-bar">
      <div className="brand-section">
        <div>
          <h1 className="brand-title">MathLens</h1>
          <div className="brand-subtitle">Visual & Interactive Linear Algebra</div>
        </div>
      </div>
      
      <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Sliding Pill Control for Basic & Advanced */}
        <div className="track-slider-container">
          <button
            type="button"
            className={`track-slider-option ${currentLevel === 'basic' ? 'active' : ''}`}
            onClick={() => onSelectLevel && onSelectLevel('basic')}
          >
            {currentLevel === 'basic' && (
              <motion.div
                layoutId="activeTrackPill"
                className="track-slider-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="track-slider-text">Basic Intuition</span>
          </button>

          <button
            type="button"
            className={`track-slider-option ${currentLevel === 'advanced' ? 'active' : ''}`}
            onClick={() => {
              if (onOpenLevelModal) onOpenLevelModal();
            }}
            title="Advanced Linear Algebra"
          >
            {currentLevel === 'advanced' && (
              <motion.div
                layoutId="activeTrackPill"
                className="track-slider-active-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="track-slider-text flex items-center gap-1">
              <Sparkles size={12} className="inline opacity-80" /> Advanced Math
            </span>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <motion.button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="theme-icon sun-icon" />
          ) : (
            <Moon size={18} className="theme-icon moon-icon" />
          )}
        </motion.button>
      </div>
    </header>
  );
}
