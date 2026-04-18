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

/**
 * גישה למפתח ה-API דרך משתני סביבה של Vite.
 * המפתח מוגדר ב-Vercel תחת השם VITE_GEMINI_API_KEY.
 */
const getApiKey = () => {
  try {
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    console.error("נכשל הניסיון לגשת למשתנה הסביבה:", e);
    return "";
  }
};

const apiKey = getApiKey();

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// רקע חלקיקים חגיגי
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
        .particle { position: absolute; background: white; border-radius: 50%; box-shadow: 0 0 8px white; animation: float infinite linear; }
        @keyframes float { 0% { transform: translateY(0) scale(1); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(-100vh) scale(0.5); opacity: 0; } }
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after { content: ''; position: absolute; top: -50%; left: -60%; width: 20%; height: 200%; background: rgba(255, 255, 255, 0.2); transform: rotate(30deg); animation: shimmerEffect 3s infinite; }
        @keyframes shimmerEffect { 0% { left: -60%; } 100% { left: 140%; } }
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
        .firework { position: absolute; width: 4px; height: 4px; border-radius: 50%; animation: explode 2s infinite ease-out; }
        @keyframes explode { 0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 var(--color); } 50% { opacity: 1; } 100% { transform: scale(25); opacity: 0; box-shadow: -10px -10px 0 0 var(--color), 10px -10px 0 0 var(--color), 10px 10px 0 0 var(--color), -10px 10px 0 0 var(--color), 0 -15px 0 0 var(--color), 0 18px 0 0 var(--color); } }
      `}</style>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState('opening'); 
  const [formData, setFormData] = useState({ name: '', reason: '', image: null, imageBase64: null, mimeType: 'image/png' });
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [finalCompositeUrl, setFinalCompositeUrl] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const generateTorchImage = async (base64Image, mimeType, retryCount = 0) => {
    // פרומפט מפורט עם הדרישות הוויזואליות לפודיום
    const prompt = `SCENE: Official Israeli Independence Day ceremony at Mount Herzl. A central ceremonial white podium. The podium must clearly display a drawing of the Israeli flag with the number 78 directly beneath it. INTEGRATION: Place the person from the uploaded photo as the central figure lighting the ceremonial torch. The person should hold the torch and look professional. Style: Photographic realism, 9:16 aspect ratio. No text overlays.`;

    try {
      if (!apiKey) throw new Error("מפתח API חסר. נא לוודא שהוזן ב-Vercel.");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ 
            parts: [
              { text: prompt }, 
              { inlineData: { mimeType: mimeType, data: base64Image } }
            ] 
          }], 
          generationConfig: { 
            responseModalities: ['IMAGE'] 
          } 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("שגיאת API:", errorData);
        throw new Error(`שגיאת שרת: ${response.status}`);
      }

      const result = await response.json();
      const base64Data = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (base64Data) return `data:image/png;base64,${base64Data}`;
      throw new Error('לא התקבלה תמונה מהשרת.');
    } catch (err) {
      if (retryCount < 4) {
        const delays = [1000, 2000, 4000, 8000];
        await new Promise(res => setTimeout(res, delays[retryCount]));
        return generateTorchImage(base64Image, mimeType, retryCount + 1);
      }
      throw err;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFormData({ ...formData, image: file, imageBase64: base64, mimeType: file.type || 'image/png' });
        setError(null);
      } catch (err) {
        setError("שגיאה בטעינת הקובץ");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('loading');
    setError(null);
    try {
      const imageUrl = await generateTorchImage(formData.imageBase64, formData.mimeType);
      setGeneratedImageUrl(imageUrl);
    } catch (err) {
      console.error("הגשת הטופס נכשלה:", err);
      setError('חלה שגיאה ביצירת התמונה. ודאו שהמפתח הוזן נכון ב-Vercel ונסו שוב.');
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
        const ctx = canvas.getContext('2d');
        canvas.width = 1080; canvas.height = 1920;
        ctx.drawImage(img, 0, 0, 1080, 1920);
        
        // יצירת גרדיאנט עליון (Top Overlay)
        const grad = ctx.createLinearGradient(0, 0, 0, 850);
        grad.addColorStop(0, 'rgba(0, 5, 30, 0.98)'); 
        grad.addColorStop(0.35, 'rgba(0, 10, 50, 0.85)'); 
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad; 
        ctx.fillRect(0, 0, 1080, 850);

        ctx.textAlign = 'center'; 
        ctx.fillStyle = 'white'; 
        ctx.direction = 'rtl'; 
        ctx.shadowBlur = 12; 
        ctx.shadowColor = 'black';
        
        // טקסטים בחלק העליון של התמונה
        ctx.font = 'bold 70px sans-serif';
        ctx.fillText(`אני, ${formData.name}, משיא/ה משואה זו`, 540, 170);

        ctx.font = '44px sans-serif'; 
        ctx.shadowBlur = 0;
        const words = formData.reason.split(' ');
        let line = ''; let y = 270;
        for (let n = 0; n < words.length; n++) {
          let test = line + words[n] + ' ';
          if (ctx.measureText(test).width > 920 && n > 0) { 
            ctx.fillText(line, 540, y); 
            line = words[n] + ' '; y += 65; 
          }
          else { line = test; }
        }
        ctx.fillText(line, 540, y);

        ctx.font = 'bold 62px sans-serif'; 
        ctx.fillStyle = '#60a5fa';
        ctx.fillText("ולתפארת מדינת ישראל", 540, y + 120);

        setFinalCompositeUrl(canvas.toDataURL('image/png'));
        setStep('result');
      };
      img.onerror = () => {
        setError("שגיאה בעיבוד התמונה הסופית");
        setStep('form');
      }
    }
  }, [generatedImageUrl, step, formData]);

  const handleShare = async () => {
    const text = `הדלקתי משואה ליום העצמאות! גם לך מגיע. לכולם מגיע! רוצה גם? כל הפרטים בקישור >> ${window.location.href}`;
    
    if (navigator.share) {
      try {
        const res = await fetch(finalCompositeUrl);
        const blob = await res.blob();
        const file = new File([blob], `mishua_${formData.name}.png`, { type: 'image/png' });
        
        await navigator.share({ 
          text: text,
          files: [file] 
        });
      } catch (e) { 
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`); 
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
  };

  return (
    <div dir="rtl" className="h-[100dvh] w-full bg-[#020617] text-white font-sans flex flex-col items-center overflow-hidden">
      <ParticleBackground />
      
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_#1e40af_0%,_transparent_70%)]"></div>
      </div>

      <main className="relative z-10 w-full max-w-md h-full flex flex-col px-6 py-4 mx-auto no-scrollbar overflow-y-auto">
        
        {step === 'opening' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
            <div className="mb-8 p-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl animate-pulse">
              <Flame size={80} className="text-blue-400" />
            </div>
            <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-300 leading-tight">
              יעלו ויבואו<br />משיאי המשואות
            </h1>
            <p className="text-lg text-blue-100/60 mb-12 font-light leading-relaxed">
              אחרי כל מה שעברנו, כולנו הרווחנו ביושר את הזכות להשיא משואה.
            </p>
            <button 
              onClick={() => setStep('form')} 
              className="shimmer w-full py-5 bg-blue-600 rounded-2xl text-xl font-bold flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl border-t border-white/20"
            >
              להדלקת המשואה <Flame size={24} />
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-bottom duration-500">
            <button onClick={() => setStep('opening')} className="self-start mb-4 text-blue-300 py-2 flex items-center gap-2 hover:text-white transition-colors">
              <ChevronLeft size={20} className="rotate-180" /> חזרה
            </button>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-bold text-blue-300 mb-2 text-lg">המשואה של</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-white/20" 
                  placeholder="שמך המלא" 
                  required 
                />
              </div>
              <div>
                <label className="block font-bold text-blue-300 mb-2 text-lg">למה מגיע לך להשיא משואה?</label>
                <textarea 
                  rows="2" 
                  value={formData.reason} 
                  onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg outline-none focus:ring-1 focus:ring-blue-500 resize-none placeholder:text-white/20" 
                  placeholder="כי לא ישנתי 3 שנים, כי עשיתי מילואים..." 
                  required 
                />
              </div>
              <div>
                <label className="block font-bold text-blue-300 mb-2 text-lg">צילום פנים וגוף ברור (אנכי)</label>
                <label className="flex flex-col items-center justify-center w-full h-36 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all overflow-hidden relative">
                  {formData.image ? (
                    <div className="flex flex-col items-center text-blue-400">
                      <Check size={40} className="mb-1" />
                      <span className="text-sm font-bold uppercase tracking-widest">התמונה נבחרה</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-blue-100/30">
                      <Camera size={36} className="mb-2" />
                      <span className="text-sm">לחצו להעלאת תמונה</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              {error && <div className="text-red-400 text-sm text-center bg-red-950/20 p-3 rounded-xl border border-red-900/30">{error}</div>}
              <button 
                type="submit" 
                disabled={!formData.name || !formData.reason || !formData.image} 
                className="shimmer w-full py-5 bg-blue-600 rounded-2xl text-xl font-bold flex items-center justify-center gap-4 disabled:opacity-50 transition-all shadow-xl"
              >
                יצירת תמונת המשואה שלי <Send size={22} />
              </button>
            </form>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 relative">
            <Fireworks />
            <div className="w-36 h-36 border-b-4 border-blue-500 rounded-full animate-spin mb-8"></div>
            <h2 className="text-4xl font-black mb-4 drop-shadow-lg">תעלה המשואה!</h2>
            <p className="text-xl text-blue-100 font-bold uppercase tracking-tight">כל הכבוד, גאים בך!</p>
          </div>
        )}

        {step === 'result' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden animate-in zoom-in-95 duration-700">
            <div className="flex-1 min-h-0 rounded-3xl overflow-hidden border border-white/10 mb-4 bg-slate-950 flex items-center justify-center shadow-2xl relative">
              {finalCompositeUrl ? (
                <img src={finalCompositeUrl} className="max-w-full max-h-full object-contain" alt="result" />
              ) : (
                <RefreshCw className="animate-spin text-blue-400" size={40} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button 
                onClick={() => { const a = document.createElement('a'); a.download = `mishua_${formData.name}.png`; a.href = finalCompositeUrl; a.click(); }} 
                className="bg-white text-blue-950 py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <Download size={20} /> שמירה
              </button>
              <button 
                onClick={handleShare} 
                className="bg-[#25D366] py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white active:scale-95 transition-all shadow-lg"
              >
                <Share2 size={20} /> שיתוף
              </button>
            </div>
            <button 
              onClick={() => { setStep('form'); setGeneratedImageUrl(null); setFinalCompositeUrl(null); }} 
              className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-blue-200 flex items-center justify-center gap-2 mb-2 active:scale-95 transition-all"
            >
              <RefreshCw size={18} /> יצירה מחדש
            </button>
          </div>
        )}

        <footer className="py-3 text-center text-[10px] text-blue-100/30 mt-auto font-light">
          <div className="mb-1">קריאטיב ויצירה: שרון שנער</div>
          <div>הקופסא | מילים. רעיונאות. תוכן</div>
        </footer>
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
