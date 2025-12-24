
import { GoogleGenAI, Type } from "@google/genai";
import { StoryResponse, AspectRatio } from "../types";

export const generatePrompts = async (
  story: string,
  sceneCount: number,
  existingPromptsCount: number = 0
): Promise<StoryResponse> => {
  // Initialize AI right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isAddition = existingPromptsCount > 0;
  
  const systemInstruction = `
    You are a professional AI Prompt Generator for "S2M AI – Story-to-Media Generator".
    
    RESPONSIBILITIES:
    1. Understand the story in its original language.
    2. Do NOT rewrite, summarize, or modify the story.
    3. Analyze story structure and flow.
    4. Generate exactly ${sceneCount} image scenes based on the story. 
    ${isAddition ? `Note: You are adding ${sceneCount} MORE scenes to an existing set of ${existingPromptsCount} scenes. Continue from where the previous scenes likely left off or deepen the existing visual narrative.` : ''}
    5. Generate all IMAGE PROMPTS and the THUMBNAIL PROMPT in ENGLISH ONLY.
    
    STYLE REQUIREMENTS:
    - Cinematic composition, Ultra-realistic, 8K, high detail, professional photography.
    - Focus on lighting, shadows, camera angle, and depth of field.
    - Evoke strong mood and emotion accurate to the story.
    
    OUTPUT FORMAT:
    You must return a JSON object with exactly two keys:
    "scenes": an array of strings, each being a cinematic image prompt.
    "thumbnail": a single string, a powerful summary cinematic prompt.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Story: ${story}\nGenerate ${sceneCount} scenes.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of cinematic image prompts"
          },
          thumbnail: {
            type: Type.STRING,
            description: "A single cinematic thumbnail prompt"
          }
        },
        required: ["scenes", "thumbnail"]
      }
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as StoryResponse;
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  // Initialize AI right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: prompt + ", cinematic high-end photography, 8k resolution, ultra detailed" }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString: string = part.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
  }

  throw new Error("Failed to generate image. Please try again.");
};
