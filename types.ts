export enum ToolMode {
  Search = 'Search Grounding',
  ImageEdit = 'Image Editor',
  Veo = 'Video Generation',
  Live = 'Live Conversation',
  ProImage = 'Pro Image Gen',
  VideoAnalyze = 'Video Understanding',
  TTS = 'Text to Speech'
}

export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  image?: string;
  video?: string;
  audio?: string;
  sources?: { uri: string; title: string }[];
}

// Window augmentation for AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
