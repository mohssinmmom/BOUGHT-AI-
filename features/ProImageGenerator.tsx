import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Zap, Loader2, Image as ImageIcon } from 'lucide-react';
import { PaidFeatureWrapper } from '../components/PaidFeatureWrapper';

export const ProImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResultImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            imageSize: size,
            aspectRatio: "1:1"
          },
        },
      });

      // Parse output
      if (response.candidates?.[0]?.content?.parts) {
         for (const part of response.candidates[0].content.parts) {
             if (part.inlineData) {
                 const url = `data:image/png;base64,${part.inlineData.data}`;
                 setResultImage(url);
                 break;
             }
         }
      }

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaidFeatureWrapper>
      <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Nano Banana Pro Image Gen
        </h2>

        <div className="bg-[#40414f] rounded-lg p-6 mb-8">
            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a highly detailed image..."
                    className="flex-1 bg-[#343541] text-white p-4 rounded-lg outline-none focus:ring-1 focus:ring-yellow-500"
                />
                <select 
                    value={size}
                    onChange={(e) => setSize(e.target.value as any)}
                    className="bg-[#343541] text-white p-4 rounded-lg outline-none cursor-pointer"
                >
                    <option value="1K">1K</option>
                    <option value="2K">2K</option>
                    <option value="4K">4K</option>
                </select>
            </div>
            <button
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" /> : "Generate High-Fidelity Image"}
            </button>
        </div>

        <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg border border-white/5 min-h-[400px]">
             {resultImage ? (
                 <img src={resultImage} alt="Generated" className="max-w-full rounded shadow-2xl" />
             ) : (
                 <div className="text-center text-gray-500">
                     <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                     {loading ? "Generating..." : "Result will appear here"}
                 </div>
             )}
        </div>
      </div>
    </PaidFeatureWrapper>
  );
};