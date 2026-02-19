import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  TransformationModel, 
  AspectRatio,
  CardDetails,
  GenerationResult
} from './types.ts';
import { DEFAULT_WINTER_PROMPT } from './constants.tsx';
import { 
  generateChristmasImage,
  openApiKeySelector
} from './services/geminiService.ts';
import { sendHolidayEmail } from './services/emailService.ts';
import ImageUploader from './components/ImageUploader.tsx';

const SnowEffect = () => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 5 + 2}px`,
      duration: `${Math.random() * 8 + 12}s`,
      delay: `${Math.random() * 20}s`,
    }));
  }, []);

  return (
    <div className="snow-container">
      {snowflakes.map((s) => (
        <div 
          key={s.id} 
          className="snow-particle" 
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            animationDuration: s.duration,
            animationDelay: s.delay
          }}
        />
      ))}
    </div>
  );
};

const ChristmasDecoration = () => (
  <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none opacity-40 h-40">
    <div className="flex justify-around items-start -translate-y-4">
      {[...Array(6)].map((_, i) => (
        <i key={i} className={`fas fa-holly-berry text-green-800 text-6xl transform rotate-${i * 15} animate-pulse`} style={{ animationDelay: `${i * 0.5}s` }}></i>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeyError, setIsKeyError] = useState(false);
  const [form, setForm] = useState<CardDetails>({
    senderName: '',
    senderEmail: '',
    recipientName: '',
    recipientEmail: '',
    message: ''
  });

  // 初始化检查密钥
  useEffect(() => {
    const checkKey = async () => {
      if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleImageSelected = useCallback((base64: string) => {
    if (!base64) {
      setSelectedImageBase64('');
      setPreviewUrl(null);
      setResult(null);
      setShowSuccess(false);
      return;
    }
    setSelectedImageBase64(base64);
    setPreviewUrl(`data:image/jpeg;base64,${base64}`);
    setError(null);
    setIsKeyError(false);
    setResult(null);
    setShowSuccess(false);
  }, []);

  const handleUpdateKey = async () => {
    await openApiKeySelector();
    // 竞态处理：触发 openSelectKey 后立即假设成功以进入应用
    setHasKey(true);
    setError(null);
    setIsKeyError(false);
  };

  const handleTransform = async () => {
    if (!selectedImageBase64) {
      setError("Please upload a photograph first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setIsKeyError(false);
    setShowSuccess(false);

    try {
      const generatedUrl = await generateChristmasImage(
        selectedImageBase64,
        DEFAULT_WINTER_PROMPT,
        TransformationModel.FLASH,
        '1K',
        '1:1'
      );

      const newResult: GenerationResult = {
        id: Math.random().toString(36).substr(2, 9),
        imageUrl: generatedUrl,
        timestamp: Date.now(),
        model: TransformationModel.FLASH
      };

      setResult(newResult);
    } catch (err: any) {
      if (err.message === 'API_KEY_EXPIRED' || err.message === 'API_KEY_MISSING') {
        setIsKeyError(true);
        setError("API Key 密钥已过期或失效，请点击下方按钮重新授权。");
      } else {
        setError(err.message || "The Christmas magic took a detour. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `christmas-watercolor-card-${result.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateForm = () => {
    if (!form.senderName || !form.senderEmail || !form.recipientName || !form.recipientEmail || !form.message) {
      setError("Please fill in all details and your message.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.senderEmail) || !emailRegex.test(form.recipientEmail)) {
      setError("Please enter valid email addresses.");
      return false;
    }
    return true;
  };

  const handleSend = async () => {
    if (!result) {
      setError("Generate your festive card first!");
      return;
    }
    
    if (!validateForm()) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await sendHolidayEmail(form, result);
      if (response.success) {
        setShowSuccess(true);
        setError(null);
      }
    } catch (err: any) {
      console.error("App layer error:", err);
      setError(err.message || "Connection lost to the North Pole.");
    } finally {
      setIsSending(false);
    }
  };

  const displayUrl = result ? result.imageUrl : previewUrl;

  // 如果没有选择密钥，显示全屏遮罩引导
  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <SnowEffect />
        <div className="panel-bg p-12 rounded-3xl max-w-md w-full text-center space-y-8 z-10 border border-white/20 backdrop-blur-xl">
          <div className="w-24 h-24 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto border-2 border-[#d4af37]">
            <i className="fas fa-key text-[#d4af37] text-4xl"></i>
          </div>
          <div className="space-y-4">
            <h2 className="xmas-font text-4xl text-white tracking-wide">Ready for Magic?</h2>
            <p className="serif-font text-[#f9f3e6] opacity-80 leading-relaxed">
              To turn your photos into watercolor art, please connect your Google Gemini API Key.
            </p>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/50 uppercase tracking-widest leading-normal">
                You'll need an API key from a paid GCP project. 
                <br />
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline text-[#d4af37] hover:text-white transition-colors">
                  View Billing Documentation
                </a>
              </p>
            </div>
          </div>
          <button 
            onClick={handleUpdateKey}
            className="w-full py-4 bg-[#d4af37] hover:bg-[#c4a132] text-[#630d0d] rounded-2xl xmas-font text-3xl font-bold transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Connect to Card Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 md:py-20 max-w-6xl mx-auto flex flex-col items-center relative overflow-hidden">
      <SnowEffect />
      <ChristmasDecoration />

      <header className="text-center mb-12 space-y-4 relative z-10">
        <div className="flex justify-center gap-4 text-3xl text-[#d4af37]">
          <i className="fas fa-snowflake animate-spin-slow"></i>
          <i className="fas fa-gift"></i>
          <i className="fas fa-snowflake animate-spin-slow"></i>
        </div>
        <h1 className="xmas-font text-5xl md:text-7xl gold-glow text-white tracking-wide">
          Merry Christmas
        </h1>
        <p className="serif-font italic text-xl md:text-2xl text-[#f9f3e6] opacity-90 max-w-2xl mx-auto">
          Turn your cherished moments into timeless hand-painted watercolor holiday cards
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-10 w-full relative z-10 max-w-5xl">
        
        {/* Left Side: Creation Area */}
        <div className="panel-bg rounded-3xl p-8 shadow-2xl flex flex-col min-h-[550px] border-2 border-white/10 festive-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <i className="fas fa-star text-[#d4af37] text-lg"></i>
              <h2 className="serif-font text-2xl font-bold tracking-tight text-[#f9f3e6]">The Canvas</h2>
            </div>
            <button 
              onClick={handleUpdateKey}
              className="text-xs text-[#d4af37] hover:text-white transition-colors flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
              title="API Key Settings"
            >
              <i className="fas fa-cog"></i>
              Settings
            </button>
          </div>
          
          <div className="flex-1 flex flex-col relative">
            <div className={`flex-1 border-2 border-dashed border-white/20 rounded-3xl overflow-hidden transition-all bg-black/10 backdrop-blur-sm ${isGenerating ? 'opacity-40' : ''}`}>
              <ImageUploader onImageSelected={handleImageSelected} previewUrl={displayUrl} />
            </div>

            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl z-20">
                <div className="relative mb-6">
                   <i className="fas fa-paint-brush text-5xl text-[#d4af37] animate-bounce"></i>
                   <i className="fas fa-magic absolute -top-4 -right-4 text-white text-2xl animate-pulse"></i>
                </div>
                <p className="xmas-font text-3xl text-white tracking-wider">Mixing festive colors...</p>
                <p className="text-xs text-white/60 mt-2 serif-font italic">A watercolor artist is working on your card</p>
              </div>
            )}
            
            {/* Contextual Buttons */}
            <div className="mt-6 flex flex-col items-center gap-4">
              {selectedImageBase64 && !result && !isGenerating && (
                <button 
                  onClick={handleTransform}
                  className="w-full py-4 bg-[#d4af37] hover:bg-[#c4a132] text-[#630d0d] rounded-2xl xmas-font text-3xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-4"
                >
                  <i className="fas fa-wand-sparkles"></i>
                  Create watercolor card
                </button>
              )}

              {result && !isGenerating && (
                <button 
                  onClick={handleDownload}
                  className="px-10 py-3 bg-white/10 hover:bg-white/20 text-[#f9f3e6] rounded-full text-sm font-semibold transition-all flex items-center gap-3 border border-white/20 backdrop-blur-md"
                >
                  <i className="fas fa-download text-[#d4af37]"></i>
                  Save Your Masterpiece
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/60 border border-red-500/30 rounded-xl flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300">
                 <div className="flex items-start gap-3">
                   <i className="fas fa-exclamation-circle text-red-200 mt-0.5 shrink-0"></i>
                   <div className="flex flex-col">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-red-200 mb-1">Transmission Error</p>
                     <p className="text-xs text-red-50 font-medium leading-relaxed">{error}</p>
                   </div>
                 </div>
                 {isKeyError && (
                    <button 
                      onClick={handleUpdateKey}
                      className="w-full py-2 bg-[#d4af37] hover:bg-white text-[#630d0d] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-key"></i>
                      更新授权 API Key
                    </button>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Message & Send */}
        <div className="panel-bg rounded-3xl p-10 shadow-2xl space-y-8 border-2 border-white/10 festive-border relative">
          {showSuccess && (
            <div className="absolute inset-0 z-30 bg-[#165b33]/95 flex flex-col items-center justify-center p-8 text-center rounded-3xl animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 border-2 border-[#d4af37]">
                <i className="fas fa-check text-[#d4af37] text-4xl"></i>
              </div>
              <h3 className="xmas-font text-4xl text-white mb-2 tracking-wider">Delivered with Joy!</h3>
              <p className="serif-font italic text-[#f9f3e6] opacity-90 mb-8">
                Your holiday card has been sent to {form.recipientName}. May it bring a smile to their face!
              </p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="px-8 py-3 bg-[#d4af37] text-[#630d0d] rounded-xl font-bold hover:bg-[#c4a132] transition-colors"
              >
                Send Another
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 mb-2">
            <i className="fas fa-feather-pointed text-[#d4af37] text-lg"></i>
            <h2 className="serif-font text-2xl font-bold tracking-tight text-[#f9f3e6]">Personal Message</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.2em] flex items-center gap-2">
                <i className="fas fa-user-pen"></i> From The Sender
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="Your name" value={form.senderName} 
                  onChange={e => setForm({...form, senderName: e.target.value})}
                  className="input-card rounded-xl px-5 py-3 text-sm w-full"
                />
                <input 
                  type="email" placeholder="Your email" value={form.senderEmail} 
                  onChange={e => setForm({...form, senderEmail: e.target.value})}
                  className="input-card rounded-xl px-5 py-3 text-sm w-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-red-300 uppercase tracking-[0.2em] flex items-center gap-2">
                <i className="fas fa-heart"></i> For Someone Special
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="Recipient's name" value={form.recipientName} 
                  onChange={e => setForm({...form, recipientName: e.target.value})}
                  className="input-card rounded-xl px-5 py-3 text-sm w-full"
                />
                <input 
                  type="email" placeholder="Recipient's email" value={form.recipientEmail} 
                  onChange={e => setForm({...form, recipientEmail: e.target.value})}
                  className="input-card rounded-xl px-5 py-3 text-sm w-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                <i className="fas fa-envelope-open-text"></i> Festive Wishes
              </label>
              <textarea 
                placeholder="Write your heartfelt holiday message here..."
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                className="input-card rounded-2xl px-5 py-5 text-sm w-full h-40 resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleSend}
              disabled={isGenerating || isSending || !result}
              className={`w-full py-5 rounded-2xl xmas-font text-4xl tracking-wider transition-all transform active:scale-[0.98] flex items-center justify-center gap-4 ${
                isGenerating || isSending || !result
                  ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                  : 'bg-[#165b33] hover:bg-[#0f4626] text-white shadow-[0_10px_20px_rgba(22,91,51,0.3)] border-b-4 border-[#0a2e1a]'
              }`}
            >
              {isSending ? (
                <>
                  <i className="fas fa-spinner fa-spin text-2xl"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane text-2xl"></i>
                  Send with Love
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-20 text-center space-y-6 relative z-10">
        <div className="flex justify-center gap-6 text-[#d4af37]/30 text-xl">
           <i className="fas fa-tree"></i>
           <i className="fas fa-star"></i>
           <i className="fas fa-holly-berry"></i>
        </div>
        <p className="serif-font text-[#f9f3e6]/40 text-sm tracking-widest uppercase">
          Happy Holidays & Best Wishes
        </p>
      </footer>
    </div>
  );
};

export default App;
