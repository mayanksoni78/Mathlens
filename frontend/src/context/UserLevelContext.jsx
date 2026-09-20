import { createContext, useContext, useState, useEffect } from 'react';

const UserLevelContext = createContext(null);

export const USER_LEVELS = {
  BASIC: 'basic',
  ADVANCED: 'advanced'
};

export function UserLevelProvider({ children }) {
  const [userLevel, setUserLevelState] = useState(() => {
    return localStorage.getItem('mathlens_user_level') || null;
  });

  const [showLevelModal, setShowLevelModal] = useState(!userLevel);

  useEffect(() => {
    if (userLevel) {
      localStorage.setItem('mathlens_user_level', userLevel);
    }
  }, [userLevel]);

  const setUserLevel = (level) => {
    setUserLevelState(level);
    setShowLevelModal(false);
  };

  const isAdvanced = userLevel === USER_LEVELS.ADVANCED;

  return (
    <UserLevelContext.Provider
      value={{
        userLevel,
        setUserLevel,
        isAdvanced,
        showLevelModal,
        setShowLevelModal
      }}
    >
      {children}
    </UserLevelContext.Provider>
  );
}

export function useUserLevel() {
  const context = useContext(UserLevelContext);
  if (!context) {
    throw new Error('useUserLevel must be used within a UserLevelProvider');
  }
  return context;
}
