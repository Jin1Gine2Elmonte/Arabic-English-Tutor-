import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { ImageGenerationConfig, GeneratedImage } from '../types';
import { Image as ImageIcon, Loader2, Download, Frame } from 'lucide-react';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<ImageGenerationConfig['aspectRatio']>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const generated = await generateImage({ prompt, aspectRatio });
      setResult(generated);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء توليد الصورة.");
    } finally {
      setIsLoading(false);
    }
  };

  const ratios = ["1:1", "3:4", "4:3", "9:16", "16:9"];

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Controls */}
      <div className="w-full md:w-1/3 p-6 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 text-purple-600">
            <ImageIcon size={24} />
            <h2 className="text-xl font-bold">التعلم البصري</h2>
          </div>
          <p className="text-slate-500 text-sm">
            قم بإنشاء صور تساعدك على تذكر المفردات أو تخيل المواقف.
          </p>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">الوصف (Prompt)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="مثال: A cat reading a book in a library..."
              className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none text-left"
              dir="ltr"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">يفضل الكتابة بالإنجليزية لدقة أعلى.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Frame size={16} />
              أبعاد الصورة
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ratios.map(r => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r as any)}
                  className={`
                    py-2 px-3 rounded-lg text-sm font-medium border transition-all
                    ${aspectRatio === r 
                      ? 'bg-purple-100 border-purple-500 text-purple-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold shadow-lg shadow-purple-200 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <SparklesIcon />}
            توليد الصورة
          </button>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-6 bg-slate-100 flex items-center justify-center overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
             <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <p className="text-purple-600 font-medium animate-pulse">جارٍ رسم الصورة...</p>
          </div>
        ) : result ? (
          <div className="flex flex-col items-center max-w-full">
            <div className="relative group rounded-2xl overflow-hidden shadow-2xl bg-white p-2">
              <img 
                src={result.url} 
                alt={result.prompt} 
                className="max-h-[70vh] object-contain rounded-xl"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <a 
                  href={result.url} 
                  download={`generated-image-${Date.now()}.png`}
                  className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg"
                >
                  <Download size={24} />
                </a>
              </div>
            </div>
            <p className="mt-4 text-slate-500 italic text-center max-w-lg">"{result.prompt}"</p>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
            <p>أدخل وصفاً واختر الأبعاد لبدء التوليد</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
  </svg>
);

export default ImageGenerator;