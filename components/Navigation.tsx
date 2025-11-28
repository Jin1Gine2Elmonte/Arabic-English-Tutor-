import React from 'react';
import { AppView } from '../types';
import { MessageSquare, Mic, Image, Volume2, BookOpen, Menu, X, Sparkles } from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setCurrentView, isMobileOpen, setIsMobileOpen }) => {
  const navItems = [
    { id: AppView.LIVE, label: 'محادثة حية (Live)', icon: Mic, color: 'text-rose-500' },
    { id: AppView.CHAT, label: 'الدردشة الذكية', icon: MessageSquare, color: 'text-indigo-500' },
    { id: AppView.IMAGES, label: 'التعلم البصري', icon: Image, color: 'text-purple-500' },
    { id: AppView.PRONUNCIATION, label: 'تدريب النطق', icon: Volume2, color: 'text-teal-500' },
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 right-0 z-30 w-72 bg-white shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out md:translate-x-0 border-l border-slate-100 flex flex-col
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              المعلم الذكي
            </h1>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="md:hidden p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium text-sm
                  ${isActive 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-teal-400' : item.color} />
                <span>{item.label}</span>
                {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50 bg-slate-50/50">
          <div className="bg-gradient-to-r from-teal-500 to-indigo-600 p-0.5 rounded-xl">
             <div className="bg-white p-4 rounded-[10px] text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Powered By</p>
                <p className="text-sm font-bold bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
                  Google Gemini 2.5
                </p>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;