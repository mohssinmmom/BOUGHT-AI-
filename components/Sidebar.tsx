import React from 'react';
import { ToolMode } from '../types';
import { 
  Search, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  Zap, 
  Film, 
  Volume2, 
  X
} from 'lucide-react';

interface SidebarProps {
  currentTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTool, onSelectTool, isOpen, onClose }) => {
  const tools = [
    { mode: ToolMode.Search, icon: <Search size={18} />, label: "Search Grounding" },
    { mode: ToolMode.ImageEdit, icon: <ImageIcon size={18} />, label: "Image Editor" },
    { mode: ToolMode.Veo, icon: <Video size={18} />, label: "Veo Video Gen" },
    { mode: ToolMode.Live, icon: <Mic size={18} />, label: "Live Conversation" },
    { mode: ToolMode.ProImage, icon: <Zap size={18} />, label: "Pro Image Gen" },
    { mode: ToolMode.VideoAnalyze, icon: <Film size={18} />, label: "Video Analysis" },
    { mode: ToolMode.TTS, icon: <Volume2 size={18} />, label: "Text to Speech" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed top-0 left-0 bottom-0 w-64 bg-[#202123] z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 border-r border-white/10
      `}>
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center text-sm">AI</span>
            BOUGHT AI
          </h1>
          <button onClick={onClose} className="md:hidden text-gray-300">
            <X size={24} />
          </button>
        </div>

        <nav className="px-2 space-y-1 mt-4">
          {tools.map((tool) => (
            <button
              key={tool.mode}
              onClick={() => {
                onSelectTool(tool.mode);
                if (window.innerWidth < 768) onClose();
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors
                ${currentTool === tool.mode 
                  ? 'bg-[#343541] text-white' 
                  : 'text-gray-300 hover:bg-[#2A2B32] hover:text-white'}
              `}
            >
              {tool.icon}
              {tool.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 text-xs text-gray-500">
          Powered by Gemini 2.5 & 3.0
        </div>
      </div>
    </>
  );
};