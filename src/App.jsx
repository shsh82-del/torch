import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Send, 
  Download, 
  Share2, 
  RefreshCw, 
  ChevronLeft,
  Flame,
  Check
} from 'lucide-react';

const apiKey = ""; // AIzaSyAPhvbsMqwSGdZKrniWzbAe6T65yxJ6KyA

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// רקע חלקיקים חגיגי ויוקרתי
const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
      {[...Array(15)].map((_, i) => (
        <div 
          key={i} 
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 8 + 4}s`
          }}
        />
      ))}
      <style>{`
        .particle {
          position: absolute;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 8px white;
          animation: float infinite linear;
        }
        @keyframes float {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -60%;
          width: 20%;
          height: 200%;
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(30deg);
          animation: shimmerEffect 3s infinite;
        }
        @keyframes shimmerEffect {
          0% { left: -60%; }
          100% { left: 140%; }
        }
      `}</style>
    </div>
  );
};

// אנימציית זיקוקים לשלב הטעינה
const Fireworks = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(8)].map((_, i) => (
        <div 
          key={i} 
          className="firework"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 1.5}s`,
            '--color': i % 3 === 0 ? '#60a5fa' : i % 3 === 1 ? '#ffffff' : '#fbbf24'
          }}
        />
      ))}
      <style>{`
        .firework {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          animation: explode 2s infinite ease-out;
        }
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 var(--color); }
          50% { opacity: 1; }
          100% { transform: scale(25); opacity: 0; box-shadow: -10px -10px 0 0 var(--color), 10px -10px 0 0 var(--color), 10px 10px 0 0 var(--color), -10px 10px 0 0 var(--color), 0 -15px 0 0 var(--color), 0 15px 0 0 var(--color); }
        }
      `}</style>
    </div>
  );
};

