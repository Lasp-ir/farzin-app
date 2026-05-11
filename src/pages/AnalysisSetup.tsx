// src/pages/AnalysisSetup.tsx
import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Activity, FileText, 
  UploadCloud, LayoutGrid, X, AlertTriangle, 
  ChevronLeft, Zap, Info, History, Search, Swords, User, Calendar, ChevronDown,
  Link as LinkIcon, Sparkles
} from 'lucide-react';

// --- دیتای تستی آرشیو ---
const MOCK_ARCHIVE = [
  { id: '1', white: 'Alireza_Karkon', black: 'Stockfish_16', result: 'win', date: 'امروز', pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4' },
  { id: '2', white: 'Hikaru', black: 'Alireza_Karkon', result: 'loss', date: 'دیروز', pgn: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7' },
  { id: '3', white: 'Alireza_Karkon', black: 'Farzin_Engine', result: 'draw', date: '۲ روز پیش', pgn: '1. c4 c5 2. Nc3 Nc6 3. g3 g6' },
  { id: '4', white: 'MagnusC', black: 'Alireza_Karkon', result: 'win', date: 'هفته پیش', pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4' },
  { id: '5', white: 'Alireza_Karkon', black: 'Garry_K', result: 'win', date: 'هفته پیش', pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6' },
];

const TITLES = ['بدون تایتل', 'GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];

// کامپوننت اختصاصی دراپ‌داون
const CustomSelect = ({ value, onChange, options }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative w-1/2">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1e1c19] border border-[#35332e] hover:border-zinc-500 rounded-lg py-2.5 px-3 text-sm flex justify-between items-center cursor-pointer transition-colors h-[42px]"
      >
        <span className={value === 'بدون تایتل' ? 'text-zinc-500' : 'text-sky-400 font-bold'}>{value}</span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#1e1c19] border border-[#35332e] rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar"
            >
              {options.map((opt: string) => (
                <div 
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`px-3 py-2.5 text-sm cursor-pointer transition-colors flex items-center ${value === opt ? 'bg-sky-500/10 text-sky-400 font-bold border-l-2 border-sky-500' : 'text-zinc-300 hover:bg-[#262421]'}`}
                >
                  {opt}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// 🔥 SourceCard اصلاح شده تا بتونه کلیک بخوره و پاپ‌آپ رو باز کنه
const SourceCard = ({ title, desc, icon: Icon, color, onClick, badge }: any) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-5 rounded-[22px] bg-[#1e1c19] border border-[#35332e] hover:border-[#52525b] hover:bg-[#262421] cursor-pointer transition-all duration-300 group relative overflow-hidden active:scale-[0.98]"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[#161512] flex items-center justify-center border border-[#35332e] shadow-inner group-hover:scale-105 transition-transform">
        <Icon size={22} className={color} />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-lg text-white flex items-center gap-2">
          {title}
          {badge === 'SOON' && <span className="text-[9px] font-black tracking-widest uppercase bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/20">به زودی</span>}
        </span>
        <span className="text-xs text-zinc-500 mt-1">{desc}</span>
      </div>
    </div>
    <ChevronLeft size={20} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
  </div>
);

export default function AnalysisSetup() {
  const navigate = useNavigate();
  
  // استیت‌های پاپ‌آپ‌ها
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSoonModalOpen, setIsSoonModalOpen] = useState(false); // 🔥 پاپ‌آپ به زودی
  
  // استیت‌های ورودی
  const [inputData, setInputData] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // استیت‌های آپلود
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileContent, setUploadedFileContent] = useState('');
  const [gameMeta, setGameMeta] = useState({
    whiteName: '', whiteElo: '', whiteTitle: 'بدون تایتل',
    blackName: '', blackElo: '', blackTitle: 'بدون تایتل',
    event: ''
  });

  // استیت‌های آرشیو
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss' | 'draw'>('all');

  const filteredArchive = useMemo(() => {
    return MOCK_ARCHIVE.filter(game => {
      const matchesSearch = game.white.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            game.black.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterResult === 'all' || game.result === filterResult;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterResult]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedFileContent(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const processAndNavigate = (data: string, meta?: any, forcedType?: string) => {
    setIsChecking(true);
    
    setTimeout(() => {
      let isValid = false;
      let finalType = forcedType || '';

      if (forcedType === 'LINK') {
        const urlLower = data.toLowerCase();
        if (urlLower.includes('lichess.org/') || urlLower.includes('chess.com/')) {
          isValid = true;
        }
      } else {
        const chess = new Chess();
        try {
          if (chess.load(data)) {
            isValid = true;
            finalType = 'FEN';
          } else if (chess.loadPgn(data)) {
            isValid = true;
            finalType = 'PGN';
          }
        } catch (e) {
          isValid = false;
        }
      }

      setIsChecking(false);

      if (isValid) {
        setIsInputModalOpen(false);
        setIsArchiveModalOpen(false);
        setIsUploadModalOpen(false);
        setIsLinkModalOpen(false);
        navigate('/analysis/board', { state: { data, type: finalType, meta } });
      } else {
        setIsErrorModalOpen(true);
      }
    }, 600);
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
          title="انتخاب از آرشیو" 
          desc="دسترسی سریع به بازی‌های ذخیره شده" 
          icon={History} 
          color="text-purple-400" 
          onClick={() => setIsArchiveModalOpen(true)} 
        />

        <SourceCard 
          title="وارد کردن لینک بازی" 
          desc="وارد کردن لینک بازی از چس و لیچس" 
          icon={LinkIcon} 
          color="text-emerald-400" 
          onClick={() => setIsLinkModalOpen(true)} 
        />

        <SourceCard 
          title="وارد کردن PGN / FEN" 
          desc="پیست کردن مستقیم کدهای متنی بازی" 
          icon={FileText} 
          color="text-amber-400" 
          onClick={() => setIsInputModalOpen(true)} 
        />
        
        <SourceCard 
          title="آپلود فایل PGN" 
          desc="بارگذاری فایل از سیستم به همراه مشخصات" 
          icon={UploadCloud} 
          color="text-sky-400" 
          onClick={() => setIsUploadModalOpen(true)} 
        />

        {/* 🔥 دکمه چیدمان دستی که پاپ‌آپ رو باز میکنه */}
        <SourceCard 
          title="چیدمان دستی مهره‌ها" 
          desc="ساخت پوزیشن دلخواه روی بورد" 
          icon={LayoutGrid} 
          color="text-rose-400" 
          badge="SOON"
          onClick={() => setIsSoonModalOpen(true)} 
        />
      </div>

      {/* 🔥 پاپ‌آپ شیک و مدرنِ «به زودی» (Coming Soon Modal) */}
      <AnimatePresence>
        {isSoonModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md px-4" 
            dir="rtl" 
            onClick={() => setIsSoonModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }} 
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-sm bg-[#1e1c19] border border-[#35332e] rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col items-center p-8 text-center relative overflow-hidden"
            >
              
              {/* افکت‌های پس‌زمینه مودال */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/20 rounded-full blur-[40px] pointer-events-none"></div>

              {/* دکمه بستن */}
              <button onClick={() => setIsSoonModalOpen(false)} className="absolute top-4 right-4 p-2 bg-[#161512] border border-[#35332e] rounded-full text-zinc-400 hover:text-white transition-colors z-20">
                <X size={16} />
              </button>

              {/* آیکون مرکزی */}
              <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(225,29,72,0.2)] relative z-10">
                  <LayoutGrid size={36} className="text-rose-500" />
                  <Sparkles size={20} className="absolute -top-2 -right-2 text-amber-400 animate-pulse" />
              </div>

              {/* متن‌ها */}
              <h3 className="font-black text-2xl text-white mb-2 relative z-10">در حال توسعه...</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-8 relative z-10 px-2">
                بخش <span className="text-rose-400 font-bold">چیدمان دستی مهره‌ها (Board Editor)</span> در آپدیت بعدی فرزین فعال می‌شود. به زودی می‌توانید هر سناریویی را برای آنالیز در این بخش خلق کنید!
              </p>

              {/* دکمه */}
              <button 
                onClick={() => setIsSoonModalOpen(false)} 
                className="w-full py-4 rounded-xl font-black text-sm bg-[#262421] text-white border border-[#403e3a] hover:bg-[#35332e] hover:border-zinc-500 transition-all active:scale-95 relative z-10 shadow-lg"
              >
                متوجه شدم
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* سایر پاپ‌آپ‌ها: لینک، آپلود، آرشیو، دستی، ارور */}
      {/* (کد این پاپ‌آپ‌ها همون قبلی‌هاست که دست‌نخورده باقی مونده) */}

      <AnimatePresence>
        {isLinkModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full sm:max-w-md bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe">
              <div className="p-6 border-b border-[#35332e] flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><LinkIcon size={20} /></div><h3 className="font-black text-lg text-white">وارد کردن لینک بازی</h3></div>
                <button onClick={() => setIsLinkModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <input type="url" className="w-full bg-[#161512] border border-[#35332e] focus:border-emerald-500 rounded-xl p-4 text-sm text-emerald-100 placeholder-zinc-600 outline-none transition-colors shadow-inner" placeholder="https://lichess.org/..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} dir="ltr" spellCheck={false} />
                  <span className="text-[11px] text-zinc-500 mr-2">فقط لینک‌های معتبر از Lichess و Chess.com</span>
                </div>
                <button onClick={() => processAndNavigate(linkInput, null, 'LINK')} disabled={!linkInput.trim() || isChecking} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!linkInput.trim() ? 'bg-[#262421] text-zinc-500' : 'bg-emerald-500 text-black shadow-[0_5px_20px_rgba(16,185,129,0.3)] active:scale-95'}`}>{isChecking ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Zap size={18} /> بررسی و استخراج PGN</>}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full sm:max-w-xl bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe max-h-[90vh]">
              <div className="p-5 border-b border-[#35332e] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400"><UploadCloud size={20} /></div><h3 className="font-black text-lg text-white">آپلود و تنظیمات بازی</h3></div>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                <div onClick={() => fileInputRef.current?.click()} className={`w-full p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${uploadedFileName ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'bg-[#161512] border-[#35332e] hover:border-sky-500/50'}`}>
                  <input type="file" accept=".pgn,.txt" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  {uploadedFileName ? (
                    <><div className="w-12 h-12 bg-sky-500/20 rounded-full flex items-center justify-center"><FileText size={24} className="text-sky-400" /></div><span className="font-bold text-sky-400 text-sm" dir="ltr">{uploadedFileName}</span></>
                  ) : (
                    <><div className="w-12 h-12 bg-[#262421] rounded-full flex items-center justify-center"><UploadCloud size={24} className="text-zinc-500" /></div><div className="text-center"><p className="font-bold text-zinc-300 text-sm">برای انتخاب فایل کلیک کنید</p><p className="text-xs text-zinc-500 mt-1">فرمت‌های مجاز: PGN و TXT</p></div></>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* سفید */}
                  <div className="bg-[#161512] border border-[#35332e] p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-white border border-zinc-400 rounded-sm"></div><span className="font-bold text-sm text-zinc-300">بازیکن سفید</span></div>
                    <div className="relative"><User size={14} className="absolute right-3 top-3.5 text-zinc-500" /><input type="text" placeholder="نام بازیکن" value={gameMeta.whiteName} onChange={e => setGameMeta({...gameMeta, whiteName: e.target.value})} className="w-full bg-[#1e1c19] border border-[#35332e] focus:border-white rounded-lg py-2.5 pr-9 pl-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors" /></div>
                    <div className="flex gap-2">
                      <div className="relative w-1/2"><Activity size={14} className="absolute right-3 top-3.5 text-zinc-500" /><input type="number" placeholder="ریتینگ" value={gameMeta.whiteElo} onChange={e => setGameMeta({...gameMeta, whiteElo: e.target.value})} className="w-full bg-[#1e1c19] border border-[#35332e] focus:border-white rounded-lg py-2.5 pr-9 pl-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors" /></div>
                      <CustomSelect value={gameMeta.whiteTitle} onChange={(val: string) => setGameMeta({...gameMeta, whiteTitle: val})} options={TITLES} />
                    </div>
                  </div>
                  {/* سیاه */}
                  <div className="bg-[#161512] border border-[#35332e] p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-black border border-zinc-700 rounded-sm"></div><span className="font-bold text-sm text-zinc-300">بازیکن سیاه</span></div>
                    <div className="relative"><User size={14} className="absolute right-3 top-3.5 text-zinc-500" /><input type="text" placeholder="نام بازیکن" value={gameMeta.blackName} onChange={e => setGameMeta({...gameMeta, blackName: e.target.value})} className="w-full bg-[#1e1c19] border border-[#35332e] focus:border-zinc-500 rounded-lg py-2.5 pr-9 pl-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors" /></div>
                    <div className="flex gap-2">
                      <div className="relative w-1/2"><Activity size={14} className="absolute right-3 top-3.5 text-zinc-500" /><input type="number" placeholder="ریتینگ" value={gameMeta.blackElo} onChange={e => setGameMeta({...gameMeta, blackElo: e.target.value})} className="w-full bg-[#1e1c19] border border-[#35332e] focus:border-zinc-500 rounded-lg py-2.5 pr-9 pl-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors" /></div>
                      <CustomSelect value={gameMeta.blackTitle} onChange={(val: string) => setGameMeta({...gameMeta, blackTitle: val})} options={TITLES} />
                    </div>
                  </div>
                </div>
                <div className="relative"><Calendar size={16} className="absolute right-4 top-4 text-zinc-500" /><input type="text" placeholder="نام مسابقه یا رویداد (اختیاری)" value={gameMeta.event} onChange={e => setGameMeta({...gameMeta, event: e.target.value})} className="w-full bg-[#161512] border border-[#35332e] focus:border-sky-500 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors" /></div>
              </div>
              <div className="p-5 border-t border-[#35332e] bg-[#1a1815] shrink-0 rounded-b-[32px] sm:rounded-b-[28px]">
                <button onClick={() => processAndNavigate(uploadedFileContent, gameMeta)} disabled={!uploadedFileContent || isChecking} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!uploadedFileContent ? 'bg-[#262421] text-zinc-500' : 'bg-sky-500 text-white shadow-[0_5px_20px_rgba(56,189,248,0.3)] active:scale-95'}`}>{isChecking ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <><Zap size={18} /> تایید مشخصات و ورود به آزمایشگاه</>}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isArchiveModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full sm:max-w-md bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe max-h-[85vh]">
              <div className="p-5 border-b border-[#35332e] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><History size={20} /></div><h3 className="font-black text-lg text-white">آرشیو بازی‌ها</h3></div>
                <button onClick={() => setIsArchiveModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-4 border-b border-[#35332e] flex flex-col gap-3 shrink-0">
                <div className="relative"><div className="absolute inset-y-0 right-3 flex items-center text-zinc-500"><Search size={16} /></div><input type="text" placeholder="جستجوی حریف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#161512] border border-[#35332e] focus:border-purple-500 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors" /></div>
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {[{ id: 'all', label: 'همه' }, { id: 'win', label: 'بردها' }, { id: 'loss', label: 'باخت‌ها' }, { id: 'draw', label: 'مساوی' }].map(filter => (
                    <button key={filter.id} onClick={() => setFilterResult(filter.id as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filterResult === filter.id ? 'bg-purple-500 text-white' : 'bg-[#262421] text-zinc-400 hover:text-white border border-[#35332e]'}`}>{filter.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3">
                {filteredArchive.length > 0 ? (filteredArchive.map((game) => (
                  <div key={game.id} className="bg-[#161512] border border-[#35332e] p-3.5 rounded-2xl flex items-center justify-between group hover:border-[#52525b] transition-colors">
                    <div className="flex items-center gap-3"><div className={`w-1.5 h-10 rounded-full ${game.result === 'win' ? 'bg-emerald-500' : game.result === 'loss' ? 'bg-rose-500' : 'bg-zinc-500'}`}></div><div className="flex flex-col"><div className="flex items-center gap-1.5 text-sm font-bold text-white"><span>{game.white}</span><Swords size={12} className="text-zinc-600" /><span>{game.black}</span></div><span className="text-[10px] text-zinc-500 mt-0.5">{game.date}</span></div></div>
                    <button onClick={() => processAndNavigate(game.pgn)} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#262421] text-purple-400 border border-[#35332e] hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all active:scale-95 shrink-0">انتخاب</button>
                  </div>
                ))) : (<div className="flex flex-col items-center justify-center py-10 opacity-50"><History size={40} className="text-zinc-600 mb-3" /><span className="text-sm font-bold text-zinc-400">بازی با این مشخصات یافت نشد</span></div>)}
              </div>
              {isChecking && <div className="absolute inset-0 bg-[#1e1c19]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-t-[32px] sm:rounded-[28px]"><div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-3"></div><span className="text-sm font-bold text-purple-400 animate-pulse">در حال انتقال...</span></div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInputModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full sm:max-w-md bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe">
              <div className="p-6 border-b border-[#35332e] flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><FileText size={20} /></div><h3 className="font-black text-lg text-white">متن PGN یا FEN</h3></div>
                <button onClick={() => setIsInputModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <textarea className="w-full h-48 bg-[#161512] border border-[#35332e] focus:border-amber-500 rounded-xl p-4 text-sm text-amber-100 placeholder-zinc-600 outline-none transition-colors shadow-inner font-mono leading-relaxed" placeholder="Paste here..." value={inputData} onChange={(e) => setInputData(e.target.value)} dir="ltr" spellCheck={false} />
                <button onClick={() => processAndNavigate(inputData)} disabled={!inputData.trim() || isChecking} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!inputData.trim() ? 'bg-[#262421] text-zinc-500' : 'bg-amber-500 text-black shadow-[0_5px_20px_rgba(245,158,11,0.3)] active:scale-95'}`}>{isChecking ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Zap size={18} /> بررسی و ورود به آزمایشگاه</>}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isErrorModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" dir="rtl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-[#1e1c19] border border-rose-500/30 rounded-[28px] shadow-[0_20px_60px_rgba(225,29,72,0.2)] flex flex-col items-center p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(225,29,72,0.2)]"><AlertTriangle size={32} className="text-rose-500" /></div>
              <h3 className="font-black text-xl text-white mb-2">لینک/فرمت ورودی نامعتبر!</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-8">متنی که وارد کرده‌اید با استانداردهای PGN/FEN یا لینک‌های معتبر همخوانی ندارد.</p>
              <button onClick={() => setIsErrorModalOpen(false)} className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#262421] text-white border border-[#35332e] hover:border-zinc-500 hover:bg-[#35332e] transition-all active:scale-95">بستن</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}