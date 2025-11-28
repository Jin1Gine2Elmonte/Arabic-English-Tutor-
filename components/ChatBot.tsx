import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Bot, User, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat when thinking mode changes (reset context)
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

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800">الدردشة الذكية</h2>
          <p className="text-sm text-slate-500">اسأل عن القواعد، الكلمات، أو الترجمة</p>
        </div>
        <div className="flex items-center gap-2">
           <span className={`text-xs font-medium ${useThinking ? 'text-indigo-600' : 'text-slate-400'}`}>
             وضع التفكير (Thinking)
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}
            `}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`
              max-w-[80%] p-4 rounded-2xl leading-relaxed whitespace-pre-wrap
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
              }
            `}>
              {msg.isThinking && (
                <div className="flex items-center gap-1 text-xs text-indigo-500 font-bold mb-2 border-b border-indigo-100 pb-1">
                  <BrainCircuit size={14} />
                  <span>Deep Thinking...</span>
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
               <Bot size={20} />
             </div>
             <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
               <Loader2 className="animate-spin text-indigo-500" size={18} />
               <span className="text-slate-500 text-sm">جارِ التحليل والرد...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب رسالتك هنا..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute left-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} className={isLoading ? 'opacity-0' : 'opacity-100'} />
            {isLoading && <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin" size={20} /></span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;