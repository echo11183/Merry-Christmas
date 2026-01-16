
import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, previewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        onImageSelected(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  if (previewUrl) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-white/50">
         <img src={previewUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" alt="Preview" />
         <button 
           onClick={(e) => { e.stopPropagation(); onImageSelected(''); }}
           className="absolute top-2 right-2 bg-white/80 p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
         >
           <i className="fas fa-times text-xs"></i>
         </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className="w-full h-full border-2 border-dashed border-[#ccd5cc] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/40 transition-all p-8 text-center"
    >
      <div className="w-12 h-12 bg-[#efeae2] rounded-full flex items-center justify-center mb-4">
        <i className="fas fa-camera text-[#5c4d4d] text-lg"></i>
      </div>
      <h3 className="serif-font text-lg mb-2 text-[#5c4d4d]">Drop your photograph here</h3>
      <div className="flex items-center gap-2 text-[10px] text-[#5c4d4d]/50 font-medium uppercase tracking-widest">
        <span>🖼️ PNG, JPG, GIF up to 10MB</span>
      </div>
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;
