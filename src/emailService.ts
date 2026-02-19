
import emailjs from '@emailjs/browser';
import { CardDetails, GenerationResult } from '../types';

/**
 * Credentials mapping
 */
const PUBLIC_KEY = 'ClVyghjyWc-3kFa6q'; 
const SERVICE_ID = 'service_xogf9di';
const TEMPLATE_ID = 'template_53gd5r7';

/**
 * Aggressively compress images to stay under EmailJS limits
 */
const compressImageForEmail = async (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400; 
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.4));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

export const sendHolidayEmail = async (
  details: CardDetails,
  generation: GenerationResult
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Packaging your holiday wishes...');
    
    const emailReadyImage = await compressImageForEmail(generation.imageUrl);

    const templateParams = {
      to_name: details.recipientName,
      to_email: details.recipientEmail, 
      from_name: details.senderName,
      from_email: details.senderEmail,
      message: details.message,
      card_image: emailReadyImage,
      card_id: generation.id
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      {
        publicKey: PUBLIC_KEY,
      }
    );

    if (response.status === 200) {
      return {
        success: true,
        message: `Joyfully delivered to ${details.recipientName}!`
      };
    } else {
      throw new Error(`Delivery Error: ${response.status} - ${response.text}`);
    }
  } catch (error: any) {
    console.error('EmailJS Error Object:', JSON.stringify(error, null, 2));
    
    let errorDetail = "Unknown Error";
    if (error && typeof error === 'object') {
      errorDetail = error.text || error.message || JSON.stringify(error);
    } else {
      errorDetail = String(error);
    }

    // 更新后的精确错误指引
    if (errorDetail.includes("recipients address is empty")) {
      throw new Error("EmailJS 配置错误：请前往 EmailJS 的 'Content' 选项卡，在 'To Email' 框中填入 {{to_email}} 并保存。");
    }
    
    if (errorDetail.includes("413") || errorDetail.toLowerCase().includes("too large")) {
      throw new Error("图片体积仍然太大。请尝试更换更小的照片，或缩短邮件留言。");
    }

    if (errorDetail.includes("401") || errorDetail.includes("403")) {
      throw new Error("Public Key 无效，请检查 EmailJS 的 Account 设置。");
    }
    
    throw new Error(`发送失败: ${errorDetail}`);
  }
};
