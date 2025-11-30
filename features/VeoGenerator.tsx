import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Video, Loader2 } from 'lucide-react';
import { PaidFeatureWrapper } from '../components/PaidFeatureWrapper';

export const VeoGenerator: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image || !preview) return;
    setLoading(true);
    setStatus('Initializing generation...');
    setVideoUrl(null);

    try {
      // Create new instance to ensure key is fresh from selection
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = preview.split(',')[1];

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        image: {
          imageBytes: base64Data,
          mimeType: image.type,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p', // fast-generate-preview typically 720p or 1080p
          aspectRatio: aspectRatio,
        }
      });

      setStatus('Veo is dreaming (this may take a minute)...');

      // Poll until done
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await ai.operations.getVideosOperation({operation: operation});
        setStatus('Still processing...');
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        // The URI requires the API Key appended
        const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        
        // Fetch it to ensure we can display/download
        setStatus('Downloading video...');
        // We can just set the src to the URL with key for the video tag
        setVideoUrl(finalUrl);
      } else {
        throw new Error("No video URI returned.");
      }

    } catch (error: any) {
      console.error(error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <PaidFeatureWrapper>
      <div className="flex flex-col h-full overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <Video className="text-pink-500"/>
            Veo Animator
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center bg-[#40414f] h-64 relative">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {preview ? (
                        <img src={preview} alt="Source" className="max-h-full object-contain" />
                    ) : (
                        <div className="text-center">
                            <Upload className="mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-400">Upload source image</p>
                        </div>
                    )}
                </div>

                <div className="bg-[#40414f] p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setAspectRatio('16:9')}
                            className={`flex-1 py-2 px-4 rounded border ${aspectRatio === '16:9' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-600 text-gray-400'}`}
                        >
                            Landscape (16:9)
                        </button>
                        <button 
                            onClick={() => setAspectRatio('9:16')}
                            className={`flex-1 py-2 px-4 rounded border ${aspectRatio === '9:16' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-600 text-gray-400'}`}
                        >
                            Portrait (9:16)
                        </button>
                    </div>
                </div>

                <button
                    onClick={generateVideo}
                    disabled={loading || !image}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Generate with Veo"}
                </button>
                {status && <p className="text-center text-sm text-yellow-400 animate-pulse">{status}</p>}
            </div>

            <div className="bg-black/50 rounded-lg flex items-center justify-center min-h-[300px] border border-white/10">
                {videoUrl ? (
                    <video controls autoPlay loop className="max-w-full max-h-[500px] rounded">
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <div className="text-gray-500 text-sm">Generated video will appear here</div>
                )}
            </div>
        </div>
      </div>
    </PaidFeatureWrapper>
  );
};