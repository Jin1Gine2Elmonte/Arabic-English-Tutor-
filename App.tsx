import React, { useState } from 'react';
import Navigation from './components/Navigation';
import LiveConversation from './components/LiveConversation';
import ChatBot from './components/ChatBot';
import ImageGenerator from './components/ImageGenerator';
import PronunciationCoach from './components/PronunciationCoach';
import TextReader from './components/TextReader';
import { AppView } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LIVE);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const renderContent = () => {
    switch (currentView) {
      case AppView.LIVE:
        return <LiveConversation />;
      case AppView.CHAT:
        return <ChatBot />;
      case AppView.IMAGES:
        return <ImageGenerator />;
      case AppView.PRONUNCIATION:
        return <PronunciationCoach />;
      case AppView.READING:
        return <TextReader />;
      default:
        return <LiveConversation />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden" dir="rtl">
      
      <Navigation 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
      />

      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center gap-3">
          <button 
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg text-slate-800">المعلم الذكي</span>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden relative">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
