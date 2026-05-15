import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Home as HomeIcon, Puzzle, BarChart2, User, 
  History, Settings, Globe, LineChart, 
  BookOpen, Crown, Bell, LogOut, 
  UploadCloud, X, Diamond, Sparkles, CheckCircle2, 
  Mail, MessageCircle, Cpu, Zap, Fingerprint, ScanLine, Trophy
} from 'lucide-react';

// 🌟 تنظیمات انیمیشن پله‌ای (Staggered)
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// 🔥 کارت‌های اکشن با طراحی شیشه‌ای و پریمیوم
interface ActionCardProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  badge?: 'VIP' | 'DIAMOND';
}

const ActionCard = ({ title, desc, icon: Icon, color, onClick, badge }: ActionCardProps) => (
  <motion.div 
    variants={itemVariants}
    onClick={onClick}
    className="flex flex-col gap-3 p-5 sm:p-6 rounded-[32px] bg-[#161512]/60 backdrop-blur-xl border border-white/5 hover:border-white/10 hover:bg-[#1a1916]/80 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 group relative overflow-hidden active:scale-[0.96]"
  >
    {/* افکت نوری هاور */}
    <div className="absolute -inset-20 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none"></div>
    
    {badge === 'VIP' && (
      <div className="absolute top-4 left-4 px-2 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black tracking-[0.2em] uppercase rounded-lg border border-amber-500/20 flex items-center gap-1 shadow-sm backdrop-blur-md">
        <Crown size={10} /> VIP
      </div>
    )}
    {badge === 'DIAMOND' && (
      <div className="absolute top-4 left-4 px-2 py-1 bg-sky-500/10 text-sky-400 text-[9px] font-black tracking-[0.2em] uppercase rounded-lg border border-sky-500/20 flex items-center gap-1 shadow-sm backdrop-blur-md">
        <Diamond size={10} fill="currentColor" /> Pro
      </div>
    )}
    
    <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a]/50 flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10">
      <Icon size={26} className={color} style={{ filter: `drop-shadow(0 0 10px currentColor)` }} />
    </div>
    
    <div className="flex flex-col mt-2 relative z-10">
      <span className="font-black text-lg text-white tracking-tight">{title}</span>
      <span className="text-[11px] text-zinc-500 mt-1 font-medium">{desc}</span>
    </div>
  </motion.div>
);

