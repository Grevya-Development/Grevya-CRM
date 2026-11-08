import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
  toggleMobileSidebar: () => void;
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [aiEnabled, setAiEnabledState] = useState<boolean>(() => {
    // read from localStorage, default true
    try {
      const stored = localStorage.getItem('aiEnabled');
      if (stored !== null) return stored === 'true';
    } catch {}
    return true;
  });

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const setAiEnabled = (enabled: boolean) => {
    setAiEnabledState(enabled);
    try {
      localStorage.setItem('aiEnabled', String(enabled));
    } catch {}
  };

  return (
    <LayoutContext.Provider value={{ 
      isMobileSidebarOpen, 
      setIsMobileSidebarOpen, 
      toggleMobileSidebar,
      aiEnabled,
      setAiEnabled,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
