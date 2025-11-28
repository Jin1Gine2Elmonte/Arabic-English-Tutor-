import React, { useState, useRef } from 'react';
import { generateSpeech } from '../services/geminiService';
import { TtsVoice } from '../types';
import { Play, Pause, Volume2, BookOpen, Loader2 } from 'lucide-react';

const TextReader: React.FC = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<TtsVoice>(TtsVoice.Zephyr);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Helper function to play audio buffer
  const playBuffer = async (buffer: AudioBuffer) => {
    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      setIsPlaying(false);
    };
    
    source.start();
    sourceRef.current = source;
    setIsPlaying(true);
  };

  const handlePlay = async () => {
    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const buffer = await generateSpeech(text, selectedVoice);
      await playBuffer(buffer);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء توليد الصوت.");
    } finally {
      setIsLoading(false);
    }
  };

  const voices = [
    { id: TtsVoice.Zephyr, label: 'Zephyr (Balanced)' },
    { id: TtsVoice.Puck, label: 'Puck (Playful)' },
    { id: TtsVoice.Kore, label: 'Kore (Calm)' },
    { id: TtsVoice.Fenrir, label: 'Fenrir (Deep)' },
  ];

  const suggestedTexts = [
    "Hello! I am here to help you learn English properly.",
    "The quick brown fox jumps over the lazy dog.",
    "Practice makes perfect. Keep trying every day!"
  ];

  return (
    <div className="h-full bg-slate-50 p-6 overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-3 text-amber-600 mb-4">
           <BookOpen size={32} />
           <h2 className="text-2xl font-bold text-slate-800">القراءة والاستماع (TTS)</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-3">اختر الصوت</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {voices.map(voice => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`
                  p-3 rounded-xl border text-sm font-medium transition-all
                  ${selectedVoice === voice.id 
                    ? 'bg-amber-50 border-amber-500 text-amber-700' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }
                `}
              >
                {voice.label}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-3">النص المراد قراءته</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write something in English here..."
            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none text-left font-medium text-lg text-slate-800"
            dir="ltr"
          />

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {suggestedTexts.map((t, idx) => (
              <button
                key={idx}
                onClick={() => setText(t)}
                className="whitespace-nowrap px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-slate-200 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
             <button
              onClick={handlePlay}
              disabled={isLoading || !text.trim()}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-amber-200
                ${isPlaying 
                  ? 'bg-slate-700 hover:bg-slate-800' 
                  : 'bg-amber-500 hover:bg-amber-600'
                }
                ${isLoading ? 'opacity-70 cursor-wait' : ''}
              `}
             >
               {isLoading ? (
                 <Loader2 className="animate-spin" size={20} />
               ) : isPlaying ? (
                 <>
                   <Pause size={20} fill="currentColor" /> إيقاف
                 </>
               ) : (
                 <>
                   <Volume2 size={20} /> استمع الآن
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextReader;