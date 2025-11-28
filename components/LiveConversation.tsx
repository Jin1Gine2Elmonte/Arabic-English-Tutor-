import React, { useEffect, useState, useRef } from 'react';
import { LiveSessionManager } from '../services/geminiService';
import { Mic, MicOff, Activity, Headphones, User, Bot, Sparkles, XCircle } from 'lucide-react';
import { LiveTranscriptItem } from '../types';

const LiveConversation: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const sessionManager = useRef<LiveSessionManager | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionManager.current = new LiveSessionManager(
      (status) => {
        setIsConnected(status.isConnected);
        setError(status.error);
        if (status.isConnected || status.error) {
          setIsConnecting(false);
        }
      },
      (role, text, isFinal) => {
        setTranscripts(prev => {
           const newItem: LiveTranscriptItem = {
               id: Date.now().toString() + role,
               role,
               text,
               isComplete: isFinal
           };
           
           if (prev.length > 0) {
               const lastIdx = prev.length - 1;
               const lastItem = prev[lastIdx];
               if (lastItem.role === role && !lastItem.isComplete) {
                   const newArr = [...prev];
                   newArr[lastIdx] = newItem;
                   return newArr;
               }
           }
           return [...prev, newItem];
        });
      }
    );

    return () => {
      if (sessionManager.current) {
        sessionManager.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const toggleConnection = () => {
    if (isConnected) {
      sessionManager.current?.disconnect();
    } else {
      setIsConnecting(true);
      setError(null);
      setTranscripts([]);
      sessionManager.current?.connect();
    }
  };

  // Function to highlight corrections wrapped in asterisks e.g. *correction*
  const renderTextWithHighlights = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span key={i} className="bg-yellow-200 text-yellow-800 px-1 rounded mx-0.5 font-bold animate-pulse">
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Interface */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full z-10 p-4">
        
        {/* Status Header */}
        <div className="flex justify-between items-center mb-6 bg-white/5 backdrop-blur-lg p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             <div>
               <h2 className="font-bold text-lg">المحادثة الحية</h2>
               <p className="text-xs text-slate-400">Gemini Live API</p>
             </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-300 text-sm bg-red-900/30 px-3 py-1 rounded-full border border-red-500/30">
              <XCircle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Dynamic Transcript Area */}
        <div 
          className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar relative"
          ref={scrollRef}
        >
           {transcripts.length === 0 && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 opacity-50">
                <Sparkles size={48} className="mb-4" />
                <p>ابدأ المحادثة ليظهر النص هنا...</p>
             </div>
           )}

           {transcripts.map((item, idx) => (
             <div key={idx} className={`flex items-end gap-3 ${item.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               
               {/* Avatar */}
               <div className={`
                 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg
                 ${item.role === 'user' 
                   ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white' 
                   : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}
               `}>
                 {item.role === 'user' ? <User size={18} /> : <Headphones size={18} />}
               </div>

               {/* Bubble */}
               <div className={`
                 max-w-[80%] p-4 rounded-2xl text-base leading-relaxed shadow-md backdrop-blur-sm border
                 ${item.role === 'user' 
                   ? 'bg-teal-600/20 border-teal-500/30 text-teal-50 rounded-br-none' 
                   : 'bg-white/10 border-white/10 text-slate-100 rounded-bl-none'}
               `}>
                 <p dir={item.role === 'user' ? 'auto' : 'ltr'}>
                   {renderTextWithHighlights(item.text)}
                 </p>
               </div>
             </div>
           ))}
        </div>

        {/* Control Footer */}
        <div className="mt-6 flex justify-center items-center relative">
           
           {/* Visualizer Ring */}
           {isConnected && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full border border-teal-500/30 animate-ping"></div>
                <div className="w-32 h-32 rounded-full border border-teal-500/20 animate-ping" style={{ animationDelay: '0.3s' }}></div>
             </div>
           )}

           <button
             onClick={toggleConnection}
             disabled={isConnecting}
             className={`
               relative z-20 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
               ${isConnected 
                 ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-900/40' 
                 : 'bg-teal-500 hover:bg-teal-600 ring-4 ring-teal-900/40 hover:scale-110'
               }
             `}
           >
             {isConnecting ? (
               <Activity className="animate-spin text-white" size={32} />
             ) : isConnected ? (
               <MicOff className="text-white" size={32} />
             ) : (
               <Mic className="text-white" size={32} />
             )}
           </button>
           
           <div className="absolute -bottom-8 text-xs text-slate-500 font-medium tracking-wide">
             {isConnected ? 'اضغط للإنهاء' : 'اضغط للتحدث'}
           </div>
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;