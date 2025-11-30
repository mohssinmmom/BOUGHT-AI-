import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Loader2, Globe } from 'lucide-react';
import { Message } from '../types';

export const SearchGrounding: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const prompt = input;
    setInput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No response generated.";
      
      // Extract grounding sources
      // @ts-ignore - The SDK types might lag behind grounding metadata structure in some versions
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .filter((c: any) => c.web?.uri && c.web?.title)
        .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));

      setMessages(prev => [...prev, { role: 'model', content: text, sources }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Globe size={48} className="mb-4 opacity-50" />
            <p>Ask anything. Real-time search enabled.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-purple-600' : 'bg-emerald-600'}`}>
              {msg.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className={`p-4 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-[#40414f]' : 'bg-[#444654]'}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs font-bold text-gray-400 mb-2">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((s, i) => (
                      <a 
                        key={i} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs bg-black/20 hover:bg-black/40 px-2 py-1 rounded text-blue-300 truncate max-w-[200px]"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center"><Loader2 className="animate-spin w-4 h-4"/></div>
              <div className="bg-[#444654] p-4 rounded-lg">Searching web...</div>
            </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-[#343541]">
        <div className="relative flex items-center bg-[#40414f] rounded-xl shadow-lg border border-black/10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Search the web..."
            className="w-full bg-transparent text-white p-4 pr-12 outline-none rounded-xl"
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-3 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};