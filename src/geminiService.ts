import { GoogleGenAI } from "@google/genai";
import { TransformationModel, ImageSize, AspectRatio } from "../types.ts";

export const generateChristmasImage = async (
  base64Image: string,
  prompt: string,
  modelName: TransformationModel = TransformationModel.FLASH,
  size: ImageSize = '1K',
  aspectRatio: AspectRatio = '1:1'
): Promise<string> => {
  let apiKey = '';
  try {
    // 兼容多种环境获取 API_KEY
    apiKey = (window as any).process?.env?.API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : '');
  } catch (e) {
    console.warn('Could not read process.env');
  }

  if (!apiKey || apiKey === 'undefined') {
    throw new Error('API_KEY_MISSING');
  }

  const ai = new GoogleGenAI({ apiKey });
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

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config,
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error('No image data found.');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error: any) {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('key') || msg.includes('403') || msg.includes('401') || msg.includes('not found')) {
      throw new Error('API_KEY_EXPIRED');
    }
    throw error;
  }

  throw new Error('Image data missing in response.');
};

export const openApiKeySelector = async () => {
  if (typeof (window as any).aistudio?.openSelectKey === 'function') {
    await (window as any).aistudio.openSelectKey();
  } else {
    window.open('https://aistudio.google.com/app/apikey', '_blank');
  }
};
