import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Film, Loader2, Play } from 'lucide-react';

export const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  // Helper: Convert File to Base64
  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setLoading(true);
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const videoPart = await fileToGenerativePart(videoFile);
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                videoPart as any,
                { text: prompt || "Describe this video in detail." }
            ]
        }
      });
      
      setResponse(res.text || "No insights generated.");

    } catch (error: any) {
        // Handle payload size limits gracefully in UI
      if (error.message.includes('413') || error.message.includes('Too Large')) {
          setResponse("Error: The video is too large for client-side processing. Please try a shorter clip (< 5MB) for this web demo.");
      } else {
          setResponse(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <Film className="text-blue-500" />
            Video Understanding
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center bg-[#40414f] h-48 relative">
                    <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="text-center">
                        <Upload className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-400">{videoFile ? videoFile.name : "Upload video (short clips)"}</p>
                    </div>
                </div>

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask something about the video..."
                    className="w-full bg-[#40414f] text-white p-4 rounded-lg outline-none resize-none h-24"
                />

                <button
                    onClick={handleAnalyze}
                    disabled={loading || !videoFile}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Analyze Video"}
                </button>
                <p className="text-xs text-gray-500 text-center">* Note: Browser-based demo limited to small file sizes.</p>
            </div>

            <div className="bg-[#40414f] rounded-lg p-6 h-full min-h-[300px] overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-300 mb-4">Analysis Results</h3>
                {response ? (
                    <div className="whitespace-pre-wrap text-gray-200">{response}</div>
                ) : (
                    <div className="text-gray-500 text-sm italic">Analysis will appear here...</div>
                )}
            </div>
        </div>
    </div>
  );
};