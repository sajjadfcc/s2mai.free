
import React, { useState, useEffect } from 'react';
import { Scene, AppState, AspectRatio } from './types';
import { generatePrompts, generateImage } from './services/geminiService';
import Button from './components/Button';
import SceneCard from './components/SceneCard';

// The 'aistudio' global is already pre-configured and typed as 'AIStudio' in the environment.
// Manual declaration is removed to avoid conflict.

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);

  const [state, setState] = useState<AppState>({
    story: '',
    sceneCount: 3,
    aspectRatio: '16:9',
    generatedScenes: [],
    thumbnailPrompt: '',
    thumbnailUrl: undefined,
    isGeneratingPrompts: false,
    isGeneratingThumbnail: false,
    error: null,
  });

  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore: aistudio is globally available but might not be on the current Window type
        if (window.aistudio) {
          // @ts-ignore
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } else {
          // If not in an environment with aistudio global, assume key is provided via process.env
          setHasApiKey(!!process.env.API_KEY);
        }
      } catch (e) {
        console.error("Error checking API key selection", e);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    try {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setHasApiKey(true); // Proceed assuming success as per guidelines
      }
    } catch (e) {
      console.error("Error opening key dialog", e);
    }
  };

  const aspectClassMap: Record<AspectRatio, string> = {
    "1:1": "aspect-square",
    "16:9": "aspect-video",
    "9:16": "aspect-[9/16]",
    "3:4": "aspect-[3/4]",
    "4:3": "aspect-[4/3]"
  };

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

      if (isAddingMore) {
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      // Handle the specific "Rpc failed" or key missing errors
      if (msg.includes("Requested entity was not found") || msg.includes("xhr error") || msg.includes("6")) {
        setHasApiKey(false);
        setState(prev => ({ 
          ...prev, 
          isGeneratingPrompts: false, 
          error: 'API key verification failed. Please select a valid API key.' 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isGeneratingPrompts: false, 
          error: 'Generation failed. Please try again with a different story or check your connection.'
        }));
      }
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
      const imageUrl = await generateImage(scene.prompt, state.aspectRatio);
      setState(prev => ({
        ...prev,
        generatedScenes: prev.generatedScenes.map(s => 
          s.id === id ? { ...s, imageUrl, isGeneratingImage: false } : s
        )
      }));
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
      setState(prev => ({
        ...prev,
        generatedScenes: prev.generatedScenes.map(s => 
          s.id === id ? { ...s, isGeneratingImage: false } : s
        )
      }));
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!state.thumbnailPrompt || state.thumbnailUrl || state.isGeneratingThumbnail) return;
    
    setState(prev => ({ ...prev, isGeneratingThumbnail: true }));
    try {
      const url = await generateImage(state.thumbnailPrompt, state.aspectRatio);
      setState(prev => ({ ...prev, thumbnailUrl: url, isGeneratingThumbnail: false }));
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
      setState(prev => ({ ...prev, isGeneratingThumbnail: false }));
    }
  };

  const handleDownloadThumbnail = () => {
    if (!state.thumbnailUrl) return;
    const link = document.createElement('a');
    link.href = state.thumbnailUrl;
    link.download = `s2m-hero-poster-${state.aspectRatio.replace(':', '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllPrompts = () => {
    const all = state.generatedScenes.map(s => `Scene ${s.index}:\n"${s.prompt}"`).join('\n\n');
    const final = `🖼️ IMAGE PROMPTS:\n${all}\n\n🎬 THUMBNAIL PROMPT:\n"${state.thumbnailPrompt}"`;
    copyToClipboard(final);
  };

  const aspectRatios: AspectRatio[] = ["16:9", "9:16", "1:1", "4:3", "3:4"];

  if (checkingKey) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!hasApiKey && window.aistudio) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="glass max-w-md w-full p-10 rounded-3xl text-center space-y-8 border-indigo-500/20">
          <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-serif italic text-white">Access Cinematic AI</h1>
            <p className="text-neutral-400 font-light leading-relaxed">
              To use the S2M AI Cinematic Lab, you must select an API key from a paid GCP project.
            </p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest font-bold"
            >
              Learn about billing →
            </a>
          </div>
          <Button onClick={handleOpenKeyDialog} className="w-full py-4 rounded-2xl text-lg">
            Select API Key
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-900/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-900/40 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-24">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Cinematic AI Lab</span>
          </div>
          <h1 className="text-6xl lg:text-8xl font-serif font-bold mb-6 italic gradient-text tracking-tighter">
            S2M AI
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Story-to-Media. Precise AI cinematography for your narratives.
          </p>
        </header>

        <section className="glass rounded-3xl p-8 lg:p-12 mb-16 shadow-2xl">
          <div className="space-y-8">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-neutral-500 mb-4">Original Story</label>
              <textarea
                value={state.story}
                onChange={(e) => setState(prev => ({ ...prev, story: e.target.value }))}
                placeholder="Enter your story here... any language."
                className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-6 text-white placeholder:text-neutral-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all outline-none min-h-[160px] text-lg leading-relaxed font-light"
              />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="flex flex-col gap-4">
                <label className="block text-xs uppercase tracking-widest font-bold text-neutral-500">Visual Settings</label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-4 bg-black/40 px-5 py-2.5 rounded-full border border-neutral-800">
                    <span className="text-xs font-bold text-neutral-600">SCENES</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={state.sceneCount}
                      onChange={(e) => setState(prev => ({ ...prev, sceneCount: parseInt(e.target.value) || 1 }))}
                      className="bg-transparent text-white w-8 font-bold focus:outline-none text-center"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 bg-black/40 px-2 py-2 rounded-full border border-neutral-800">
                    {aspectRatios.map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setState(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                          state.aspectRatio === ratio 
                            ? 'bg-white text-black shadow-lg shadow-white/10' 
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <Button 
                  onClick={() => handleGenerate(false)} 
                  isLoading={state.isGeneratingPrompts}
                  className="flex-1 md:flex-none py-4 px-12 text-lg rounded-2xl"
                  variant="primary"
                >
                  {state.generatedScenes.length > 0 ? 'Regenerate' : 'Generate Media Plan'}
                </Button>
              </div>
            </div>

            {state.error && (
              <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs tracking-wide">
                {state.error}
              </div>
            )}
          </div>
        </section>

        {state.generatedScenes.length > 0 && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-neutral-800 pb-8">
              <div>
                <h2 className="text-4xl font-serif italic text-white mb-2">Director's Board</h2>
                <p className="text-neutral-500 text-sm">Target aspect ratio: {state.aspectRatio}</p>
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" onClick={copyAllPrompts} className="rounded-xl">
                    Copy All Prompts
                  </Button>
              </div>
            </div>

            {state.thumbnailPrompt && (
              <div className="glass rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row gap-8 items-center bg-indigo-500/5 border-indigo-500/20">
                <div className={`w-full md:max-w-[450px] bg-neutral-900 rounded-2xl overflow-hidden relative group border border-white/5 shadow-2xl ${aspectClassMap[state.aspectRatio]}`}>
                  {state.thumbnailUrl ? (
                    <>
                      <img src={state.thumbnailUrl} alt="Hero Poster" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="primary" onClick={handleDownloadThumbnail} className="rounded-xl">
                          Download Poster
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                       <Button 
                        variant="outline" 
                        isLoading={state.isGeneratingThumbnail}
                        onClick={handleGenerateThumbnail}
                        className="border-indigo-500/30 text-indigo-400"
                      >
                        Generate Hero Poster
                      </Button>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-indigo-600 px-3 py-1 rounded-full pointer-events-none z-20">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Master Key Visual</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-indigo-500 mb-4 block">Visual Summary</span>
                  <p className="text-2xl font-serif italic leading-relaxed text-neutral-200 mb-8 max-w-xl">
                    "{state.thumbnailPrompt}"
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(state.thumbnailPrompt)}
                      className="text-xs text-neutral-500 hover:text-white"
                    >
                      Copy Prompt
                    </Button>
                    {state.thumbnailUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDownloadThumbnail}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Download Image
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {state.generatedScenes.map((scene) => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  aspectRatio={state.aspectRatio}
                  onGenerateImage={handleGenerateImage}
                  onCopyPrompt={copyToClipboard}
                />
              ))}
              
              <div 
                className="group border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer min-h-[350px]"
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
                    <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold group-hover:text-indigo-400">Expand Storyboard</span>
                  </>
                )}
              </div>
            </div>

            <div className="pt-24 flex justify-center">
               <div className="text-center space-y-4">
                  <p className="text-neutral-700 text-[10px] uppercase tracking-[0.4em]">Cinematic Blueprint Complete</p>
                  <Button variant="ghost" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-neutral-600 hover:text-white">
                    Restart Narrative
                  </Button>
               </div>
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 py-16 border-t border-neutral-900/50 text-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-neutral-600 text-[10px] tracking-[0.3em] uppercase">
          &copy; {new Date().getFullYear()} S2M AI Cinematic Lab &bull; Precision Media Generation
        </p>
      </footer>
    </div>
  );
};

export default App;
