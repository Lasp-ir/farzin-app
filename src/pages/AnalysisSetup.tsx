import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Activity, FileText, 
  UploadCloud, LayoutGrid, X, AlertTriangle, 
  ChevronLeft, Zap, Info, History, Search, 
  Link as LinkIcon, Sparkles, Plus, Globe, Cpu, Bookmark, Trash2, Calendar, User
} from 'lucide-react';
import BoardEditorModal from '../components/BoardEditorModal';

// دیتای نمایشی برای آرشیو (بازی‌های بزرگان)
const MOCK_ARCHIVE = [
  { id: '1', white: 'Magnus Carlsen', black: 'Alireza Firouzja', result: '1-0', date: '2024.05.10', event: 'Norway Chess', pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5' },
  { id: '2', white: 'Hikaru Nakamura', black: 'Ian Nepomniachtchi', result: '1/2-1/2', date: '2024.04.15', event: 'Candidates', pgn: '1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O' },
  { id: '3', white: 'Ding Liren', black: 'Gukesh D', result: '0-1', date: '2024.05.01', event: 'Tata Steel', pgn: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O' },
];

// دیتای نمایشی برای آنالیزهای سیو شده کاربر
const MOCK_SAVED = [
  { id: 's1', title: 'تمرین آخر هفته', date: '۱۴۰۳/۰۲/۲۲', pgn: '1. e4 e5 2. f4 exf4 3. Nf3 g5' },
  { id: 's2', title: 'بررسی بازی لیگ', date: '۱۴۰۳/۰۲/۱۸', pgn: '1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6' },
];

const TITLES = ['بدون تایتل', 'GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  exit: { opacity: 0, y: 20, transition: { ease: 'easeInOut', duration: 0.3 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const SourceCard = ({ title, desc, icon: Icon, color, onClick, isHighlight }: any) => (
  <motion.div 
    variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} onClick={onClick}
    className={`group flex items-center justify-between p-5 rounded-[28px] border transition-all duration-500 cursor-pointer relative overflow-hidden ${
      isHighlight ? 'bg-gradient-to-br from-farzin-accent/20 to-emerald-900/10 border-farzin-accent/40 shadow-xl' : 'bg-[#1e1c19]/60 border-[#35332e] hover:border-zinc-500 backdrop-blur-md shadow-lg'
    }`}
  >
    <div className="flex items-center gap-5 relative z-10">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform duration-500 group-hover:rotate-[8deg] ${
        isHighlight ? 'bg-farzin-accent/20 border-farzin-accent/30' : 'bg-[#161512] border-[#35332e]'
      }`}>
        <Icon size={26} className={`${color} drop-shadow-md`} />
      </div>
      <div className="flex flex-col">
        <span className="font-black text-lg text-white group-hover:text-farzin-accent transition-colors tracking-tight">{title}</span>
        <span className="text-[11px] text-zinc-500 font-medium mt-1 leading-tight group-hover:text-zinc-400">{desc}</span>
      </div>
    </div>
    <div className={`p-2 rounded-full transition-all duration-300 ${isHighlight ? 'bg-farzin-accent/20 text-farzin-accent' : 'bg-zinc-800 text-zinc-600 group-hover:bg-zinc-700 group-hover:text-zinc-300'}`}>
        <ChevronLeft size={16} />
    </div>
  </motion.div>
);

export default function AnalysisSetup() {
  const navigate = useNavigate();
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss' | 'draw'>('all');

  const filteredArchive = useMemo(() => MOCK_ARCHIVE.filter(g => (g.white.toLowerCase().includes(searchQuery.toLowerCase()) || g.black.toLowerCase().includes(searchQuery.toLowerCase()))), [searchQuery]);

  const handleFileSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
        setUploadedFileContent(ev.target?.result as string);
        processAndNavigate(ev.target?.result as string, null, 'PGN');
    };
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
          const res = await fetch(`https://lichess.org/game/export/${lichessMatch[1].slice(0, 8)}`);
          if (!res.ok) throw new Error('بازی یافت نشد.');
          finalData = await res.text();
          finalType = 'PGN';
        } else if (urlLower.includes('chess.com')) {
          throw new Error('دریافت مستقیم از Chess.com محدود است. PGN را دستی کپی کنید.');
        } else throw new Error('لینک نامعتبر است.');
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
    <motion.div initial="hidden" animate="visible" exit="exit" variants={containerVariants} className="min-h-screen bg-[#110f0d] text-zinc-200 flex flex-col items-center pb-20 relative overflow-hidden" dir="rtl">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-farzin-accent/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] bg-sky-500/10 blur-[100px] rounded-full animate-pulse shadow-2xl" style={{ animationDelay: '2s' }}></div>

      <motion.div variants={itemVariants} className="w-full max-w-2xl px-6 py-10 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/home')} className="w-12 h-12 rounded-2xl bg-[#1e1c19]/80 backdrop-blur-md border border-[#35332e] flex items-center justify-center hover:border-farzin-accent hover:text-farzin-accent transition-all text-zinc-400 group"><ArrowRight size={22} className="transition-transform group-hover:translate-x-1" /></button>
          <div className="flex flex-col"><h1 className="font-black text-2xl text-white flex items-center gap-2">آزمایشگاه فرزین <Activity size={24} className="text-farzin-accent animate-pulse" /></h1><span className="text-[10px] text-zinc-500 font-black tracking-[0.2em] mt-1 uppercase opacity-70">Source selection engine v1.0</span></div>
        </div>
      </motion.div>

      <div className="w-full max-w-2xl px-6 mt-2 flex flex-col gap-5 z-10">
        <SourceCard title="آنالیز جدید" desc="تحلیل عمیق را از شروع بازی کلید بزنید." icon={Sparkles} color="text-farzin-accent" isHighlight={true} onClick={() => processAndNavigate('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')} />
        <SourceCard title="آنالیزهای ذخیره شده" desc="مشاهده تحلیل‌هایی که قبلاً سیو کرده‌اید." icon={Bookmark} color="text-amber-400" onClick={() => setIsSavedModalOpen(true)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SourceCard title="آرشیو بزرگان" desc="بازخوانی بازی‌های دیتابیس جهانی" icon={History} color="text-purple-400" onClick={() => setIsArchiveModalOpen(true)} />
            <SourceCard title="لینک مستقیم" desc="استخراج از لیچس و چس‌دات‌کام" icon={Globe} color="text-emerald-400" onClick={() => setIsLinkModalOpen(true)} />
            <SourceCard title="کد PGN / FEN" desc="پیست کردن مستقیم دیتای متنی" icon={FileText} color="text-amber-400" onClick={() => setIsInputModalOpen(true)} />
            <SourceCard title="بارگذاری فایل" desc="آپلود فایل PGN از حافظه" icon={UploadCloud} color="text-sky-400" onClick={() => setIsUploadModalOpen(true)} />
        </div>

        <SourceCard title="میز چیدمان" desc="پوزیسیون اختصاصی خود را بسازید." icon={LayoutGrid} color="text-rose-400" onClick={() => setIsEditorModalOpen(true)} />
      </div>

      <BoardEditorModal isOpen={isEditorModalOpen} onClose={() => setIsEditorModalOpen(false)} onConfirm={(fen: string) => processAndNavigate(fen, null, 'FEN')} />

      {/* مودال آرشیو بزرگان */}
      <AnimatePresence>
        {isArchiveModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }} className="w-full sm:max-w-lg bg-[#1a1917] border border-[#35332e] rounded-t-[40px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-[#35332e] flex items-center justify-between">
                    <h3 className="font-black text-xl text-white flex items-center gap-3"><History className="text-purple-400" /> آرشیو بزرگان</h3>
                    <button onClick={() => setIsArchiveModalOpen(false)} className="p-2 bg-[#262421] rounded-xl text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <div className="p-4"><div className="relative"><Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="جستجوی بازیکن یا رویداد..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#12110f] border border-[#35332e] rounded-2xl py-3 pr-12 pl-4 text-sm outline-none focus:border-purple-500 transition-all shadow-inner" /></div></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
                    {filteredArchive.map(game => (
                        <div key={game.id} className="bg-[#12110f]/80 border border-[#35332e] hover:border-purple-500/50 p-4 rounded-2xl transition-all group">
                            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{game.event}</span><span className="text-[10px] text-zinc-600 font-mono">{game.date}</span></div>
                            <div className="flex items-center justify-between gap-4"><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full"></div><span className="text-sm font-bold text-white">{game.white}</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-zinc-700 rounded-full"></div><span className="text-sm font-bold text-white">{game.black}</span></div></div><div className="flex flex-col items-end gap-2"><span className="text-xs font-black text-zinc-400 bg-[#262421] px-2 py-1 rounded-lg">{game.result}</span><button onClick={() => processAndNavigate(game.pgn)} className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-400 transition-all active:scale-90 shadow-lg"><Plus size={18} /></button></div></div>
                        </div>
                    ))}
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال آنالیزهای ذخیره شده (فیچر جدید) */}
      <AnimatePresence>
        {isSavedModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }} className="w-full sm:max-w-md bg-[#1a1917] border border-[#35332e] rounded-t-[40px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-[#35332e] flex items-center justify-between">
                    <h3 className="font-black text-xl text-white flex items-center gap-3"><Bookmark className="text-amber-400" /> آنالیزهای سیو شده</h3>
                    <button onClick={() => setIsSavedModalOpen(false)} className="p-2 bg-[#262421] rounded-xl text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
                    {MOCK_SAVED.length > 0 ? MOCK_SAVED.map(item => (
                        <div key={item.id} className="bg-[#12110f] border border-[#35332e] p-5 rounded-[24px] flex items-center justify-between group hover:border-amber-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500"><FileText size={22} /></div>
                                <div className="flex flex-col"><span className="font-bold text-white text-base">{item.title}</span><span className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.date}</span></div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                <button onClick={() => processAndNavigate(item.pgn)} className="bg-amber-500 hover:bg-amber-400 text-black p-2.5 rounded-xl transition-all active:scale-90 shadow-lg shadow-amber-500/10"><ChevronLeft size={20} /></button>
                            </div>
                        </div>
                    )) : (<div className="flex flex-col items-center justify-center py-10 opacity-30"><Bookmark size={48} className="mb-4" /><span>هنوز آنالیزی ذخیره نکرده‌اید</span></div>)}
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال آپلود فایل */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" dir="rtl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="w-full max-w-sm bg-[#1e1c19] border border-[#35332e] rounded-[36px] p-8 text-center shadow-2xl relative">
              <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 left-4 p-1.5 text-zinc-600 hover:text-white"><X size={20} /></button>
              <div className="w-20 h-20 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-6"><UploadCloud size={40} className="text-sky-400" /></div>
              <h3 className="font-black text-2xl text-white mb-2">انتخاب فایل PGN</h3>
              <p className="text-sm text-zinc-500 mb-8">فایل بازی را با پسوند .pgn انتخاب کنید تا فوراً آنالیز شروع شود.</p>
              <input type="file" accept=".pgn,.txt" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 rounded-2xl font-black text-sm bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 active:scale-95 transition-all">انتخاب فایل از حافظه</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال لینک مستقیم */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full sm:max-w-md bg-[#1a1917] border border-[#35332e] rounded-t-[40px] sm:rounded-[32px] shadow-2xl flex flex-col p-8 gap-6">
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-2xl"><LinkIcon size={24} /></div><h3 className="font-black text-xl text-white">دریافت با لینک</h3></div>
                <input type="url" className="w-full bg-[#12110f] border border-[#35332e] focus:border-emerald-500 rounded-2xl p-5 text-sm text-emerald-100 outline-none transition-all shadow-inner" placeholder="https://lichess.org/..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} dir="ltr" />
                <button onClick={() => processAndNavigate(linkInput, null, 'LINK')} disabled={!linkInput.trim() || isChecking} className={`w-full py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 ${!linkInput.trim() ? 'bg-zinc-800 text-zinc-600' : 'bg-emerald-500 text-black shadow-lg active:scale-95'}`}>
                   {isChecking ? <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Zap size={20} /> استخراج و شروع</>}
                </button>
                <button onClick={() => setIsLinkModalOpen(false)} className="text-zinc-500 font-bold text-sm">لغو</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال ورود متن */}
      <AnimatePresence>
        {isInputModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full sm:max-w-xl bg-[#1a1917] border border-[#35332e] rounded-t-[40px] sm:rounded-[32px] shadow-2xl flex flex-col p-8 gap-6">
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-2xl"><FileText size={24} /></div><h3 className="font-black text-xl text-white">متن PGN یا FEN</h3></div>
                <textarea className="w-full h-48 bg-[#12110f] border border-[#35332e] focus:border-amber-500 rounded-2xl p-5 text-sm text-amber-100 outline-none transition-all shadow-inner font-mono leading-relaxed" placeholder="دیتای بازی را اینجا پیست کنید..." value={inputData} onChange={(e) => setInputData(e.target.value)} dir="ltr" spellCheck={false} />
                <button onClick={() => processAndNavigate(inputData)} disabled={!inputData.trim() || isChecking} className={`w-full py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 ${!inputData.trim() ? 'bg-zinc-800 text-zinc-600' : 'bg-amber-500 text-black shadow-lg'}`}>
                   {isChecking ? <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Zap size={20} /> ورود به آزمایشگاه</>}
                </button>
                <button onClick={() => setIsInputModalOpen(false)} className="text-zinc-500 font-bold text-sm">لغو</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال ارور */}
      <AnimatePresence>
        {isErrorModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4" dir="rtl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#1e1c19] border border-rose-500/30 rounded-[36px] p-10 text-center shadow-2xl">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce"><AlertTriangle size={40} className="text-rose-500" /></div>
              <h3 className="font-black text-2xl text-white mb-3">خطا در منبع</h3>
              <p className="text-sm text-zinc-400 mb-8 px-2 whitespace-pre-line leading-relaxed font-bold">{errorMessage}</p>
              <button onClick={() => setIsErrorModalOpen(false)} className="w-full py-4 rounded-2xl font-black text-sm bg-rose-600 text-white shadow-lg active:scale-95 transition-all">بستن</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}