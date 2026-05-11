// src/pages/AnalysisSetup.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Activity, FileText, Globe, 
  UploadCloud, LayoutGrid, X, AlertTriangle, 
  CheckCircle2, ChevronLeft, Zap, Info
} from 'lucide-react';

// کامپوننت کارت‌های منبع
const SourceCard = ({ title, desc, icon: Icon, color, onClick, disabled = false }: any) => (
  <div 
    onClick={!disabled ? onClick : undefined}
    className={`flex items-center justify-between p-5 rounded-[22px] bg-[#1e1c19] border border-[#35332e] transition-all duration-300 group relative overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#52525b] hover:bg-[#262421] cursor-pointer active:scale-[0.98]'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-[#161512] flex items-center justify-center border border-[#35332e] shadow-inner ${!disabled && 'group-hover:scale-105 transition-transform'}`}>
        <Icon size={22} className={color} />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-lg text-white flex items-center gap-2">
          {title}
          {disabled && <span className="text-[9px] font-black tracking-widest uppercase bg-[#262421] text-zinc-500 px-2 py-0.5 rounded-md border border-[#35332e]">به زودی</span>}
        </span>
        <span className="text-xs text-zinc-500 mt-1">{desc}</span>
      </div>
    </div>
    {!disabled && <ChevronLeft size={20} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />}
  </div>
);

export default function AnalysisSetup() {
  const navigate = useNavigate();
  
  // استیت‌های پاپ‌آپ‌ها
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  
  // استیت‌های دیتا
  const [inputData, setInputData] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // تابع اعتبارسنجی
  const handleValidateAndStart = () => {
    if (!inputData.trim()) return;
    setIsChecking(true);
    
    setTimeout(() => {
      const chess = new Chess();
      let isValid = false;
      let type = '';

      try {
        if (chess.load(inputData)) {
          isValid = true;
          type = 'FEN';
        } else if (chess.loadPgn(inputData)) {
          isValid = true;
          type = 'PGN';
        }
      } catch (e) {
        isValid = false;
      }

      setIsChecking(false);

      if (isValid) {
        setIsInputModalOpen(false);
        // هدایت به صفحه بورد آنالیز همراه با دیتا
        navigate('/analysis/board', { state: { data: inputData, type: type } });
      } else {
        setIsErrorModalOpen(true);
      }
    }, 600); // یک دیلی کوتاه برای حس پردازش
  };

  return (
    <div className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-20 overflow-x-hidden" dir="rtl">
      
      {/* هدر */}
      <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-[#1e1c19] border border-[#35332e] flex items-center justify-center hover:bg-[#262421] hover:border-zinc-500 transition-all text-zinc-400 hover:text-white"
          >
            <ArrowRight size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="font-black text-xl text-white flex items-center gap-2">
              <Activity size={20} className="text-sky-400" />
              منبع آنالیز
            </h1>
            <span className="text-xs text-zinc-500 font-mono tracking-widest mt-0.5">SELECT DATA SOURCE</span>
          </div>
        </div>
      </div>

      {/* لیست گزینه‌ها */}
      <div className="w-full max-w-2xl px-4 mt-2 flex flex-col gap-4">
        <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl flex items-start gap-3 shadow-inner mb-2">
          <Info size={20} className="text-sky-400 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-100 leading-relaxed font-medium">
            برای شروع پردازش و تحلیل لایه‌های پنهان بازی، ابتدا مشخص کنید دیتای بازی را از چه طریقی وارد می‌کنید.
          </p>
        </div>

        <SourceCard 
          title="وارد کردن PGN / FEN" 
          desc="پیست کردن مستقیم کدهای متنی بازی" 
          icon={FileText} 
          color="text-amber-400" 
          onClick={() => setIsInputModalOpen(true)} 
        />
        
        <SourceCard 
          title="لینک از Lichess" 
          desc="دریافت مستقیم بازی با آدرس URL" 
          icon={Globe} 
          color="text-zinc-200" 
          disabled={true} 
        />
        
        <SourceCard 
          title="لینک از Chess.com" 
          desc="وارد کردن بازی با آدرس URL" 
          icon={Globe} 
          color="text-emerald-500" 
          disabled={true} 
        />
        
        <SourceCard 
          title="آپلود فایل PGN" 
          desc="انتخاب فایل از روی سیستم" 
          icon={UploadCloud} 
          color="text-sky-400" 
          disabled={true} 
        />
        
        <SourceCard 
          title="چیدمان دستی مهره‌ها" 
          desc="ساخت پوزیشن دلخواه روی بورد" 
          icon={LayoutGrid} 
          color="text-rose-400" 
          disabled={true} 
        />
      </div>

      {/* پاپ‌آپ دریافت PGN/FEN */}
      <AnimatePresence>
        {isInputModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" 
            dir="rtl"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} 
              className="w-full sm:max-w-md bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe"
            >
              <div className="p-6 border-b border-[#35332e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <FileText size={20} />
                  </div>
                  <h3 className="font-black text-lg text-white">متن PGN یا FEN</h3>
                </div>
                <button onClick={() => setIsInputModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <textarea
                  className="w-full h-48 bg-[#161512] border border-[#35332e] focus:border-amber-500 rounded-xl p-4 text-sm text-amber-100 placeholder-zinc-600 outline-none transition-colors shadow-inner font-mono leading-relaxed"
                  placeholder="Paste here... (e.g., 1. e4 e5 2. Nf3 Nc6)"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  dir="ltr"
                  spellCheck={false}
                />
                
                <button 
                  onClick={handleValidateAndStart}
                  disabled={!inputData.trim() || isChecking}
                  className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    !inputData.trim() ? 'bg-[#262421] text-zinc-500' : 'bg-amber-500 text-black shadow-[0_5px_20px_rgba(245,158,11,0.3)] active:scale-95'
                  }`}
                >
                  {isChecking ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <><Zap size={18} /> بررسی و ورود به آزمایشگاه</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* پاپ‌آپ خطای فرمت (ارور) */}
      <AnimatePresence>
        {isErrorModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" 
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="w-full max-w-sm bg-[#1e1c19] border border-rose-500/30 rounded-[28px] shadow-[0_20px_60px_rgba(225,29,72,0.2)] flex flex-col items-center p-8 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>
              
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                <AlertTriangle size={32} className="text-rose-500" />
              </div>
              
              <h3 className="font-black text-xl text-white mb-2">فرمت ورودی نامعتبر!</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                متنی که وارد کرده‌اید با استانداردهای PGN یا FEN همخوانی ندارد. لطفاً کدها را مجدداً بررسی کنید.
              </p>

              <button 
                onClick={() => setIsErrorModalOpen(false)}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#262421] text-white border border-[#35332e] hover:border-zinc-500 hover:bg-[#35332e] transition-all active:scale-95"
              >
                اصلاح متن
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}