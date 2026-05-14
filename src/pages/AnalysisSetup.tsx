import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Activity, FileText, 
  UploadCloud, LayoutGrid, X, AlertTriangle, 
  ChevronLeft, Zap, Info, History, Search, 
  Link as LinkIcon, Sparkles, Plus, Globe, Cpu
} from 'lucide-react';
import BoardEditorModal from '../components/BoardEditorModal';

const MOCK_ARCHIVE = [
  { id: '1', white: 'Alireza_Karkon', black: 'Stockfish_16', result: 'win', date: 'امروز', pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4' },
  { id: '2', white: 'Hikaru', black: 'Alireza_Karkon', result: 'loss', date: 'دیروز', pgn: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7' },
  { id: '3', white: 'Alireza_Karkon', black: 'Farzin_Engine', result: 'draw', date: '۲ روز پیش', pgn: '1. c4 c5 2. Nc3 Nc6 3. g3 g6' },
];

const TITLES = ['بدون تایتل', 'GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];

// انیمیشن‌های کانتینر برای ورود مرحله‌ای
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  },
  exit: { opacity: 0, y: 20, transition: { ease: 'easeInOut', duration: 0.3 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const SourceCard = ({ title, desc, icon: Icon, color, onClick, isHighlight }: any) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ scale: 1.02, y: -5 }} 
    whileTap={{ scale: 0.98 }} 
    onClick={onClick}
    className={`group flex items-center justify-between p-5 rounded-[28px] border transition-all duration-500 cursor-pointer relative overflow-hidden ${
      isHighlight 
      ? 'bg-gradient-to-br from-farzin-accent/20 to-emerald-900/10 border-farzin-accent/40 shadow-[0_20px_40px_rgba(119,149,86,0.15)]' 
      : 'bg-[#1e1c19]/60 border-[#35332e] hover:border-zinc-500 backdrop-blur-md shadow-xl'
    }`}
  >
    <div className="flex items-center gap-5 relative z-10">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform duration-500 group-hover:rotate-[10deg] ${
        isHighlight ? 'bg-farzin-accent/20 border-farzin-accent/30' : 'bg-[#161512] border-[#35332e]'
      }`}>
        <Icon size={28} className={`${color} drop-shadow-md`} />
      </div>
      <div className="flex flex-col">
        <span className="font-black text-lg text-white group-hover:text-farzin-accent transition-colors tracking-tight">
          {title}
        </span>
        <span className="text-[11px] text-zinc-500 font-medium mt-1 leading-tight group-hover:text-zinc-400">
          {desc}
        </span>
      </div>
    </div>
    <div className={`p-2 rounded-full transition-all duration-300 ${isHighlight ? 'bg-farzin-accent/20 text-farzin-accent' : 'bg-zinc-800 text-zinc-600 group-hover:bg-zinc-700 group-hover:text-zinc-300'}`}>
        <ChevronLeft size={18} />
    </div>
    
    {/* افکت نوری در هاور */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
  </motion.div>
);

export default function AnalysisSetup() {
  const navigate = useNavigate();
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  
  const [inputData, setInputData] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileContent, setUploadedFileContent] = useState('');
  const [gameMeta, setGameMeta] = useState({ whiteName: '', whiteElo: '', whiteTitle: 'بدون تایتل', blackName: '', blackElo: '', blackTitle: 'بدون تایتل', event: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss' | 'draw'>('all');

  const filteredArchive = useMemo(() => MOCK_ARCHIVE.filter(g => (g.white.toLowerCase().includes(searchQuery.toLowerCase()) || g.black.toLowerCase().includes(searchQuery.toLowerCase())) && (filterResult === 'all' || g.result === filterResult)), [searchQuery, filterResult]);

  const handleFileSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedFileContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const processAndNavigate = async (data: string, meta?: any, forcedType?: string) => {
    setIsChecking(true);
    try {
      let finalData = data.trim();
      let finalType = forcedType || '';

      if (forcedType === 'LINK') {
        const urlLower = finalData.toLowerCase();
        const lichessMatch = finalData.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/);
        
        if (lichessMatch) {
          const gameId = lichessMatch[1].slice(0, 8);
          const res = await fetch(`https://lichess.org/game/export/${gameId}`);
          if (!res.ok) throw new Error('بازی یافت نشد.');
          finalData = await res.text();
          finalType = 'PGN';
        } else if (urlLower.includes('chess.com')) {
          throw new Error('دریافت مستقیم از Chess.com محدود است.\n\nلطفاً PGN بازی را کپی کرده و در بخش "وارد کردن PGN" قرار دهید.');
        } else {
          throw new Error('لینک نامعتبر است.');
        }
      }

      const chess = new Chess();
      if (finalType !== 'PGN') {
        try { chess.load(finalData); finalType = 'FEN'; }
        catch (e) {
          try { chess.loadPgn(finalData); finalType = 'PGN'; }
          catch (pe) { throw new Error('فرمت ورودی معتبر نیست.'); }
        }
      }

      setIsChecking(false);
      navigate('/analysis/board', { state: { data: finalData, type: finalType, meta } });

    } catch (err: any) {
      setErrorMessage(err.message);
      setIsChecking(false);
      setIsErrorModalOpen(true);
    }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" exit="exit" variants={containerVariants}
      className="min-h-screen bg-[#110f0d] text-zinc-200 flex flex-col items-center pb-20 relative overflow-hidden" dir="rtl"
    >
      {/* دایره‌های نوری پس‌زمینه (Animated Mesh Gradient) */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-farzin-accent/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] bg-sky-500/10 blur-[100px] rounded-full animate-pulse shadow-2xl" style={{ animationDelay: '2s' }}></div>

      {/* هدر صفحه */}
      <motion.div variants={itemVariants} className="w-full max-w-2xl px-6 py-10 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/home')} className="w-12 h-12 rounded-2xl bg-[#1e1c19]/80 backdrop-blur-md border border-[#35332e] flex items-center justify-center hover:border-farzin-accent hover:text-farzin-accent transition-all text-zinc-400 group">
            <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-black text-2xl text-white flex items-center gap-2">
               آزمایشگاه فرزین <Activity size={24} className="text-farzin-accent animate-pulse" />
            </h1>
            <span className="text-[10px] text-zinc-500 font-black tracking-[0.2em] mt-1 uppercase opacity-70">
              Source selection engine v1.0
            </span>
          </div>
        </div>
      </motion.div>

      {/* بدنه محتوا */}
      <div className="w-full max-w-2xl px-6 mt-2 flex flex-col gap-5 z-10">
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-sky-500/15 to-transparent border-r-4 border-sky-500 p-5 rounded-2xl backdrop-blur-sm shadow-xl">
           <div className="flex items-start gap-4">
              <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400"><Info size={20} /></div>
              <p className="text-sm text-sky-50/90 leading-relaxed font-bold">
                 برای رمزگشایی از استراتژی‌های بازی، ابتدا منبع داده را انتخاب کنید. موتور استوک‌فیش آماده پردازش حرکات شماست.
              </p>
           </div>
        </motion.div>

        <SourceCard 
          title="آنالیز جدید" desc="تحلیل عمیق را از حرکت اول (شروع بازی) کلید بزنید." 
          icon={Sparkles} color="text-farzin-accent" isHighlight={true}
          onClick={() => processAndNavigate('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SourceCard title="آرشیو فرزین" desc="بازخوانی بازی‌های ذخیره شده" icon={History} color="text-purple-400" onClick={() => setIsArchiveModalOpen(true)} />
            <SourceCard title="لینک مستقیم" desc="استخراج از لیچس و چس‌دات‌کام" icon={Globe} color="text-emerald-400" onClick={() => setIsLinkModalOpen(true)} />
            <SourceCard title="کد PGN / FEN" desc="پیست کردن مستقیم دیتای متنی" icon={FileText} color="text-amber-400" onClick={() => setIsInputModalOpen(true)} />
            <SourceCard title="بارگذاری فایل" desc="آپلود دیتابیس شخصی (PGN)" icon={UploadCloud} color="text-sky-400" onClick={() => setIsUploadModalOpen(true)} />
        </div>

        <SourceCard 
           title="میز چیدمان" desc="پوزیسیون اختصاصی خود را روی بورد بسازید." 
           icon={LayoutGrid} color="text-rose-400" 
           onClick={() => setIsEditorModalOpen(true)} 
        />
      </div>

      {/* فوتر کوچک */}
      <motion.div variants={itemVariants} className="mt-12 opacity-30 flex items-center gap-2 pointer-events-none">
          <Cpu size={14} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Powered by Stockfish 16.1 NNUE</span>
      </motion.div>

      {/* مودال‌ها با انیمیشن یکسان */}
      <BoardEditorModal isOpen={isEditorModalOpen} onClose={() => setIsEditorModalOpen(false)} onConfirm={(fen: string) => processAndNavigate(fen, null, 'FEN')} />

      {/* مودال لینک */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full sm:max-w-md bg-[#1a1917] border border-[#35332e] rounded-t-[40px] sm:rounded-[32px] shadow-2xl flex flex-col pb-safe">
                <div className="p-8 flex flex-col gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-2xl"><LinkIcon size={24} /></div>
                      <h3 className="font-black text-xl text-white">دریافت با لینک</h3>
                   </div>
                   <input type="url" className="w-full bg-[#12110f] border border-[#35332e] focus:border-emerald-500 rounded-2xl p-5 text-sm text-emerald-100 placeholder-zinc-600 outline-none transition-all shadow-inner" placeholder="https://lichess.org/..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} dir="ltr" />
                   <button onClick={() => processAndNavigate(linkInput, null, 'LINK')} disabled={!linkInput.trim() || isChecking} className={`w-full py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 ${!linkInput.trim() ? 'bg-zinc-800 text-zinc-600' : 'bg-emerald-500 text-black shadow-lg active:scale-95'}`}>
                      {isChecking ? <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Zap size={20} /> شروع پردازش</>}
                   </button>
                   <button onClick={() => setIsLinkModalOpen(false)} className="text-zinc-500 font-bold text-sm hover:text-white transition-colors">انصراف</button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال ورود متن */}
      <AnimatePresence>
        {isInputModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full sm:max-w-xl bg-[#1a1917] border border-[#35332e] rounded-t-[40px] sm:rounded-[32px] shadow-2xl flex flex-col pb-safe">
                <div className="p-8 flex flex-col gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-2xl"><FileText size={24} /></div>
                      <h3 className="font-black text-xl text-white">متن PGN یا FEN</h3>
                   </div>
                   <textarea className="w-full h-48 bg-[#12110f] border border-[#35332e] focus:border-amber-500 rounded-2xl p-5 text-sm text-amber-100 placeholder-zinc-600 outline-none transition-all shadow-inner font-mono leading-relaxed" placeholder="دیتای بازی را اینجا پیست کنید..." value={inputData} onChange={(e) => setInputData(e.target.value)} dir="ltr" spellCheck={false} />
                   <button onClick={() => processAndNavigate(inputData)} disabled={!inputData.trim() || isChecking} className={`w-full py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 ${!inputData.trim() ? 'bg-zinc-800 text-zinc-600' : 'bg-amber-500 text-black shadow-lg active:scale-95'}`}>
                      {isChecking ? <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Zap size={20} /> ورود به آزمایشگاه</>}
                   </button>
                   <button onClick={() => setIsInputModalOpen(false)} className="text-zinc-500 font-bold text-sm hover:text-white transition-colors">انصراف</button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال ارور */}
      <AnimatePresence>
        {isErrorModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4" dir="rtl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-[#1e1c19] border border-rose-500/30 rounded-[36px] shadow-2xl flex flex-col items-center p-10 text-center">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 animate-bounce"><AlertTriangle size={40} className="text-rose-500" /></div>
              <h3 className="font-black text-2xl text-white mb-3">خطا در منبع</h3>
              <p className="text-sm text-zinc-400 mb-8 px-2 whitespace-pre-line leading-relaxed font-bold">{errorMessage}</p>
              <button onClick={() => setIsErrorModalOpen(false)} className="w-full py-4 rounded-2xl font-black text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg active:scale-95 transition-all">بستن</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}