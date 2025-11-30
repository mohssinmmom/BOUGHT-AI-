import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ToolMode } from './types';
import { SearchGrounding } from './features/SearchGrounding';
import { ImageEditor } from './features/ImageEditor';
import { VeoGenerator } from './features/VeoGenerator';
import { LiveConversation } from './features/LiveConversation';
import { ProImageGenerator } from './features/ProImageGenerator';
import { VideoAnalyzer } from './features/VideoAnalyzer';
import { TextToSpeech } from './features/TextToSpeech';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolMode>(ToolMode.Search);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderTool = () => {
    switch (currentTool) {
      case ToolMode.Search: return <SearchGrounding />;
      case ToolMode.ImageEdit: return <ImageEditor />;
      case ToolMode.Veo: return <VeoGenerator />;
      case ToolMode.Live: return <LiveConversation />;
      case ToolMode.ProImage: return <ProImageGenerator />;
      case ToolMode.VideoAnalyze: return <VideoAnalyzer />;
      case ToolMode.TTS: return <TextToSpeech />;
      default: return <SearchGrounding />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#343541]">
      <Sidebar 
        currentTool={currentTool} 
        onSelectTool={setCurrentTool} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative h-full">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center p-4 border-b border-white/10 bg-[#343541]">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 mr-4">
            <Menu size={24} />
          </button>
          <span className="text-white font-bold">BOUGHT AI</span>
        </div>

        {/* Top Bar for Desktop Visuals */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-white/10 bg-[#343541]">
            <div className="text-gray-400 text-sm font-medium">{currentTool}</div>
            <div className="text-gray-500 text-xs">Model: Gemini 2.5 / 3.0</div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {renderTool()}
        </div>
      </main>
    </div>
  );
};

export default App;