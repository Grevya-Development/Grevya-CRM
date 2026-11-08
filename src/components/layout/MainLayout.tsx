import { Sidebar } from './Sidebar';
import { ReactNode, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LayoutProvider, useLayout } from '@/contexts/LayoutContext';
import AIAssistant from '@/components/ai/Ai-Assistant';
import { useLocation, useNavigate } from 'react-router-dom';
import { VoiceAssistant } from '@/components/voice/VoiceAssistant';
import { useGrevya } from '@/hooks/useGrevya';

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (route: string) => navigate(route),
    [navigate]
  );
  
  const handleSearch = useCallback(
    (query: string) => navigate(`/contacts?search=${encodeURIComponent(query)}`),
    [navigate]
  );

  const {
    status,
    isOverlayOpen,
    transcript,
    response,
    isSupported,
    hasPermission,
    closeOverlay,
    startListening,
    triggerQuickCommand,
  } = useGrevya({ onNavigate: handleNavigate, onSearch: handleSearch });

  return (
    <div className="h-screen bg-background relative overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        isExpanded={isSidebarExpanded}
        onHoverChange={setIsSidebarExpanded}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <main className={cn("transition-[padding-left] duration-300 ease-in-out h-screen overflow-y-auto flex flex-col will-change-[padding-left] relative", isSidebarExpanded ? "md:pl-64" : "pl-0 md:pl-14")}>
        {children}
        
      </main>

      {/* 🔥 GLOBAL AI ASSISTANT */}
      <AIAssistant currentPath={location.pathname} />


      {/* Voice Assistant */}
      <VoiceAssistant
        isOpen={isOverlayOpen}
        status={status}
        transcript={transcript}
        response={response}
        isSupported={isSupported}
        hasPermission={hasPermission}
        onClose={closeOverlay}
        onStartListening={startListening}
        onQuickCommand={triggerQuickCommand}
      />
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <LayoutProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </LayoutProvider>
  );
}
