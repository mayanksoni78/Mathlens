import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Compass, Layers } from 'lucide-react';

export default function Footer({ currentStep, onSelectStep, onOpenLevelModal }) {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-title-row">
            <BookOpen size={20} className="footer-icon" />
            <span className="footer-brand-title">MathLens</span>
          </div>
          <p className="footer-quote">
            An interactive mathematics laboratory exploring matrix representations, spatial transformations, and digital image processing.
          </p>
        </div>

        <div className="footer-links-group">
          <div className="footer-column">
            <h4>Laboratory Steps</h4>
            <div className="footer-step-links">
              <button onClick={() => onSelectStep(1)} className={currentStep === 1 ? 'active' : ''}>
                01. Grayscale Matrices
              </button>
              <button onClick={() => onSelectStep(2)} className={currentStep === 2 ? 'active' : ''}>
                02. Cell Editing
              </button>
              <button onClick={() => onSelectStep(3)} className={currentStep === 3 ? 'active' : ''}>
                03. Scalar Multiplications
              </button>
              <button onClick={() => onSelectStep(4)} className={currentStep === 4 ? 'active' : ''}>
                04. RGB Pixel Tensors
              </button>
              <button onClick={() => onSelectStep(5)} className={currentStep === 5 ? 'active' : ''}>
                05. Channel Decomposition
              </button>
              <button onClick={() => onSelectStep(6)} className={currentStep === 6 ? 'active' : ''}>
                06. Channel Multipliers
              </button>
              <button onClick={() => onSelectStep(7)} className={currentStep === 7 ? 'active' : ''}>
                07. 2D Image Transforms
              </button>
              <button onClick={() => onSelectStep(8)} className={currentStep === 8 ? 'active' : ''}>
                08. Addition & Blending
              </button>
              <button onClick={() => onSelectStep(9)} className={currentStep === 9 ? 'active' : ''}>
                09. Background Subtraction
              </button>
            </div>
          </div>

          <div className="footer-column">
            <h4>Learning Tracks</h4>
            <div className="footer-track-badge" onClick={onOpenLevelModal}>
              <Layers size={14} />
              <span>Basic Intuition Track</span>
              <span className="badge-active">Active</span>
            </div>
            <p className="footer-small-text">
              Designed for visual intuition in linear algebra and digital image processing.
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© MathLens Matrix Laboratory — Modern Mathematics Interactive Series</span>
        <span className="footer-math-symbol">A · x = λ · x</span>
      </div>
    </footer>
  );
}
