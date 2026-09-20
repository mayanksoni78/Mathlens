import { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('mathlens_completed_steps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeStepId, setActiveStepId] = useState(1);

  useEffect(() => {
    localStorage.setItem('mathlens_completed_steps', JSON.stringify(completedSteps));
  }, [completedSteps]);

  const markStepComplete = (stepId) => {
    setCompletedSteps(prev => (prev.includes(stepId) ? prev : [...prev, stepId]));
  };

  const isStepCompleted = (stepId) => completedSteps.includes(stepId);

  return (
    <ProgressContext.Provider
      value={{
        activeStepId,
        setActiveStepId,
        completedSteps,
        markStepComplete,
        isStepCompleted
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
