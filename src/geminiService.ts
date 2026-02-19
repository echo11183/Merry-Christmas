import { GoogleGenAI } from "@google/genai";
import { TransformationModel, ImageSize, AspectRatio } from "../types.ts";

export const generateChristmasImage = async (
  base64Image: string,
  prompt: string,
  modelName: TransformationModel = TransformationModel.FLASH,
  size: ImageSize = '1K',
  aspectRatio: AspectRatio = '1:1'
): Promise<string> => {
  // 必须在函数内部获取 process.env.API_KEY 并创建实例
  // 这样才能确保获取到用户在弹窗中最新选择的密钥
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
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
      throw new Error('No image was generated in the response.');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error: any) {
    const errorMsg = error.message || '';
    // 如果是密钥过期、无效或实体未找到，统一视为密钥问题
    if (
      errorMsg.includes('expired') || 
      errorMsg.includes('API_KEY_INVALID') || 
      errorMsg.includes('Requested entity was not found') ||
      errorMsg.includes('403')
    ) {
      throw new Error('API_KEY_EXPIRED');
    }
    throw error;
  }

  throw new Error('Could not find image data in the response parts.');
};

/**
 * 调起官方密钥选择对话框
 */
export const openApiKeySelector = async () => {
  if (typeof (window as any).aistudio?.openSelectKey === 'function') {
    await (window as any).aistudio.openSelectKey();
  } else {
    window.open('https://aistudio.google.com/app/apikey', '_blank');
  }
};
