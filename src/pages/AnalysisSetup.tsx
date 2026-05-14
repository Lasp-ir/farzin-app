// src/pages/AnalysisSetup.tsx
import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Activity, FileText, 
  UploadCloud, LayoutGrid, X, AlertTriangle, 
  ChevronLeft, Zap, Info, History, Search, Swords, User, Calendar, ChevronDown,
  Link as LinkIcon, Sparkles, Plus
} from 'lucide-react';

import BoardEditorModal from '../components/BoardEditorModal';

const MOCK_ARCHIVE = [
  { id: '1', white: 'Alireza_Karkon', black: 'Stockfish_16', result: 'win', date: 'امروز', pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4' },
  { id: '2', white: 'Hikaru', black: 'Alireza_Karkon', result: 'loss', date: 'دیروز', pgn: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7' },
  { id: '3', white: 'Alireza_Karkon', black: 'Farzin_Engine', result: 'draw', date: '۲ روز پیش', pgn: '1. c4 c5 2. Nc3 Nc6 3. g3 g6' },
];

const TITLES = ['بدون تایتل', 'GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];

const CustomSelect = ({ value, onChange, options }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative w-1/2">
      <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-[#1e1c19] border border-[#35332e] hover:border-zinc-500 rounded-lg py-2.5 px-3 text-sm flex justify-between items-center cursor-pointer h-[42px] transition-all">
        <span className={value === 'بدون تایتل' ? 'text-zinc-500' : 'text-sky-400 font-bold'}>{value}</span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>{isOpen && (<><div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div><motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-[#1e1c19] border border-[#35332e] rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">{options.map((opt: string) => (<div key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt ? 'bg-sky-500/10 text-sky-400 font-bold' : 'text-zinc-300 hover:bg-[#262421]'}`}>{opt}</div>))}</motion.div></>)}</AnimatePresence>
    </div>
  );
};

const SourceCard = ({ title, desc, icon: Icon, color, onClick, badge, isHighlight }: any) => (
  <motion.div 
    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onClick}
    className={`flex items-center justify-between p-5 rounded-[24px] border transition-all duration-300 cursor-pointer relative overflow-hidden ${isHighlight ? 'bg-gradient-to-r from-[#1e1c19] to-[#20281b] border-farzin-accent/30 shadow-[0_10px_30px_rgba(119,149,86,0.1)]' : 'bg-[#1e1c19] border-[#35332e] hover:border-zinc-600 shadow-lg'}`}
  >
    <div className="flex items-center gap-4 relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${isHighlight ? 'bg-farzin-accent/10 border-farzin-accent/20' : 'bg-[#161512] border-[#35332e]'}`}>
        <Icon size={24} className={color} />
      </div>
      <div className="flex flex-col">
        <span className="font-black text-lg text-white flex items-center gap-2">
          {title}
          {badge === 'SOON' && <span className="text-[9px] font-black tracking-tighter bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 uppercase">Coming Soon</span>}
        </span>
        <span className="text-xs text-zinc-500 mt-1">{desc}</span>
      </div>
    </div>
    <ChevronLeft size={20} className={isHighlight ? 'text-farzin-accent' : 'text-zinc-600'} />
    {isHighlight && <div className="absolute top-0 right-0 w-32 h-32 bg-farzin-accent/5 rounded-full blur-3xl pointer-events-none"></div>}
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
  const [errorMessage, setErrorMessage] = useState('');


  const [inputData, setInputData] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);

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

  // 🌟 منطق پردازش، اعتبارسنجی و دانلود PGN در صورت نیاز
  const processAndNavigate = async (data: string, meta?: any, forcedType?: string) => {
    setIsChecking(true);
    setErrorMessage('فرمت ورودی صحیح نیست. لطفاً FEN یا PGN استاندارد وارد کنید.'); // پیام خطای پیش‌فرض

    try {
      let finalData = data.trim();
      let finalType = forcedType || '';

      // 🌟 فاز ۴: هندل کردن لینک‌های بازی
      if (forcedType === 'LINK') {
        const urlLower = finalData.toLowerCase();
        const lichessMatch = finalData.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/);
        
        if (lichessMatch) {
          const gameId = lichessMatch[1].slice(0, 8); // استخراج ID دقیق بازی از لینک لیچس
          const res = await fetch(`https://lichess.org/game/export/${gameId}`);
          if (!res.ok) throw new Error('بازی در سرورهای لیچس یافت نشد یا در دسترس نیست.');
          finalData = await res.text(); // دانلود PGN
          finalType = 'PGN';
        } else if (urlLower.includes('chess.com')) {
          throw new Error('برای بازی‌های Chess.com فعلاً باید متن PGN بازی را مستقیماً کپی کنید.');
        } else {
          throw new Error('لینک وارد شده نامعتبر است. لطفاً لینک یک بازی از Lichess.org وارد کنید.');
        }
      }

      // 🌟 فاز ۳: اعتبارسنجی قطعی متن، آرشیو و فایل با موتور
      const chess = new Chess();
      if (finalType !== 'PGN') {
        try {
          chess.load(finalData); // تست به عنوان FEN
          finalType = 'FEN';
        } catch (e) {
          try {
            chess.loadPgn(finalData); // تست به عنوان PGN
            finalType = 'PGN';
          } catch (pe) {
            throw new Error('فرمت متن وارد شده معتبر نیست. لطفاً یک FEN یا PGN استاندارد وارد کنید.');
          }
        }
      } else {
         try {
            chess.loadPgn(finalData); // تست نهایی PGN دانلود شده
         } catch(e) {
            throw new Error('دیتای دریافت شده مخدوش است و قابل پردازش نیست.');
         }
      }

      // در صورت موفقیت و اعتبارسنجی کامل
      setIsChecking(false);
      setIsInputModalOpen(false); setIsArchiveModalOpen(false); setIsUploadModalOpen(false); setIsLinkModalOpen(false);
      
      // 🌟 فاز ۲: ارسال پکیج استاندارد به آزمایشگاه
      navigate('/analysis/board', { state: { data: finalData, type: finalType, meta } });

    } catch (err: any) {
      setErrorMessage(err.message || 'خطایی در پردازش اطلاعات رخ داد.');
      setIsChecking(false);
      setIsErrorModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-20 overflow-x-hidden" dir="rtl">
      <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="w-10 h-10 rounded-xl bg-[#1e1c19] border border-[#35332e] flex items-center justify-center hover:border-zinc-500 transition-all text-zinc-400"><ArrowRight size={20} /></button>
          <div className="flex flex-col"><h1 className="font-black text-xl text-white flex items-center gap-2"><Activity size={20} className="text-sky-400" />منبع آنالیز</h1><span className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5 uppercase">Select Data Source</span></div>
        </div>
      </div>

      <div className="w-full max-w-2xl px-4 mt-2 flex flex-col gap-4">
        <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl flex items-start gap-3 shadow-inner mb-2"><Info size={20} className="text-sky-400 shrink-0 mt-0.5" /><p className="text-xs text-sky-100 leading-relaxed font-medium">برای شروع پردازش و تحلیل لایه‌های پنهان بازی، ابتدا مشخص کنید دیتای بازی را از چه طریقی وارد می‌کنید.</p></div>

        {/* 🔥 دکمه آنالیز جدید (شروع بازی) */}
        <SourceCard 
          title="آنالیز جدید" desc="شروع آنالیز از وضعیت ابتدایی تخته" 
          icon={Plus} color="text-farzin-accent" isHighlight={true}
          onClick={() => processAndNavigate('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')} 
        />

        <SourceCard title="انتخاب از آرشیو" desc="دسترسی سریع به بازی‌های ذخیره شده" icon={History} color="text-purple-400" onClick={() => setIsArchiveModalOpen(true)} />
        <SourceCard title="وارد کردن لینک بازی" desc="وارد کردن لینک از چس و لیچس" icon={LinkIcon} color="text-emerald-400" onClick={() => setIsLinkModalOpen(true)} />
        <SourceCard title="وارد کردن PGN / FEN" desc="پیست کردن مستقیم کدهای متنی" icon={FileText} color="text-amber-400" onClick={() => setIsInputModalOpen(true)} />
        <SourceCard title="آپلود فایل PGN" desc="بارگذاری فایل از سیستم" icon={UploadCloud} color="text-sky-400" onClick={() => setIsUploadModalOpen(true)} />
        <SourceCard 
           title="چیدمان دستی مهره‌ها" 
           desc="ساخت پوزیشن دلخواه روی بورد" 
           icon={LayoutGrid} 
           color="text-rose-400" 
           onClick={() => setIsEditorModalOpen(true)} 
        />
      </div>

      {/* مودال‌ها (بخش‌های فشرده شده برای عملکرد یکسان) */}
      {/* 🌟 مودال ویرایشگر حرفه‌ای */}
      <BoardEditorModal 
         isOpen={isEditorModalOpen} 
         onClose={() => setIsEditorModalOpen(false)} 
         onConfirm={(fen: string) => processAndNavigate(fen, null, 'FEN')} 
      />

      {/* سایر مودال‌ها (بدون تغییر منطقی) */}
      <AnimatePresence>{isLinkModalOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full sm:max-w-md bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe"><div className="p-6 border-b border-[#35332e] flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><LinkIcon size={20} /></div><h3 className="font-black text-lg text-white">لینک بازی</h3></div><button onClick={() => setIsLinkModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button></div><div className="p-6 flex flex-col gap-6"><input type="url" className="w-full bg-[#161512] border border-[#35332e] rounded-xl p-4 text-sm text-emerald-100 placeholder-zinc-600 outline-none transition-colors shadow-inner" placeholder="https://lichess.org/..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} dir="ltr" /><button onClick={() => processAndNavigate(linkInput, null, 'LINK')} disabled={!linkInput.trim() || isChecking} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!linkInput.trim() ? 'bg-[#262421] text-zinc-500' : 'bg-emerald-500 text-black shadow-[0_5px_20px_rgba(16,185,129,0.3)] active:scale-95'}`}>{isChecking ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Zap size={18} /> استخراج PGN</>}</button></div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{isUploadModalOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full sm:max-w-xl bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe max-h-[90vh]"><div className="p-5 border-b border-[#35332e] flex items-center justify-between shrink-0"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400"><UploadCloud size={20} /></div><h3 className="font-black text-lg text-white">آپلود PGN</h3></div><button onClick={() => setIsUploadModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button></div><div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6"><div onClick={() => fileInputRef.current?.click()} className={`w-full p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${uploadedFileName ? 'bg-sky-500/10 border-sky-500/50' : 'bg-[#161512] border-[#35332e]'}`}><input type="file" accept=".pgn,.txt" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />{uploadedFileName ? (<><FileText size={24} className="text-sky-400" /><span className="font-bold text-sky-400 text-sm" dir="ltr">{uploadedFileName}</span></>) : (<><UploadCloud size={24} className="text-zinc-500" /><p className="font-bold text-zinc-300 text-sm">انتخاب فایل PGN</p></>)}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="bg-[#161512] border border-[#35332e] p-4 rounded-2xl flex flex-col gap-3"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-zinc-400 rounded-sm"></div><span className="font-bold text-sm text-zinc-300">سفید</span></div><input type="text" placeholder="نام" value={gameMeta.whiteName} onChange={e => setGameMeta({...gameMeta, whiteName: e.target.value})} className="w-full bg-[#1e1c19] border border-[#35332e] rounded-lg py-2.5 px-3 text-sm text-white" /><div className="flex gap-2"><input type="number" placeholder="Elo" value={gameMeta.whiteElo} onChange={e => setGameMeta({...gameMeta, whiteElo: e.target.value})} className="w-1/2 bg-[#1e1c19] border border-[#35332e] rounded-lg py-2 px-3 text-sm text-white" /><CustomSelect value={gameMeta.whiteTitle} onChange={(v:any) => setGameMeta({...gameMeta, whiteTitle: v})} options={TITLES} /></div></div><div className="bg-[#161512] border border-[#35332e] p-4 rounded-2xl flex flex-col gap-3"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-black border border-zinc-700 rounded-sm"></div><span className="font-bold text-sm text-zinc-300">سیاه</span></div><input type="text" placeholder="نام" value={gameMeta.blackName} onChange={e => setGameMeta({...gameMeta, blackName: e.target.value})} className="w-full bg-[#1e1c19] border border-[#35332e] rounded-lg py-2.5 px-3 text-sm text-white" /><div className="flex gap-2"><input type="number" placeholder="Elo" value={gameMeta.blackElo} onChange={e => setGameMeta({...gameMeta, blackElo: e.target.value})} className="w-1/2 bg-[#1e1c19] border border-[#35332e] rounded-lg py-2 px-3 text-sm text-white" /><CustomSelect value={gameMeta.blackTitle} onChange={(v:any) => setGameMeta({...gameMeta, blackTitle: v})} options={TITLES} /></div></div></div></div><div className="p-5 border-t border-[#35332e] bg-[#1a1815] rounded-b-[32px] sm:rounded-b-[28px]"><button onClick={() => processAndNavigate(uploadedFileContent, gameMeta)} disabled={!uploadedFileContent || isChecking} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!uploadedFileContent ? 'bg-[#262421] text-zinc-500' : 'bg-sky-500 text-white shadow-[0_5px_20px_rgba(56,189,248,0.3)] active:scale-95'}`}>{isChecking ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Zap size={18} /> تایید و ورود به آزمایشگاه</>}</button></div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{isArchiveModalOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full sm:max-w-md bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe max-h-[85vh]"><div className="p-5 border-b border-[#35332e] flex items-center justify-between shrink-0"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><History size={20} /></div><h3 className="font-black text-lg text-white">آرشیو</h3></div><button onClick={() => setIsArchiveModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button></div><div className="p-4 border-b border-[#35332e] flex flex-col gap-3 shrink-0"><div className="relative"><div className="absolute inset-y-0 right-3 flex items-center text-zinc-500"><Search size={16} /></div><input type="text" placeholder="جستجو..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#161512] border border-[#35332e] rounded-xl py-2.5 pr-10 pl-4 text-sm text-white" /></div><div className="flex items-center gap-2 overflow-x-auto no-scrollbar">{['all','win','loss','draw'].map(f => (<button key={f} onClick={() => setFilterResult(f as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterResult === f ? 'bg-purple-500 text-white' : 'bg-[#262421] text-zinc-400 border border-[#35332e]'}`}>{f === 'all' ? 'همه' : f === 'win' ? 'برد' : f === 'loss' ? 'باخت' : 'مساوی'}</button>))}</div></div><div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3">{filteredArchive.length > 0 ? (filteredArchive.map((g) => (<div key={g.id} className="bg-[#161512] border border-[#35332e] p-4 rounded-2xl flex items-center justify-between hover:border-zinc-500 transition-colors"><div className="flex items-center gap-3"><div className={`w-1 h-8 rounded-full ${g.result === 'win' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div><div className="flex flex-col"><div className="flex items-center gap-1.5 text-sm font-bold text-white"><span>{g.white}</span><span className="text-zinc-600">vs</span><span>{g.black}</span></div><span className="text-[10px] text-zinc-500">{g.date}</span></div></div><button onClick={() => processAndNavigate(g.pgn)} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#262421] text-purple-400 hover:bg-purple-500 hover:text-white transition-all">انتخاب</button></div>))) : (<div className="py-10 text-center opacity-50"><History size={40} className="mx-auto mb-2" /><span className="text-sm">یافت نشد</span></div>)}</div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{isInputModalOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" dir="rtl"><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full sm:max-w-md bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-2xl flex flex-col pb-safe"><div className="p-6 border-b border-[#35332e] flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><FileText size={20} /></div><h3 className="font-black text-lg text-white">متن PGN یا FEN</h3></div><button onClick={() => setIsInputModalOpen(false)} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button></div><div className="p-6 flex flex-col gap-6"><textarea className="w-full h-48 bg-[#161512] border border-[#35332e] focus:border-amber-500 rounded-xl p-4 text-sm text-amber-100 placeholder-zinc-600 outline-none transition-colors shadow-inner font-mono leading-relaxed" placeholder="Paste here..." value={inputData} onChange={(e) => setInputData(e.target.value)} dir="ltr" spellCheck={false} /><button onClick={() => processAndNavigate(inputData)} disabled={!inputData.trim() || isChecking} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!inputData.trim() ? 'bg-[#262421] text-zinc-500' : 'bg-amber-500 text-black shadow-[0_5px_20px_rgba(245,158,11,0.3)] active:scale-95'}`}>{isChecking ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Zap size={18} /> ورود به آزمایشگاه</>}</button></div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>
        {isErrorModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" dir="rtl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-[#1e1c19] border border-rose-500/30 rounded-[28px] shadow-2xl flex flex-col items-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4"><AlertTriangle size={32} className="text-rose-500" /></div>
              <h3 className="font-black text-xl text-white mb-2">نامعتبر!</h3>
              {/* 🌟 متن استاتیک حذف و پیام داینامیک اضافه شد */}
              <p className="text-sm text-zinc-400 mb-8 px-4">{errorMessage}</p>
              <button onClick={() => setIsErrorModalOpen(false)} className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#262421] text-white border border-[#35332e] hover:border-zinc-500 transition-all active:scale-95">بستن</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}