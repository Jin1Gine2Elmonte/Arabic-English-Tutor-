import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { Mic, Square, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uint8ArrayToBase64 } from '../services/audioUtils';

const PronunciationCoach: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscript(null);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("لا يمكن الوصول إلى الميكروفون");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64
      const buffer = await blob.arrayBuffer();
      const base64 = uint8ArrayToBase64(new Uint8Array(buffer));
      
      // Gemini Transcription
      const text = await transcribeAudio(base64, blob.type);
      setTranscript(text);
    } catch (err) {
      console.error(err);
      setTranscript("فشل في معالجة الصوت. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full bg-slate-50 p-6 overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">مدرب النطق</h2>
          <p className="text-slate-500">سجل صوتك وسيقوم النموذج بتحويله إلى نص للتحقق من سلامة النطق.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-100 flex flex-col items-center">
          <div className="mb-8 relative">
            {isRecording && (
               <span className="absolute -top-4 -right-4 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
               </span>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`
                w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                ${isRecording 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                  : 'bg-green-500 hover:bg-green-600 shadow-green-200'
                }
                ${isProcessing ? 'opacity-50 cursor-wait' : 'shadow-xl hover:scale-105'}
              `}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin text-white" size={40} />
              ) : isRecording ? (
                <Square className="text-white fill-current" size={32} />
              ) : (
                <Mic className="text-white" size={40} />
              )}
            </button>
          </div>
          
          <p className="text-lg font-medium text-slate-700 mb-2">
            {isRecording ? "جارٍ التسجيل... اضغط للإيقاف" : isProcessing ? "جارٍ المعالجة..." : "اضغط الميكروفون للبدء"}
          </p>
        </div>

        {transcript && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-700">النص المكتشف (Transcript)</span>
              <CheckCircle2 size={20} className="text-green-500" />
            </div>
            <div className="p-6">
              <p className="text-xl leading-relaxed text-slate-800 font-medium" dir="ltr">
                {transcript}
              </p>
            </div>
            <div className="bg-blue-50 p-4 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5" />
                <p>
                  قارن النص الظاهر بما قلت. إذا كانت الكلمات صحيحة، فنطقك ممتاز. إذا كانت هناك كلمات غريبة، حاول نطقها مرة أخرى بوضوح.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationCoach;
