import React, { useEffect, useState, useRef } from 'react';
import { LiveSessionManager } from '../services/geminiService';
import { Mic, MicOff, Radio, Activity, Headphones, User, Bot, Sparkles } from 'lucide-react';
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
      // Status Callback
      (status) => {
        setIsConnected(status.isConnected);
        setError(status.error);
        if (status.isConnected || status.error) {
          setIsConnecting(false);
        }
      },
      // Transcript Callback
      (role, text, isFinal) => {
        setTranscripts(prev => {
           const newItem: LiveTranscriptItem = {
               id: Date.now().toString() + role, // simple id
               role,
               text,
               isComplete: isFinal
           };
           
           // If the last item is the same role and not complete, update it
           if (prev.length > 0) {
               const lastIdx = prev.length - 1;
               const lastItem = prev[lastIdx];
               if (lastItem.role === role && !lastItem.isComplete) {
                   const newArr = [...prev];
                   newArr[lastIdx] = newItem;
                   return newArr;
               }
           }
           // Otherwise add new item
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

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header / Active Status Area */}
      <div className="flex-none p-6 text-center relative z-10">
        <div className="mb-6 inline-flex items-center justify-center p-3 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 shadow-lg">
           <Headphones className="w-5 h-5 mr-2 text-rose-400" />
           <span className="font-medium text-slate-200 text-sm">المحادثة الصوتية الحية (Live API)</span>
        </div>

        <div className="relative group mx-auto w-max">
          {isConnected && (
            <>
              <div className="absolute inset-0 bg-rose-500 rounded-full opacity-20 animate-ping"></div>
              <div className="absolute inset-[-10px] bg-rose-500 rounded-full opacity-10 animate-pulse"></div>
            </>
          )}

          <button
            onClick={toggleConnection}
            disabled={isConnecting}
            className={`
              relative z-20 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
              ${isConnected 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/50 scale-100' 
                : 'bg-white text-slate-900 hover:bg-slate-200 hover:scale-105'
              }
            `}
          >
            {isConnecting ? (
              <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : isConnected ? (
              <MicOff size={32} />
            ) : (
              <Mic size={32} className="text-rose-500" />
            )}
          </button>
        </div>

        <div className="mt-6 h-6 flex items-center justify-center gap-2">
          {isConnected ? (
             <div className="flex items-center gap-2 text-green-400">
               <Activity size={16} className="animate-pulse" />
               <span className="text-sm font-medium">متصل - تحدث الآن</span>
             </div>
          ) : error ? (
            <div className="text-red-400 bg-red-400/10 px-4 py-1 rounded-full text-sm">
              {error}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">اضغط على الميكروفون لبدء المحادثة</p>
          )}
        </div>
      </div>

      {/* Transcription Log */}
      <div className="flex-1 bg-slate-800/50 rounded-t-3xl backdrop-blur-md border-t border-slate-700/50 overflow-hidden flex flex-col mx-2 md:mx-6 mb-0 shadow-2xl">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-slate-300 font-medium flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                سجل المحادثة
            </h3>
            <span className="text-xs text-slate-500">يظهر النص كما يسمعه النموذج (لتصحيح النطق)</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {transcripts.length === 0 && isConnected && (
                <div className="text-center text-slate-500 py-10">
                    <p>استمع...</p>
                </div>
            )}
            
            {transcripts.map((item, idx) => (
                <div key={idx} className={`flex items-start gap-3 ${item.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                        ${item.role === 'user' ? 'bg-blue-600' : 'bg-rose-500'}
                    `}>
                        {item.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    
                    <div className={`
                        max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                        ${item.role === 'user' 
                             ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none' 
                             : 'bg-slate-700/50 border border-slate-600 text-slate-200 rounded-tl-none'
                        }
                    `}>
                        <p className="whitespace-pre-wrap" dir={item.role === 'user' ? 'auto' : 'ltr'}>
                            {item.text}
                            {!item.isComplete && <span className="inline-block w-1.5 h-1.5 bg-current rounded-full ml-1 animate-pulse"/>}
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;