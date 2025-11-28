import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";
import { GeneratedImage, ImageGenerationConfig, TtsVoice } from "../types";
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from "./audioUtils";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// --- Chat Service ---
export const createChatSession = (systemInstruction: string, useThinking: boolean = false) => {
  // Use Pro for thinking, Flash for speed if not thinking.
  // Although the prompt says "Use Pro for complex tasks", standard chat might default to Flash unless thinking is on.
  // However, "AI powered chatbot" requirement specifies gemini-3-pro-preview.
  const model = 'gemini-3-pro-preview';
  
  const config: any = {
    systemInstruction,
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  return ai.chats.create({
    model,
    config,
  });
};

// --- Image Generation Service ---
export const generateImage = async (config: ImageGenerationConfig): Promise<GeneratedImage> => {
  const model = 'gemini-3-pro-image-preview';
  
  // The prompt requires using generateContent for this model, not generateImages
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: config.prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        imageSize: "1K"
      }
    }
  });

  let imageUrl = '';
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No image generated.");
  }

  return {
    url: imageUrl,
    prompt: config.prompt
  };
};

// --- TTS Service ---
export const generateSpeech = async (text: string, voice: TtsVoice): Promise<AudioBuffer> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(
    base64ToUint8Array(base64Audio),
    audioContext,
    24000,
    1
  );
  
  // Clean up context since we just want the buffer
  await audioContext.close();
  
  return audioBuffer;
};

// --- Transcription Service ---
export const transcribeAudio = async (audioDataBase64: string, mimeType: string): Promise<string> => {
  const model = "gemini-2.5-flash"; // Requirement

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: audioDataBase64,
            mimeType: mimeType
          }
        },
        {
          text: "Please transcribe the audio exactly as spoken in English. If there are errors, transcribe the errors."
        }
      ]
    }
  });

  return response.text || "";
};

// --- Live API Helper ---
export class LiveSessionManager {
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime: number = 0;
  private sources = new Set<AudioBufferSourceNode>();
  
  private onStatusChange: (status: { isConnected: boolean; error: string | null }) => void;

  constructor(onStatusChange: (status: { isConnected: boolean; error: string | null }) => void) {
    this.onStatusChange = onStatusChange;
  }

  async connect() {
    this.onStatusChange({ isConnected: false, error: null });

    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: "You are a helpful, patient English tutor for an Arabic speaker. Speak clearly and simply. Correct their grammar if they make mistakes, but be encouraging. Do not speak Arabic unless explaining a very difficult concept."
        },
        callbacks: {
          onopen: () => {
            console.log('Live session opened');
            this.onStatusChange({ isConnected: true, error: null });
            this.startAudioStreaming(stream);
          },
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && this.outputAudioContext) {
                 this.handleAudioOutput(base64Audio);
             }

             if (message.serverContent?.interrupted) {
                 this.stopCurrentAudio();
             }
          },
          onclose: () => {
             console.log('Live session closed');
             this.onStatusChange({ isConnected: false, error: null });
             this.cleanup();
          },
          onerror: (err) => {
             console.error('Live session error', err);
             this.onStatusChange({ isConnected: false, error: "Connection error" });
          }
        }
      });

    } catch (error: any) {
      this.onStatusChange({ isConnected: false, error: error.message || "Failed to connect" });
    }
  }

  private startAudioStreaming(stream: MediaStream) {
    if (!this.inputAudioContext || !this.sessionPromise) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        this.sessionPromise?.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleAudioOutput(base64Audio: string) {
    if (!this.outputAudioContext) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

    const audioBuffer = await decodeAudioData(
        base64ToUint8Array(base64Audio),
        this.outputAudioContext,
        24000,
        1
    );

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination); // Simple routing to destination
    
    source.addEventListener('ended', () => {
        this.sources.delete(source);
    });

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
  }

  private stopCurrentAudio() {
      this.sources.forEach(s => s.stop());
      this.sources.clear();
      this.nextStartTime = 0;
  }

  disconnect() {
    // There is no explicit disconnect method on the session object exposed in the prompt docs directly
    // apart from potentially closing the promise context or just stopping local tracks.
    // The prompt says "When the conversation is finished, use session.close()".
    if (this.sessionPromise) {
        this.sessionPromise.then(session => session.close());
    }
    this.cleanup();
  }

  private cleanup() {
    this.stopCurrentAudio();
    if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
    }
    if (this.inputSource) {
        this.inputSource.disconnect();
        this.inputSource = null;
    }
    if (this.inputAudioContext) {
        this.inputAudioContext.close();
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        this.outputAudioContext.close();
        this.outputAudioContext = null;
    }
  }
}
