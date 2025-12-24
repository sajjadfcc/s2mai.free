
import React, { useState, useCallback, useRef } from 'react';
import { Scene, AppState } from './types';
import { generatePrompts, generateImage } from './services/geminiService';
import Button from './components/Button';
import SceneCard from './components/SceneCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    story: '',
    sceneCount: 3,
    generatedScenes: [],
    thumbnailPrompt: '',
    isGeneratingPrompts: false,
    error: null,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (isAddingMore: boolean = false) => {
    if (!state.story.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a story first.' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isGeneratingPrompts: true, 
      error: null 
    }));

    try {
      const response = await generatePrompts(
        state.story, 
        state.sceneCount, 
        isAddingMore ? state.generatedScenes.length : 0
      );
      
      const newScenes: Scene[] = response.scenes.map((prompt, idx) => ({
        id: Math.random().toString(36).substr(2, 9),
        index: (isAddingMore ? state.generatedScenes.length : 0) + idx + 1,
        prompt,
      }));

      setState(prev => ({
        ...prev,
        generatedScenes: isAddingMore ? [...prev.generatedScenes, ...newScenes] : newScenes,
        thumbnailPrompt: response.thumbnail,
        isGeneratingPrompts: false
      }));

      // Small delay to ensure render happens before scroll
      setTimeout(() => {
        if (isAddingMore) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }, 100);

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isGeneratingPrompts: false, 
        error: err.message.includes('entity was not found') 
          ? 'Session expired. Please try refreshing or check your connection.' 
          : 'An error occurred while generating prompts. Please try again.'
      }));
    }
  };

  const handleGenerateImage = async (id: string) => {
    const scene = state.generatedScenes.find(s => s.id === id);
    if (!scene || scene.imageUrl || scene.isGeneratingImage) return;

    setState(prev => ({
      ...prev,
      generatedScenes: prev.generatedScenes.map(s => 
        s.id === id ? { ...s, isGeneratingImage: true } : s
      )
    }));

    try {
      const imageUrl = await generateImage(scene.prompt);
      setState(prev => ({
        ...prev,
        generatedScenes: prev.generatedScenes.map(s => 
          s.id === id ? { ...s, imageUrl, isGeneratingImage: false } : s
        )
      }));
    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        generatedScenes: prev.generatedScenes.map(s => 
          s.id === id ? { ...s, isGeneratingImage: false } : s
        )
      }));
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!state.thumbnailPrompt || state.thumbnailUrl) return;
    
    // Using a temp flag or extra state for thumbnail generation
    try {
      const url = await generateImage(state.thumbnailPrompt);
      setState(prev => ({ ...prev, thumbnailUrl: url }));
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const copyAllPrompts = () => {
    const all = state.generatedScenes.map(s => `Scene ${s.index}:\n"${s.prompt}"`).join('\n\n');
    const final = `🖼️ IMAGE PROMPTS:\n${all}\n\n🎬 THUMBNAIL PROMPT:\n"${state.thumbnailPrompt}"`;
    copyToClipboard(final);
  };

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-indigo-500/30">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-900/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-900/40 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-24">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Powered by Gemini AI</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-serif font-bold mb-6 italic gradient-text">
            S2M AI
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Story-to-Media Generator. Transform narratives into visually stunning, cinematic image prompts and realistic visuals.
          </p>
        </header>

        {/* Input Section */}
        <section className="glass rounded-3xl p-8 lg:p-12 mb-16 shadow-2xl">
          <div className="space-y-8">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-neutral-500 mb-4">The Narrative</label>
              <textarea
                value={state.story}
                onChange={(e) => setState(prev => ({ ...prev, story: e.target.value }))}
                placeholder="Once upon a time in a cyberpunk metropolis, a lone wanderer discovered an ancient garden hidden beneath the neon lights..."
                className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-6 text-white placeholder:text-neutral-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all outline-none min-h-[180px] text-lg leading-relaxed font-light"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-full border border-neutral-800">
                <span className="text-xs uppercase tracking-widest font-bold text-neutral-500">Scenes:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={state.sceneCount}
                  onChange={(e) => setState(prev => ({ ...prev, sceneCount: parseInt(e.target.value) || 1 }))}
                  className="bg-transparent text-white w-12 font-bold focus:outline-none text-center border-b border-neutral-700"
                />
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                <Button 
                  onClick={() => handleGenerate(false)} 
                  isLoading={state.isGeneratingPrompts}
                  className="flex-1 sm:flex-none py-4 px-10 text-lg rounded-2xl"
                >
                  {state.generatedScenes.length > 0 ? 'Regenerate All' : 'Generate Media'}
                </Button>
              </div>
            </div>

            {state.error && (
              <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {state.error}
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        {state.generatedScenes.length > 0 && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-neutral-800 pb-8">
              <div>
                <h2 className="text-3xl font-serif italic text-white mb-2">Generated Media Plan</h2>
                <p className="text-neutral-500 text-sm">Visual storyboard developed from your story.</p>
              </div>
              <Button variant="outline" onClick={copyAllPrompts} className="rounded-xl">
                Copy All Prompts
              </Button>
            </div>

            {/* Thumbnail Feature */}
            {state.thumbnailPrompt && (
              <div className="glass rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-center bg-indigo-500/5 border-indigo-500/20">
                <div className="w-full lg:w-1/3 aspect-[4/5] bg-neutral-900 rounded-2xl overflow-hidden relative group border border-white/5">
                  {state.thumbnailUrl ? (
                    <img src={state.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                       <Button 
                        variant="ghost" 
                        className="text-indigo-400 hover:text-indigo-300"
                        onClick={handleGenerateThumbnail}
                      >
                        Generate Hero Poster
                      </Button>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-indigo-600 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Story Poster</span>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-indigo-500 mb-4 block">Thumbnail Concept</span>
                  <p className="text-2xl font-serif italic leading-relaxed text-neutral-200 mb-6">
                    "{state.thumbnailPrompt}"
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(state.thumbnailPrompt)}
                    className="text-xs text-neutral-500 uppercase tracking-widest hover:text-white"
                  >
                    Copy Hero Prompt
                  </Button>
                </div>
              </div>
            )}

            {/* Scenes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {state.generatedScenes.map((scene) => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  onGenerateImage={handleGenerateImage}
                  onCopyPrompt={copyToClipboard}
                />
              ))}
              
              {/* Add More Scene Button Placeholder */}
              <div 
                className="group border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer min-h-[300px]"
                onClick={() => handleGenerate(true)}
              >
                {state.isGeneratingPrompts ? (
                  <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-neutral-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-neutral-500 uppercase tracking-widest text-xs font-bold group-hover:text-indigo-400">Add More Scenes</span>
                  </>
                )}
              </div>
            </div>

            <div className="pt-12 flex justify-center">
               <div className="text-center space-y-4">
                  <p className="text-neutral-600 text-xs uppercase tracking-widest">End of Narrative Flow</p>
                  <Button variant="ghost" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-neutral-500 hover:text-white">
                    Back to Top
                  </Button>
               </div>
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 py-12 border-t border-neutral-900 text-center">
        <p className="text-neutral-600 text-xs tracking-widest uppercase">
          &copy; {new Date().getFullYear()} S2M AI Generator &bull; Developed with Precision
        </p>
      </footer>
    </div>
  );
};

export default App;
