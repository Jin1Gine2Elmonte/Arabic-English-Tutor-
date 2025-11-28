import React, { useState, useRef, useEffect } from 'react';
import { createChatSession, transcribeAudio } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Bot, User, BrainCircuit, Mic, Loader2, StopCircle } from 'lucide-react';
import { uint8ArrayToBase64 } from '../services/audioUtils';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    chatSessionRef.current = createChatSession(
      "You are an expert English language tutor for Arabic speakers. Explain concepts clearly. If the user asks in Arabic, reply in Arabic but provide English examples. If the user asks in English, reply in English but offer translations for difficult terms.",
      useThinking
    );
    setMessages([{
      id: 'init',
      role: 'model',
      text: useThinking 
        ? "أهلاً بك. أنا في وضع التفكير العميق (Thinking Mode). اسألني عن القواعد المعقدة أو التحليل الدقيق."
        : "مرحباً! كيف يمكنني مساعدتك في تعلم الإنجليزية اليوم؟",
      timestamp: new Date()
    }]);
  }, [useThinking]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const responseText = result.text;
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
        isThinking: useThinking
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Voice Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsLoading(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const buffer = await audioBlob.arrayBuffer();
          const base64Audio = uint8ArrayToBase64(new Uint8Array(buffer));
          const transcription = await transcribeAudio(base64Audio, audioBlob.type);
          setInput(transcription);
        } catch (error) {
          console.error("Transcription failed", error);
        } finally {
          setIsLoading(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">الدردشة الذكية</h2>
          <p className="text-sm text-slate-500">اسأل عن القواعد، الكلمات، أو الترجمة</p>
        </div>
        <div className="flex items-center gap-2">
           <span className={`text-xs font-medium ${useThinking ? 'text-indigo-600' : 'text-slate-400'}`}>
             Thinking Mode
           </span>
          <button
            onClick={() => setUseThinking(!useThinking)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              ${useThinking ? 'bg-indigo-600' : 'bg-slate-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${useThinking ? '-translate-x-6' : '-translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
              ${msg.role === 'user' 
                ? 'bg-teal-600 text-white' 
                : 'bg-white text-indigo-600 border border-indigo-100'}
            `}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            
            <div className={`
              max-w-[85%] p-4 rounded-2xl leading-relaxed whitespace-pre-wrap text-sm md:text-base shadow-sm
              ${msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
              }
            `}>
              {msg.isThinking && (
                <div className="flex items-center gap-2 text-xs text-indigo-500 font-bold mb-2 border-b border-indigo-50 pb-2">
                  <BrainCircuit size={14} className="animate-pulse" />
                  <span>تحليل عميق...</span>
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-10 h-10 rounded-full bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
               <Bot size={20} />
             </div>
             <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
               <Loader2 className="animate-spin text-indigo-500" size={18} />
               <span className="text-slate-500 text-sm">
                 {isRecording ? "جارٍ معالجة الصوت..." : "جارٍ الكتابة..."}
               </span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-20">
        <div className="relative flex gap-2">
          {/* Audio Record Button */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`
              p-3 rounded-xl transition-all duration-200 flex-shrink-0
              ${isRecording 
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-105' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }
            `}
          >
            {isRecording ? <StopCircle className="animate-pulse" size={24} /> : <Mic size={24} />}
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "جارٍ الاستماع..." : "اكتب رسالتك..."}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all h-full"
              disabled={isLoading || isRecording}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} className={isLoading ? 'opacity-0' : 'opacity-100'} />
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          اضغط مطولاً على الميكروفون للتحدث
        </p>
      </div>
    </div>
  );
};

export default ChatBot;