import React, { useEffect, useState, useRef } from 'react';
import { LiveSessionManager } from '../services/geminiService';
import { Mic, MicOff, Radio, Activity, Headphones } from 'lucide-react';

const LiveConversation: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const sessionManager = useRef<LiveSessionManager | null>(null);

  useEffect(() => {
    sessionManager.current = new LiveSessionManager((status) => {
      setIsConnected(status.isConnected);
      setError(status.error);
      if (status.isConnected || status.error) {
        setIsConnecting(false);
      }
    });

    return () => {
      if (sessionManager.current) {
        sessionManager.current.disconnect();
      }
    };
  }, []);

  const toggleConnection = () => {
    if (isConnected) {
      sessionManager.current?.disconnect();
    } else {
      setIsConnecting(true);
      setError(null);
      sessionManager.current?.connect();
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="z-10 text-center max-w-lg mx-auto">
        <div className="mb-8 inline-flex items-center justify-center p-4 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700">
           <Headphones className="w-6 h-6 mr-2 text-rose-400" />
           <span className="font-medium text-slate-200">المحادثة الصوتية الحية (Live API)</span>
        </div>

        <h2 className="text-4xl font-bold mb-6 leading-tight">
          تحدث الإنجليزية <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">بطلاقة وثقة</span>
        </h2>
        
        <p className="text-slate-400 mb-12 text-lg">
          اضغط على الميكروفون لبدء محادثة حية مع معلمك الذكي. سوف يستمع إليك ويصحح أخطاءك في الوقت الفعلي.
        </p>

        <div className="relative group">
          {/* Ripple Effect */}
          {isConnected && (
            <>
              <div className="absolute inset-0 bg-rose-500 rounded-full opacity-20 animate-ping"></div>
              <div className="absolute inset-[-20px] bg-rose-500 rounded-full opacity-10 animate-pulse"></div>
            </>
          )}

          <button
            onClick={toggleConnection}
            disabled={isConnecting}
            className={`
              relative z-20 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
              ${isConnected 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/50' 
                : 'bg-white text-slate-900 hover:bg-slate-200'
              }
              ${isConnecting ? 'opacity-80 scale-95' : 'hover:scale-105'}
            `}
          >
            {isConnecting ? (
              <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : isConnected ? (
              <MicOff size={48} />
            ) : (
              <Mic size={48} className="text-rose-500" />
            )}
          </button>
        </div>

        <div className="mt-12 h-8 flex items-center justify-center gap-2">
          {isConnected ? (
             <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-full">
               <Activity size={16} className="animate-pulse" />
               <span className="text-sm font-medium">متصل - تحدث الآن</span>
             </div>
          ) : error ? (
            <div className="text-red-400 bg-red-400/10 px-4 py-2 rounded-full text-sm">
              {error}
            </div>
          ) : (
            <div className="text-slate-500 text-sm flex items-center gap-2">
               <Radio size={16} />
               <span>جاهز للاتصال</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;
