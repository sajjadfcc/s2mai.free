
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

export type AspectRatio = "1:1" | "16:9" | "9:16" | "3:4" | "4:3";

export interface AppState {
  story: string;
  sceneCount: number;
  aspectRatio: AspectRatio;
  generatedScenes: Scene[];
  thumbnailPrompt: string;
  thumbnailUrl?: string;
  isGeneratingPrompts: boolean;
  isGeneratingThumbnail: boolean;
  error: string | null;
}
