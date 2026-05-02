import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type AxisState = 'idle' | 'guiding' | 'action' | 'progression' | 'success' | 'inactive';

export interface AxisAction {
  label: string;
  action: () => void;
}

interface AxisContextType {
  axisState: AxisState;
  axisMessage: string | ReactNode | null;
  axisAction: AxisAction | null;
  setAxisState: (state: AxisState) => void;
  triggerAxisMessage: (message: string | ReactNode, state?: AxisState, duration?: number, action?: AxisAction) => void;
  hideAxis: () => void;
  isVisible: boolean;
}

const AxisContext = createContext<AxisContextType | undefined>(undefined);

export function AxisProvider({ children }: { children: ReactNode }) {
  const [axisState, setAxisState] = useState<AxisState>('inactive');
  const [axisMessage, setAxisMessage] = useState<string | ReactNode | null>(null);
  const [axisAction, setAxisAction] = useState<AxisAction | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const triggerAxisMessage = useCallback((message: string | ReactNode, state: AxisState = 'guiding', duration = 5000, action?: AxisAction) => {
    setAxisState(state);
    setAxisMessage(message);
    setAxisAction(action || null);
    setIsVisible(true);
    
    if (duration > 0) {
      setTimeout(() => {
        setAxisMessage(null);
        setAxisAction(null);
        setAxisState('inactive');
        setIsVisible(false);
      }, duration);
    }
  }, []);

  const hideAxis = useCallback(() => {
    setIsVisible(false);
    setAxisMessage(null);
    setAxisAction(null);
    setAxisState('inactive');
  }, []);

  return (
    <AxisContext.Provider value={{
      axisState,
      axisMessage,
      axisAction,
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
