import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import LevelSelectorModal from './components/common/LevelSelectorModal';
import StepperNavigation from './components/layout/StepperNavigation';

import Step1Grayscale from './steps/Step1Grayscale';
import Step2CellEditing from './steps/Step2CellEditing';
import Step3ScalarBrightness from './steps/Step3ScalarBrightness';
import Step4SingleRGBPixel from './steps/Step4SingleRGBPixel';
import Step5RGBMatrices from './steps/Step5RGBMatrices';
import Step6RGBScalarMult from './steps/Step6RGBScalarMult';
import Step7ImageTransforms from './steps/Step7ImageTransforms';
import Step8MatrixAddition from './steps/Step8MatrixAddition';
import Step9MatrixSubtraction from './steps/Step9MatrixSubtraction';
import Step10FindWhatChanged from './steps/Step10FindWhatChanged';
import Step11ImageInversionXRay from './steps/Step11ImageInversionXRay';
import Step12DeterminantVisualizer from './steps/Step12DeterminantVisualizer';
import Step13MatrixInverse from './steps/Step13MatrixInverse';
import Step14MatrixInverseZoom from './steps/Step14MatrixInverseZoom';

import './App.css';

export default function App() {
  const [currentLevel, setCurrentLevel] = useState('basic');
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('mathlens_step');
    return saved ? parseInt(saved, 10) : 14;
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mathlens_theme') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('mathlens_theme', nextTheme);
  };

  const handleSelectStep = (step) => {
    setCurrentStep(step);
    localStorage.setItem('mathlens_step', step);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Grayscale />;
      case 2:
        return <Step2CellEditing />;
      case 3:
        return <Step3ScalarBrightness />;
      case 4:
        return <Step4SingleRGBPixel />;
      case 5:
        return <Step5RGBMatrices />;
      case 6:
        return <Step6RGBScalarMult />;
      case 7:
        return <Step7ImageTransforms />;
      case 8:
        return <Step8MatrixAddition onSelectStep={handleSelectStep} />;
      case 9:
        return <Step9MatrixSubtraction onSelectStep={handleSelectStep} />;
      case 10:
        return <Step10FindWhatChanged onSelectStep={handleSelectStep} />;
      case 11:
        return <Step11ImageInversionXRay onSelectStep={handleSelectStep} />;
      case 12:
        return <Step12DeterminantVisualizer onSelectStep={handleSelectStep} />;
      case 13:
        return <Step13MatrixInverse onSelectStep={handleSelectStep} />;
      case 14:
        return <Step14MatrixInverseZoom onSelectStep={handleSelectStep} />;
      default:
        return <Step1Grayscale />;
    }
  };

  return (
    <div className="app-container">
      <Header
        currentLevel={currentLevel}
        onSelectLevel={setCurrentLevel}
        onOpenLevelModal={() => setIsLevelModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <StepperNavigation
        currentStep={currentStep}
        onSelectStep={handleSelectStep}
      />

      <main className="main-content">
        {renderStepContent()}
      </main>

      <LevelSelectorModal
        isOpen={isLevelModalOpen}
        currentLevel={currentLevel}
        onSelectLevel={setCurrentLevel}
        onClose={() => setIsLevelModalOpen(false)}
      />
    </div>
  );
}