export default function Home() {
  const { t } = useTranslation();
  const { logout, userTier = 'DIAMOND' } = useAuthStore(); 
  const navigate = useNavigate();

  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneStatus, setCloneStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  
  const [lichessId, setLichessId] = useState('');
  const [chesscomId, setChesscomId] = useState('');
  const [hasUploadedZip, setHasUploadedZip] = useState(false);
  
  const [contactEmail, setContactEmail] = useState('');
  const [contactSocial, setContactSocial] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  
  const [diamondQuota, setDiamondQuota] = useState(() => {
    const saved = localStorage.getItem('farzin_diamond_quota');
    return saved !== null ? parseInt(saved) : 1;
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTimeFormat = (format: string) => {
    if (format === 'all') {
      setSelectedTimes(['bullet', 'blitz', 'rapid', 'classic']);
      return;
    }
    if (selectedTimes.includes(format)) {
      setSelectedTimes(selectedTimes.filter(t => t !== format));
    } else {
      setSelectedTimes([...selectedTimes, format]);
    }
  };

  const hasSource = lichessId.trim() !== '' || chesscomId.trim() !== '' || hasUploadedZip;
  const hasTimeFormat = selectedTimes.length > 0;
  const hasContactInfo = contactEmail.trim() !== '' || contactSocial.trim() !== '';
  const isFormValid = hasSource && hasTimeFormat && hasContactInfo;

  const handleSubmitCloneRequest = () => {
    if (!isFormValid) return;
    setCloneStatus('processing');

    setTimeout(() => {
      if (userTier === 'DIAMOND' && diamondQuota > 0) {
        setDiamondQuota(0);
        localStorage.setItem('farzin_diamond_quota', '0');
      }
      
      setCloneStatus('success');
      setTimeout(() => {
        setIsCloneModalOpen(false);
        setCloneStatus('idle');
        setLichessId(''); setChesscomId(''); setHasUploadedZip(false);
        setContactEmail(''); setContactSocial(''); setSelectedTimes([]);
      }, 3500);
    }, 2500);
  };

  return (
    <>
      <div className="min-h-[100dvh] bg-[#050505] text-zinc-200 flex flex-col items-center pb-32 overflow-x-hidden relative font-sans" dir="rtl">
        
        {/* 🌟 پس‌زمینه نوری پریمیوم */}
        <div className="fixed top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-farzin-accent/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[10%] left-[-20%] w-[60vw] h-[60vw] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* هدر */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full max-w-3xl px-6 py-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="w-14 h-14 rounded-[20px] overflow-hidden border border-white/10 bg-[#161512]/80 backdrop-blur-md shadow-lg flex items-center justify-center font-black text-2xl text-white group-hover:scale-105 transition-transform">
                A
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#050505] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-400 text-xs font-bold tracking-wide">{t('home.greeting')}</span>
              <div className="flex items-center gap-1.5 font-mono mt-1">
                {userTier === 'DIAMOND' ? <Diamond size={14} className="text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" fill="currentColor" /> : <Trophy size={14} className="fill-amber-500/20 text-amber-500" />}
                <span className={`font-black text-sm tracking-[0.2em] uppercase ${userTier === 'DIAMOND' ? 'text-sky-400' : 'text-amber-500'}`}>{userTier}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button className="p-3 bg-[#161512]/80 backdrop-blur-md border border-white/5 rounded-2xl hover:bg-white/10 hover:text-white transition-all text-zinc-400 shadow-lg active:scale-95"><Bell size={20} /></button>
            <button onClick={() => navigate('/settings')} className="p-3 bg-[#161512]/80 backdrop-blur-md border border-white/5 rounded-2xl hover:bg-white/10 hover:text-white transition-all text-zinc-400 shadow-lg active:scale-95"><Settings size={20} /></button>
          </div>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-3xl px-6 flex flex-col gap-6 relative z-10">
            
            {/* 🌟 کارت اصلی (بازی با هوش مصنوعی) */}
            <motion.div variants={itemVariants} onClick={() => navigate('/select-bot')} className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-farzin-accent to-[#5c7a40] rounded-[36px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="flex items-center justify-between p-8 rounded-[36px] bg-[#11100e]/80 backdrop-blur-2xl relative overflow-hidden border border-white/10 group-hover:border-farzin-accent/50 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                    {/* پترن گرافیکی بک‌گراند */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at right, rgba(119,149,86,0.4) 0%, transparent 100%), repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 25% 50%)`, backgroundSize: '100% 100%, 24px 24px' }}></div>
                    
                    <div className="flex flex-col z-10 relative">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="w-2 h-2 rounded-full bg-farzin-accent animate-pulse"></span>
                           <span className="text-farzin-accent text-[11px] font-black uppercase tracking-[0.3em]">موتور اختصاصی</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md">{t('home.play_ai')}</h2>
                        <p className="text-zinc-400 text-xs sm:text-sm font-medium max-w-[220px] sm:max-w-[280px] leading-relaxed">{t('home.play_ai_desc')}</p>
                    </div>
                    <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] bg-gradient-to-br from-farzin-accent to-[#4a6b2e] flex items-center justify-center shadow-[0_10px_30px_rgba(119,149,86,0.5)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                        <Play fill="currentColor" size={36} className="text-white ml-2 drop-shadow-lg" />
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-2">
                {/* 🔴 اتصال دکمه بازی آنلاین به لابی لیچس */}
                <ActionCard title={t('home.play_online')} desc={t('home.play_online_desc')} icon={Globe} color="text-blue-400" onClick={() => navigate('/play/online/lobby')} />
                
                <ActionCard title={t('home.analysis')} desc={t('home.analysis_desc')} icon={LineChart} color="text-rose-400" badge="VIP" onClick={() => navigate('/analysis')} />
                <ActionCard title={t('home.latest_game')} desc={t('home.latest_game_desc')} icon={History} color="text-purple-400" onClick={() => navigate('/archive')} />
                <ActionCard title={t('home.puzzles')} desc={t('home.puzzles_desc')} icon={Puzzle} color="text-amber-400" badge="VIP" onClick={() => navigate('/puzzles')} />
                
                <ActionCard title="شبیه‌سازی حریف" desc="کلون پروفایل با AI" icon={Fingerprint} color="text-sky-400" badge="DIAMOND" onClick={() => setIsCloneModalOpen(true)} />
                <ActionCard title="آکادمی آموزش" desc="ویدیوها و دوره‌ها" icon={BookOpen} color="text-indigo-400" badge="VIP" onClick={() => navigate('/education')} />
            </div>

            <motion.div variants={itemVariants} className="mt-8 flex justify-center">
                <button onClick={handleLogout} className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all active:scale-95 shadow-lg"><LogOut size={18} /> <span className="font-black text-sm tracking-wide">{t('home.logout')}</span></button>
            </motion.div>
        </motion.div>

        {/* 🌟 داک شناور پایین (Floating Bottom Nav) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-full max-w-md bg-[#161512]/90 backdrop-blur-2xl border border-white/10 rounded-full z-40 flex justify-between items-center px-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <button className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white/5 border border-white/5 relative group">
                <HomeIcon size={22} className="text-farzin-accent group-hover:-translate-y-1 transition-transform" />
                <div className="absolute bottom-2 w-1 h-1 rounded-full bg-farzin-accent shadow-[0_0_8px_rgba(119,149,86,0.8)] opacity-100"></div>
            </button>
            <button onClick={() => navigate('/select-bot')} className="flex flex-col items-center justify-center w-14 h-14 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all group">
                <Play size={22} className="group-hover:-translate-y-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/puzzles')} className="flex flex-col items-center justify-center w-14 h-14 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all group">
                <Puzzle size={22} className="group-hover:-translate-y-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/analysis')} className="flex flex-col items-center justify-center w-14 h-14 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all group">
                <BarChart2 size={22} className="group-hover:-translate-y-1 transition-transform" />
            </button>
            <button className="flex flex-col items-center justify-center w-14 h-14 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all group">
                <User size={22} className="group-hover:-translate-y-1 transition-transform" />
            </button>
        </div>
      </div>

      {/* 🌟 پاپ‌آپ شبیه‌سازی (بدون تغییر لاجیک، با ارتقای ظاهری برای هماهنگی با قالب جدید) */}
      <AnimatePresence>
        {isCloneModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md sm:px-4" 
            dir="rtl" 
            onClick={() => cloneStatus === 'idle' && setIsCloneModalOpen(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} 
              onClick={(e) => e.stopPropagation()} 
              className="w-full sm:max-w-md bg-[#161512] sm:border border-[#35332e] rounded-t-[40px] sm:rounded-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.8)] flex flex-col pb-safe max-h-[95vh] overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent z-50"></div>
              
              <div className="relative overflow-hidden bg-[#0a192f]/50 border-b border-white/5 rounded-t-[40px]">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/20 rounded-full blur-[40px]"></div>
                
                <button onClick={() => setIsCloneModalOpen(false)} disabled={cloneStatus === 'processing'} className="absolute top-6 right-6 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors z-20">
                  <X size={20} />
                </button>

                <div className="p-8 pb-6 flex items-center gap-5 relative z-10">
                  <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-[#0a192f] border border-sky-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                          <Cpu size={32} className="text-sky-400" />
                      </div>
                  </div>
                  <div className="flex flex-col">
                      <h3 className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-l from-white to-sky-200 tracking-tight">شبیه‌سازی ذهن</h3>
                      <span className="text-[10px] text-sky-400 font-black tracking-[0.2em] uppercase mt-1">Neural Cloning</span>
                  </div>
                </div>
              </div>

              {cloneStatus === 'processing' ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 gap-8 min-h-[450px]">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-32 h-32 border-4 border-sky-500/10 border-t-sky-400 rounded-full animate-spin"></div>
                        <div className="absolute w-24 h-24 border-4 border-amber-500/10 border-b-amber-400 rounded-full animate-[spin_2s_linear_reverse]"></div>
                        <ScanLine size={40} className="text-sky-400 animate-pulse drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]" />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h3 className="font-black text-white text-xl animate-pulse tracking-tight">در حال استخراج الگوها...</h3>
                        <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Analyzing Neural Data</p>
                    </div>
                </motion.div>
              ) : cloneStatus === 'success' ? (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-12 gap-6 min-h-[450px] text-center">
                    <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 size={48} className="text-emerald-400" />
                    </div>
                    <h3 className="font-black text-white text-2xl mt-2 tracking-tight">دیتا با موفقیت دریافت شد</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        موتور هوش مصنوعی فرزین در حال ساخت پروفایل عصبی این بازیکن است. نتیجه از طریق <b>ایمیل یا شبکه‌های اجتماعی</b> برای شما ارسال خواهد شد.
                    </p>
                </motion.div>
              ) : (
                <div className="p-6 sm:p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                    
                    <div className="bg-sky-500/5 border border-sky-500/20 p-5 rounded-2xl flex items-start gap-4 shadow-inner">
                        <Sparkles size={24} className="text-sky-400 shrink-0 mt-0.5 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                        <p className="text-xs text-sky-100/80 leading-relaxed font-bold">
                            ما دیتای بازی‌های این شخص را آنالیز کرده و یک ربات اختصاصی با <b className="text-white">دقیقاً همان سبک بازی، نقاط ضعف و قوت</b> برای شما می‌سازیم.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-sm text-white flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xs text-sky-400 shadow-inner">1</div>
                            شناسه بازیکن <span className="text-[10px] font-bold text-zinc-500 tracking-widest">(حداقل یکی پر شود)</span>
                        </h4>
                        
                        <div className="flex flex-col gap-3">
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-4 flex items-center"><img src="https://lichess1.org/assets/images/logo/lichess-favicon-256.png" className="w-5 h-5 opacity-40 group-focus-within:opacity-100 transition-opacity" alt="Lichess" /></div>
                                <input type="text" dir="ltr" placeholder="Lichess Username" value={lichessId} onChange={e => setLichessId(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pr-12 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-all shadow-inner" />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-4 flex items-center"><img src="https://lichess1.org/assets/images/logo/chess-com.favicon.png" className="w-5 h-5 opacity-40 rounded-sm group-focus-within:opacity-100 transition-opacity" alt="Chess.com" /></div>
                                <input type="text" dir="ltr" placeholder="Chess.com Username" value={chesscomId} onChange={e => setChesscomId(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pr-12 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-all shadow-inner" />
                            </div>
                            <div onClick={() => setHasUploadedZip(!hasUploadedZip)} className={`w-full py-5 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 cursor-pointer transition-all ${hasUploadedZip ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'bg-[#0a0a0a] border-white/10 hover:border-zinc-500'}`}>
                                {hasUploadedZip ? <><CheckCircle2 size={24} className="text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" /><span className="text-xs font-black text-sky-400">فایل PGN آپلود شد</span></> : <><UploadCloud size={24} className="text-zinc-500" /><span className="text-xs font-bold text-zinc-400">آپلود فایل بازی‌ها (ZIP/PGN)</span></>}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-sm text-white flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xs text-sky-400 shadow-inner">2</div>
                            استخراج سبک در <span className="text-rose-500 font-bold">*</span>
                        </h4>
                        
                        <div className="flex flex-wrap gap-2">
                            {['bullet', 'blitz', 'rapid', 'classic'].map(t => {
                                const isSelected = selectedTimes.includes(t);
                                return (
                                    <button key={t} onClick={() => toggleTimeFormat(t)} className={`px-5 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${isSelected ? 'bg-sky-500 text-white shadow-[0_5px_15px_rgba(56,189,248,0.4)] border-transparent' : 'bg-[#0a0a0a] text-zinc-400 border border-white/5 hover:border-zinc-500'}`}>{t.toUpperCase()}</button>
                                );
                            })}
                            <button onClick={() => toggleTimeFormat('all')} className="px-5 py-3 rounded-xl text-xs font-black bg-[#0a0a0a] text-sky-400 border border-sky-500/30 hover:bg-sky-500/10 transition-colors">همه موارد</button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-sm text-white flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xs text-sky-400 shadow-inner">3</div>
                            اطلاعات تماس <span className="text-rose-500 font-bold">*</span>
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-4 flex items-center text-zinc-500 group-focus-within:text-sky-400 transition-colors"><Mail size={18} /></div>
                                <input type="email" dir="ltr" placeholder="Email Address" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pr-12 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-all shadow-inner" />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-4 flex items-center text-zinc-500 group-focus-within:text-sky-400 transition-colors"><MessageCircle size={18} /></div>
                                <input type="text" dir="ltr" placeholder="Telegram / WhatsApp ID" value={contactSocial} onChange={e => setContactSocial(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/5 focus:border-sky-500/50 rounded-2xl py-4 pr-12 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-all shadow-inner" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/5 pt-8 mt-2">
                        {userTier === 'DIAMOND' ? (
                            <>
                                <div className="flex items-center justify-between mb-2 bg-[#0a0a0a]/50 p-4 rounded-2xl border border-white/5">
                                    <span className="text-xs text-zinc-400 font-bold flex items-center gap-2"><Fingerprint size={16} className="text-sky-400"/> سهمیه استخراج:</span>
                                    <span className={`font-black text-xs px-3 py-1.5 rounded-lg border shadow-inner ${diamondQuota > 0 ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{diamondQuota} از ۱ (هفتگی)</span>
                                </div>
                                <button onClick={handleSubmitCloneRequest} disabled={!isFormValid || cloneStatus === 'processing'} className={`w-full py-5 rounded-2xl font-black text-sm transition-all flex justify-center items-center gap-2 ${!isFormValid ? 'bg-white/5 text-zinc-500 cursor-not-allowed' : 'bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-[0_10px_30px_rgba(56,189,248,0.4)] hover:shadow-[0_10px_40px_rgba(56,189,248,0.6)] active:scale-95'}`}>
                                    {diamondQuota > 0 ? <><Zap size={18} fill="currentColor"/> استخراج و شبیه‌سازی (رایگان)</> : 'پرداخت هزینه و استخراج'}
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <button onClick={handleSubmitCloneRequest} disabled={!isFormValid || cloneStatus === 'processing'} className={`w-full py-5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!isFormValid ? 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5' : 'bg-[#1a1916] text-white border border-white/10 hover:bg-[#262421] shadow-lg active:scale-95'}`}>
                                    خرید تکی پروفایل (۹۹,۰۰۰ ت)
                                </button>
                                <button className="w-full py-5 rounded-2xl font-black text-sm bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-[0_10px_30px_rgba(56,189,248,0.4)] hover:shadow-[0_10px_40px_rgba(56,189,248,0.6)] active:scale-95 flex items-center justify-center gap-2">
                                    <Diamond size={18} fill="currentColor" /> 
                                    ارتقا به Diamond (۱ رایگان در هفته)
                                </button>
                            </div>
                        )}
                    </div>

                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}