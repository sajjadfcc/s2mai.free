
export interface Scene {
  id: string;
  index: number;
  prompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

export interface StoryResponse {
  scenes: string[];
  thumbnail: string;
}

export interface AppState {
  story: string;
  sceneCount: number;
  generatedScenes: Scene[];
  thumbnailPrompt: string;
  thumbnailUrl?: string;
  isGeneratingPrompts: boolean;
  error: string | null;
}