const App = () => {
  const [step, setStep] = useState('opening'); 
  const [formData, setFormData] = useState({
    name: '',
    reason: '',
    image: null,
    imageBase64: null,
    mimeType: 'image/png'
  });
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [finalCompositeUrl, setFinalCompositeUrl] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const generateTorchImage = async (base64Image, mimeType, retryCount = 0) => {
    // הפרומפט הסופי: דגל ישראל ו-78 על הפודיום
    const baseTemplateDescription = `
      SCENE CONTEXT: Official Israeli Independence Day Torch Lighting Ceremony (Har Herzl style).
      STATIONARY ELEMENTS: 
      - A central white modern podium, trapezoid shape.
      - On the front face of the podium, there is a clear illustration of the Israeli flag (Star of David and two stripes).
      - Directly below the flag, the number '78' is visible in a formal blue font.
      - Background is dark blue with multiple curved glowing white neon light lines.
      - Two IDF soldiers stand at the sides in full ceremonial olive-green uniforms, red berets, and blue-white sashes.
      TASK: 
      - Replace the central person in this specific scene with the person from the uploaded photo.
      - The person should be integrated naturally, holding the ceremonial torch, wearing a professional dark blazer.
      - Maintain high photographic realism, 9:16 vertical composition. No text overlay on image yet.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: baseTemplateDescription },
              { inlineData: { mimeType: mimeType, data: base64Image } }
            ]
          }],
          generationConfig: {
            responseModalities: ['IMAGE']
          }
        })
      });

      if (!response.ok) throw new Error('SERVER_BUSY');
      const result = await response.json();
      const base64Data = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (base64Data) return `data:image/png;base64,${base64Data}`;
      throw new Error('NO_DATA');
    } catch (err) {
      if (retryCount < 5) {
        const delays = [1000, 2000, 4000, 8000, 16000];
        await new Promise(res => setTimeout(res, delays[retryCount]));
        return generateTorchImage(base64Image, mimeType, retryCount + 1);
      }
      throw err;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, image: file, imageBase64: base64, mimeType: file.type || 'image/png' });
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.reason || !formData.imageBase64) return;
    setStep('loading');
    setError(null);
    try {
      const imageUrl = await generateTorchImage(formData.imageBase64, formData.mimeType);
      setGeneratedImageUrl(imageUrl);
    } catch (err) {
      setError('חלה שגיאה בתהליך. נסו שוב.');
      setStep('form');
    }
  };

  useEffect(() => {
    if (generatedImageUrl && step === 'loading') {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = generatedImageUrl;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 1080;
        canvas.height = 1920;

        const imgRatio = img.width / img.height;
        const targetRatio = 1080 / 1920;
        let sX, sY, sW, sH;
        if (imgRatio > targetRatio) {
          sH = img.height; sW = img.height * targetRatio;
          sX = (img.width - sW) / 2; sY = 0;
        } else {
          sW = img.width; sH = img.width / targetRatio;
          sX = 0; sY = (img.height - sH) / 2;
        }

        ctx.drawImage(img, sX, sY, sW, sH, 0, 0, 1080, 1920);

        // גרדיאנט עליון לטקסט (כדי לא להסתיר את הפודיום למטה)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.45);
        gradient.addColorStop(0, 'rgba(0, 5, 30, 0.98)');
        gradient.addColorStop(0.35, 'rgba(0, 10, 50, 0.85)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.45);

        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.direction = 'rtl';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 12;
        
        // שורה 1: אני, [שם], משיא/ה משואה זו
        ctx.font = 'bold 70px sans-serif';
        ctx.fillText(`אני, ${formData.name}, משיא/ה משואה זו`, canvas.width / 2, 170);

        // שורה 2: טקסט המשתמש
        ctx.font = '44px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.shadowBlur = 0;
        const words = formData.reason.split(' ');
        let line = ''; let y = 270;
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > 920 && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' '; y += 65;
          } else { line = testLine; }
        }
        ctx.fillText(line, canvas.width / 2, y);

        // שורה 3: ולתפארת מדינת ישראל (מוגדל, ללא ניקוד)
        ctx.font = 'bold 62px sans-serif';
        ctx.fillStyle = '#60a5fa'; 
        ctx.fillText("ולתפארת מדינת ישראל", canvas.width / 2, y + 120);

        setFinalCompositeUrl(canvas.toDataURL('image/png'));
        setStep('result');
      };
    }
  }, [generatedImageUrl, step, formData]);

  const handleShare = async () => {
    const siteUrl = window.location.href;
    const shareText = `הדלקתי משואה ליום העצמאות. 
גם לך מגיע. לכולם מגיע! 
רוצה? כל הפרטים בקישור >> ${siteUrl}`;

    try {
      if (navigator.share && navigator.canShare) {
        const response = await fetch(finalCompositeUrl);
        const blob = await response.blob();
        const file = new File([blob], `mishua_${formData.name}.png`, { type: 'image/png' });
        const shareData = { text: shareText, files: [file] };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
    } catch (e) { console.log('Share error:', e); }
    // Fallback לוואטסאפ במקרה של חוסר תמיכה בקבצים
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div dir="rtl" className="h-[100dvh] w-full bg-[#020617] text-white font-sans flex flex-col items-center overflow-hidden relative">
      <ParticleBackground />
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_#1e40af_0%,_transparent_70%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_#1e1b4b_0%,_transparent_70%)]"></div>
      </div>

      <main className="relative z-10 w-full max-w-md h-full flex flex-col px-6 py-4 mx-auto">
        
        {step === 'opening' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
            <div className="mb-8 relative">
              <div className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full scale-150 animate-pulse"></div>
              <div className="relative z-10 p-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl ring-2 ring-white/10">
                <Flame size={80} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.6)]" />
              </div>
            </div>
            <h1 className="text-4xl font-black mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-blue-300">
              יעלו ויבואו<br />משיאי המשואות
            </h1>
            <p className="text-lg text-blue-100/60 mb-12 leading-relaxed font-light">
              אחרי כל מה שעברנו, כולנו הרווחנו ביושר את הזכות להשיא משואה.
            </p>
            <button onClick={() => setStep('form')} className="shimmer w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xl font-bold transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 border-t border-white/20">
              להדלקת המשואה <Flame size={24} />
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-bottom duration-500">
            <button onClick={() => setStep('opening')} className="self-start mb-4 text-blue-300 flex items-center gap-2 hover:text-white transition-colors py-2">
              <ChevronLeft size={20} className="rotate-180" /> <span>חזרה</span>
            </button>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-base font-bold text-blue-300 mr-1">המשואה של</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-1 focus:ring-blue-500 outline-none text-lg placeholder:text-white/20" placeholder="שמך המלא" required />
              </div>
              <div className="space-y-1">
                <label className="block text-base font-bold text-blue-300 mr-1">למה מגיע לך להשיא משואה?</label>
                <textarea rows="2" maxLength="120" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-lg placeholder:text-white/20" placeholder="כי לא ישנתי 3 שנים, כי עשיתי מילואים..." required />
              </div>
              <div className="space-y-1">
                <label className="block text-base font-bold text-blue-300 mr-1">צילום פנים וגוף ברור (אנכי)</label>
                <label className="flex flex-col items-center justify-center w-full h-36 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all overflow-hidden relative group">
                  {formData.image ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src={URL.createObjectURL(formData.image)} className="w-full h-full object-cover opacity-40" alt="preview" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/40 backdrop-blur-sm">
                        <Check size={40} className="text-blue-400 mb-1" /> <span className="text-sm font-bold uppercase text-white tracking-widest">התמונה נבחרה</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Camera size={36} className="text-blue-400/50 mb-1" /> <span className="text-sm text-blue-100/30">לחצו להעלאה</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              {error && <div className="text-red-400 text-xs text-center bg-red-950/20 p-2 rounded-xl border border-red-900/30">{error}</div>}
              <button type="submit" disabled={!formData.name || !formData.reason || !formData.image} className="shimmer w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-2xl text-xl font-bold shadow-xl flex items-center justify-center gap-4 transition-all">
                יצירת תמונת המשואה שלי <Send size={22} />
              </button>
            </form>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 relative">
            <Fireworks />
            <div className="relative z-10">
              <div className="mb-8 relative inline-block">
                <div className="w-36 h-36 border-b-4 border-blue-500 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Flame className="text-blue-400 animate-pulse" size={50} />
                </div>
              </div>
              <h2 className="text-5xl font-black mb-6 drop-shadow-lg">תעלה המשואה!</h2>
              <p className="text-xl text-blue-100/70 mb-2">עוד רגע המשואה שלך תדלק</p>
              <p className="text-2xl text-blue-100 font-bold uppercase tracking-tight">כל הכבוד, גאים בך!</p>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-700 h-full max-h-full">
             <div className="flex-1 min-h-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-4 bg-slate-950 flex items-center justify-center ring-1 ring-white/5 relative">
                {finalCompositeUrl ? (
                  <img src={finalCompositeUrl} className="max-w-full max-h-full object-contain" alt="Result" />
                ) : (
                  <div className="flex items-center justify-center text-blue-400 flex-col gap-2">
                    <RefreshCw className="animate-spin" size={32} />
                    <span className="text-sm">מעבד...</span>
                  </div>
                )}
             </div>
             <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={() => { const link = document.createElement('a'); link.download = `Mishua_${formData.name}.png`; link.href = finalCompositeUrl; link.click(); }} className="bg-white text-blue-950 py-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-50 active:scale-95">
                  <Download size={20} /> שמירה
                </button>
                <button onClick={handleShare} className="bg-[#25D366] py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white active:scale-95 shadow-lg">
                  <Share2 size={20} /> שיתוף
                </button>
             </div>
             <button onClick={() => { setStep('form'); setGeneratedImageUrl(null); setFinalCompositeUrl(null); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-blue-200 flex items-center justify-center gap-2 active:scale-95 mb-2">
               <RefreshCw size={18} /> יצירה מחדש
             </button>
          </div>
        )}

        <footer className="relative z-10 py-3 text-center text-[10px] text-blue-100/30 leading-tight font-light mt-auto">
          <div className="mb-1">קריאטיב ויצירה: שרון שנער</div>
          <div>הקופסא | מילים. רעיונאות. תוכן</div>
        </footer>
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
