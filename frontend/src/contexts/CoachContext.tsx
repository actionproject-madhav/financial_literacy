import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CoachContextType {
  isOpen: boolean;
  openCoach: () => void;
  closeCoach: () => void;
  toggleCoach: () => void;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export function CoachProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCoach = () => setIsOpen(true);
  const closeCoach = () => setIsOpen(false);
  const toggleCoach = () => setIsOpen(prev => !prev);

  return (
    <CoachContext.Provider value={{ isOpen, openCoach, closeCoach, toggleCoach }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  const context = useContext(CoachContext);
  if (context === undefined) {
    throw new Error('useCoach must be used within a CoachProvider');
  }
  return context;
}

