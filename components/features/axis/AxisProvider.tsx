import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type AxisState = 'idle' | 'guiding' | 'action' | 'progression' | 'success' | 'inactive';

interface AxisContextType {
  axisState: AxisState;
  axisMessage: string | null;
  setAxisState: (state: AxisState) => void;
  triggerAxisMessage: (message: string, state?: AxisState, duration?: number) => void;
  hideAxis: () => void;
  isVisible: boolean;
}

const AxisContext = createContext<AxisContextType | undefined>(undefined);

export function AxisProvider({ children }: { children: ReactNode }) {
  const [axisState, setAxisState] = useState<AxisState>('inactive');
  const [axisMessage, setAxisMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Inactivity detection
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleActivity = () => {
      // If we were inactive, wake up to idle
      setAxisState(prev => prev === 'inactive' ? 'idle' : prev);
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setAxisState('inactive');
        setAxisMessage(null);
      }, 30000); // 30 seconds of inactivity
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    handleActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearTimeout(timeout);
    };
  }, []);

  const triggerAxisMessage = useCallback((message: string, state: AxisState = 'guiding', duration = 5000) => {
    setAxisState(state);
    setAxisMessage(message);
    setIsVisible(true);
    
    if (duration > 0) {
      setTimeout(() => {
        setAxisMessage(null);
        setAxisState('idle');
      }, duration);
    }
  }, []);

  const hideAxis = useCallback(() => {
    setIsVisible(false);
    setAxisMessage(null);
  }, []);

  return (
    <AxisContext.Provider value={{
      axisState,
      axisMessage,
      setAxisState,
      triggerAxisMessage,
      hideAxis,
      isVisible
    }}>
      {children}
    </AxisContext.Provider>
  );
}

export function useAxis() {
  const context = useContext(AxisContext);
  if (context === undefined) {
    throw new Error('useAxis must be used within an AxisProvider');
  }
  return context;
}
