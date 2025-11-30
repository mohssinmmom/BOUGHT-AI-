import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Send, Loader2, ArrowRight } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      setResultImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    setResultImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Convert base64
      const base64Data = preview?.split(',')[1];
      if (!base64Data) throw new Error("Image processing failed");

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: image.type,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      // Find image part in response
      // It might be mixed with text, look for inlineData
      if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                  const imgUrl = `data:image/png;base64,${part.inlineData.data}`;
                  setResultImage(imgUrl);
                  break;
              }
          }
      } else {
          alert('No image generated. The model might have refused the request.');
      }

    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 max-w-5xl mx-auto w-full">
      <h2 className="text-2xl font-bold mb-6 text-white">Nano Banana Image Editor</h2>
      
      <div className="grid md:grid-cols-2 gap-8 h-full">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-[#40414f] hover:bg-[#444654] transition-colors relative h-64">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-full object-contain" />
            ) : (
              <>
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-400">Upload an image to edit</p>
              </>
            )}
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Add a retro filter' or 'Remove the person in background'"
              className="w-full bg-[#40414f] text-white p-4 rounded-lg outline-none resize-none h-32 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !image || !prompt}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Generate Edit</>}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-[#40414f] rounded-lg p-1 flex items-center justify-center min-h-[400px]">
          {resultImage ? (
            <img src={resultImage} alt="Edited Result" className="max-w-full max-h-full rounded" />
          ) : (
            <div className="text-center text-gray-500">
               {loading ? (
                   <div className="flex flex-col items-center gap-4">
                       <Loader2 className="animate-spin w-10 h-10 text-emerald-500" />
                       <p>Nano Banana is thinking...</p>
                   </div>
               ) : (
                   <p>Generated image will appear here</p>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};