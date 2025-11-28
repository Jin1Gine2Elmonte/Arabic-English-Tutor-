import { Modality } from "@google/genai";

export enum AppView {
  CHAT = 'chat',
  LIVE = 'live',
  IMAGES = 'images',
  PRONUNCIATION = 'pronunciation',
  READING = 'reading',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface ImageGenerationConfig {
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  prompt: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export enum TtsVoice {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface LiveConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface LiveTranscriptItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  isComplete: boolean;
}