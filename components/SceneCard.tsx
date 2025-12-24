
import React from 'react';
import { Scene, AspectRatio } from '../types';
import Button from './Button';

interface SceneCardProps {
  scene: Scene;
  aspectRatio: AspectRatio;
  onGenerateImage: (id: string) => void;
  onCopyPrompt: (prompt: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, aspectRatio, onGenerateImage, onCopyPrompt }) => {
  const aspectClass = {
    "1:1": "aspect-square",
    "16:9": "aspect-video",
    "9:16": "aspect-[9/16]",
    "3:4": "aspect-[3/4]",
    "4:3": "aspect-[4/3]"
  }[aspectRatio];

  const handleDownload = () => {
    if (!scene.imageUrl) return;
    const link = document.createElement('a');
    link.href = scene.imageUrl;
    link.download = `s2m-scene-${scene.index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass group rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all duration-300">
      <div className={`relative bg-neutral-900 flex items-center justify-center overflow-hidden ${aspectClass}`}>
        {scene.imageUrl ? (
          <>
            <img 
              src={scene.imageUrl} 
              alt={`Scene ${scene.index}`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="primary" onClick={handleDownload} className="rounded-xl">
                Download
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-neutral-500 p-8 text-center">
            {scene.isGeneratingImage ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] uppercase tracking-widest font-medium">Developing Visual...</span>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => onGenerateImage(scene.id)}
                className="text-xs border-dashed border-neutral-600"
              >
                Generate Visual
              </Button>
            )}
          </div>
        )}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 pointer-events-none">
          <span className="text-[10px] font-bold text-white tracking-widest uppercase">Scene {scene.index}</span>
        </div>
      </div>
      
      <div className="p-5">
        <p className="text-sm text-neutral-300 leading-relaxed font-light italic mb-4 line-clamp-3 hover:line-clamp-none transition-all cursor-default">
          "{scene.prompt}"
        </p>
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onCopyPrompt(scene.prompt)}
            className="text-[10px] px-3 uppercase tracking-tighter"
            icon={
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            }
          >
            Copy Prompt
          </Button>
          {!scene.imageUrl && !scene.isGeneratingImage ? (
             <span className="text-[10px] text-neutral-600 uppercase tracking-widest">Pending</span>
          ) : scene.imageUrl ? (
            <button onClick={handleDownload} className="text-indigo-500 hover:text-indigo-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
