import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export const LiveConversation: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Ready to connect");
  const [volume, setVolume] = useState(0); // For visualizer

  // Refs for audio processing to avoid stale closures
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Helper: Create PCM Blob (from SDK Guidance)
  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    // Manual encode function as per instructions
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    return {
      data: b64,
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  // Helper: Decode Base64 (from SDK Guidance)
  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Helper: Decode Audio Data (from SDK Guidance)
  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const startSession = async () => {
    try {
      setStatus("Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;

      setStatus("Connecting to Gemini 2.5...");

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus("Connected! Speak now.");
            setActive(true);

            // Stream Audio Input
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple volume meter logic
              let sum = 0;
              for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              const pcmBlob = createBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                  decode(base64Audio),
                  ctx,
                  24000,
                  1
                );

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
             }

             // Handle Interruption
             if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
            setStatus("Disconnected");
            setActive(false);
          },
          onerror: (e) => {
            console.error(e);
            setStatus("Error occurred");
            setActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "You are a helpful and witty AI assistant named BOUGHT AI.",
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message}`);
      stopSession();
    }
  };

  const stopSession = () => {
    // There is no direct .close() on session object in the provided snippet logic, 
    // usually we stop sending and close AudioContexts.
    // However, prompts mentions session.close(). 
    // We will attempt to close if the promise resolved.
    
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then((session: any) => {
             // Attempt graceful close if method exists
             if (session.close) session.close(); 
        });
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    
    setActive(false);
    setStatus("Ready to connect");
    setVolume(0);
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className={`
        w-48 h-48 rounded-full flex items-center justify-center transition-all duration-100 mb-8
        ${active ? 'bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'bg-gray-700/50'}
      `}
      style={{ transform: `scale(${1 + volume * 5})` }} // Simple visualizer
      >
        <div className={`w-32 h-32 rounded-full flex items-center justify-center ${active ? 'bg-red-600' : 'bg-gray-600'}`}>
          {active ? <Volume2 size={48} className="text-white animate-pulse" /> : <Mic size={48} className="text-gray-300" />}
        </div>
      </div>

      <h2 className="text-3xl font-bold text-white mb-2">Live Conversation</h2>
      <p className="text-gray-400 mb-8 max-w-md">{status}</p>

      {!active ? (
        <button
          onClick={startSession}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-12 rounded-full flex items-center gap-3 transition-transform hover:scale-105"
        >
          <Mic size={24} />
          Start Conversation
        </button>
      ) : (
        <button
          onClick={stopSession}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-full flex items-center gap-3 transition-transform hover:scale-105"
        >
          <MicOff size={24} />
          End Call
        </button>
      )}
      
      <p className="mt-8 text-xs text-gray-500">Powered by Gemini 2.5 Native Audio</p>
    </div>
  );
};