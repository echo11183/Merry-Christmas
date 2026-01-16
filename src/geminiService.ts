
import { GoogleGenAI } from "@google/genai";
import { TransformationModel, ImageSize, AspectRatio } from "../types";

export const generateChristmasImage = async (
  base64Image: string,
  prompt: string,
  modelName: TransformationModel = TransformationModel.FLASH,
  size: ImageSize = '1K',
  aspectRatio: AspectRatio = '1:1'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const mimeType = 'image/jpeg'; 

  const parts: any[] = [
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    },
    { text: prompt }
  ];

  const contents = { parts };

  const config: any = {
    imageConfig: {
      aspectRatio: aspectRatio,
    },
  };

  if (modelName === TransformationModel.PRO) {
    config.imageConfig.imageSize = size;
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config,
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error('No image was generated in the response.');
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Could not find image data in the response parts.');
};

export const checkApiKeySelection = async (): Promise<boolean> => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return true;
};

export const requestApiKeySelection = async (): Promise<void> => {
  if (typeof (window as any).aistudio?.openSelectKey === 'function') {
    await (window as any).aistudio.openSelectKey();
  }
};
