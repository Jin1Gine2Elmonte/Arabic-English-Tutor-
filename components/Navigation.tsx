import React from 'react';
import { AppView } from '../types';
import { MessageSquare, Mic, Image, Volume2, BookOpen, Menu, X } from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setCurrentView, isMobileOpen, setIsMobileOpen }) => {
  const navItems = [
    { id: AppView.LIVE, label: 'محادثة حية (Live)', icon: Mic, color: 'text-rose-500' },
    { id: AppView.CHAT, label: 'الدردشة الذكية (Chat)', icon: MessageSquare, color: 'text-blue-500' },
    { id: AppView.IMAGES, label: 'التعلم البصري (Images)', icon: Image, color: 'text-purple-500' },
    { id: AppView.PRONUNCIATION, label: 'تدريب النطق (Speech)', icon: Volume2, color: 'text-green-500' },
    { id: AppView.READING, label: 'القراءة (TTS)', icon: BookOpen, color: 'text-amber-500' },
  ];

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 right-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 border-l border-slate-200
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            المعلم الذكي
          </h1>
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="md:hidden p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                  ${isActive 
                    ? 'bg-slate-100 text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }
                `}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white' : 'bg-slate-100'} ${item.color}`}>
                  <Icon size={20} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              مدعوم بواسطة Google Gemini 2.5 & 3.0 Pro
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
