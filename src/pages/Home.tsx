import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Home as HomeIcon, Puzzle, BarChart2, User, 
  Trophy, History, Settings, Globe, LineChart, 
  BookOpen, Crown, Bell, LogOut, 
  UploadCloud, X, Diamond, Sparkles, CheckCircle2, 
  Mail, MessageCircle, Cpu, Zap, Fingerprint, ScanLine
} from 'lucide-react';

// 🔥 بهینه‌سازی مهم: تعریف کارت بیرون از کامپوننت اصلی برای جلوگیری از رندرهای اضافی
interface ActionCardProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  badge?: 'VIP' | 'DIAMOND';
}

const ActionCard = ({ title, desc, icon: Icon, color, onClick, badge }: ActionCardProps) => (
  <div 
    onClick={onClick}
    className="flex flex-col gap-3 p-5 rounded-[22px] bg-[#1e1c19] border border-[#35332e] hover:border-[#52525b] hover:bg-[#262421] cursor-pointer shadow-lg transition-all duration-300 group relative overflow-hidden active:scale-[0.98]"
  >
    {badge === 'VIP' && (
      <div className="absolute top-4 left-4 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-black tracking-widest uppercase rounded-lg border border-amber-500/30 flex items-center gap-1 shadow-sm">
        <Crown size={10} /> VIP
      </div>
    )}
    {badge === 'DIAMOND' && (
      <div className="absolute top-4 left-4 px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[9px] font-black tracking-widest uppercase rounded-lg border border-sky-500/30 flex items-center gap-1 shadow-sm">
        <Diamond size={10} fill="currentColor" /> Pro
      </div>
    )}
    <div className="w-12 h-12 rounded-2xl bg-[#161512] flex items-center justify-center border border-[#35332e] shadow-inner group-hover:scale-105 transition-transform duration-300">
      <Icon size={22} className={color} />
    </div>
    <div className="flex flex-col mt-1">
      <span className="font-bold text-lg text-white">{title}</span>
      <span className="text-xs text-zinc-500 mt-1 pr-1">{desc}</span>
    </div>
  </div>
);

export default function Home() {
  const { t } = useTranslation();
  const { logout, userTier = 'DIAMOND' } = useAuthStore(); 
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // استیت‌های مودال کلون پروفایل
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneStatus, setCloneStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  
  // دیتای ورودی
  const [lichessId, setLichessId] = useState('');
  const [chesscomId, setChesscomId] = useState('');
  const [hasUploadedZip, setHasUploadedZip] = useState(false);
  
  // اطلاعات تماس
  const [contactEmail, setContactEmail] = useState('');
  const [contactSocial, setContactSocial] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  
  // سهمیه دایموند
  const [diamondQuota, setDiamondQuota] = useState(() => {
    const saved = localStorage.getItem('farzin_diamond_quota');
    return saved !== null ? parseInt(saved) : 1;
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
      <div className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-28 overflow-x-hidden" dir="rtl">
        {/* هدر */}
        <div className={`w-full max-w-2xl px-5 py-6 flex items-center justify-between transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#35332e] bg-[#1e1c19] p-0.5 shadow-md flex items-center justify-center font-bold text-xl text-blue-400">A</div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#161512]"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-400 text-xs">{t('home.greeting')}</span>
              <div className="flex items-center gap-1.5 font-mono mt-0.5">
                {userTier === 'DIAMOND' ? <Diamond size={12} className="text-sky-400" fill="currentColor" /> : <Trophy size={12} className="fill-amber-500/20 text-amber-500" />}
                <span className={`font-bold text-sm tracking-widest ${userTier === 'DIAMOND' ? 'text-sky-400' : 'text-amber-500'}`}>{userTier}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] transition-colors"><Bell size={18} className="text-zinc-400" /></button>
            <button onClick={() => navigate('/settings')} className="p-2.5 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] transition-colors"><Settings size={18} className="text-zinc-400" /></button>
          </div>
        </div>

        <div className="w-full max-w-2xl px-4 flex flex-col gap-6">
            
            <div onClick={() => navigate('/select-bot')} className="relative group cursor-pointer p-[1px]">
                <div className="flex items-center justify-between p-6 rounded-[24px] bg-[#1e1c19] relative overflow-hidden border border-[#35332e] group-hover:border-[#52525b]" style={{ backgroundImage: `radial-gradient(circle at right, rgba(119,149,86,0.08) 0%, #1a1916 100%), repeating-conic-gradient(rgba(38, 36, 33, 0.5) 0% 25%, transparent 25% 50%)`, backgroundSize: '100% 100%, 24px 24px' }}>
                    <div className="flex flex-col z-10">
                        <span className="text-farzin-accent text-[10px] font-black uppercase tracking-widest mb-1">موتور اختصاصی</span>
                        <h2 className="text-3xl font-black text-white mb-2">{t('home.play_ai')}</h2>
                        <p className="text-zinc-400 text-xs max-w-[200px]">{t('home.play_ai_desc')}</p>
                    </div>
                    <div className="relative z-10 w-16 h-16 rounded-[20px] bg-farzin-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play fill="currentColor" size={28} className="text-white ml-1" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ActionCard title={t('home.play_online')} desc={t('home.play_online_desc')} icon={Globe} color="text-blue-400" />
                <ActionCard title={t('home.latest_game')} desc={t('home.latest_game_desc')} icon={History} color="text-purple-400" onClick={() => navigate('/archive')} />
                <ActionCard title={t('home.puzzles')} desc={t('home.puzzles_desc')} icon={Puzzle} color="text-amber-500" badge="VIP" onClick={() => navigate('/puzzles')} />
                {/* دکمه صفحه آنالیز */}
                <ActionCard 
                    title={t('home.analysis')} 
                    desc={t('home.analysis_desc')} 
                    icon={LineChart} 
                    color="text-rose-400" 
                    badge="VIP" 
                    onClick={() => navigate('/analysis')} 
                  />
                {/* دکمه کلون پروفایل */}
                <ActionCard title="شبیه‌سازی حریف" desc="کلون پروفایل با AI" icon={Fingerprint} color="text-sky-400" badge="DIAMOND" onClick={() => setIsCloneModalOpen(true)} />
                
                <ActionCard title="آکادمی آموزش" desc="ویدیوها و دوره‌ها" icon={BookOpen} color="text-indigo-400" badge="VIP" onClick={() => navigate('/education')} />
            </div>

            <div className="mt-4 mb-8 flex justify-center">
                <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"><LogOut size={16} /> <span className="font-bold text-sm">{t('home.logout')}</span></button>
            </div>
        </div>

        {/* منوی پایین ثابت */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#161512] border-t border-[#35332e] z-40 flex justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-safe">
            <div className="w-full max-w-2xl px-2 py-3 flex items-center justify-between">
                <button className="flex flex-col items-center gap-1.5 flex-1 group"><div className="relative"><HomeIcon size={24} className="text-farzin-accent group-hover:scale-110" /><div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-farzin-accent shadow-[0_0_8px_rgba(119,149,86,0.8)]"></div></div><span className="text-[11px] font-bold text-farzin-accent mt-1">خانه</span></button>
                <button onClick={() => navigate('/select-bot')} className="flex flex-col items-center gap-1.5 flex-1 group opacity-40 hover:opacity-100"><Play size={24} className="text-zinc-300" /><span className="text-[11px] font-bold text-zinc-300 mt-1">بازی</span></button>
                <button onClick={() => navigate('/puzzles')} className="flex flex-col items-center gap-1.5 flex-1 group opacity-40 hover:opacity-100"><Puzzle size={24} className="text-zinc-300" /><span className="text-[11px] font-bold text-zinc-300 mt-1">پازل</span></button>
                <button onClick={() => navigate('/analysis')} className="flex flex-col items-center gap-1.5 flex-1 group opacity-40 hover:opacity-100">
                  <BarChart2 size={24} className="text-zinc-300" />
                  <span className="text-[11px] font-bold text-zinc-300 mt-1">تحلیل</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 flex-1 group opacity-40 hover:opacity-100"><User size={24} className="text-zinc-300" /><span className="text-[11px] font-bold text-zinc-300 mt-1">پروفایل</span></button>
            </div>
        </div>
      </div>

      {/* پاپ‌آپ (Modal) فوق‌حرفه‌ای و پول‌ساز کلون پروفایل */}
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
              className="w-full sm:max-w-md bg-[#1e1c19] sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col pb-safe max-h-[95vh]"
            >
              
              {/* هدر سایبرپانکی و لوکس */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1e35] to-[#1e1c19] border-b border-sky-500/20 rounded-t-[32px] sm:rounded-t-[28px]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/20 rounded-full blur-[40px]"></div>
                
                <button onClick={() => setIsCloneModalOpen(false)} disabled={cloneStatus === 'processing'} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors z-20">
                  <X size={18} />
                </button>

                <div className="p-6 pt-8 pb-6 flex items-center gap-4 relative z-10">
                  <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-[#0a192f] border border-sky-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:scale-110 transition-transform">
                          <Cpu size={28} className="text-sky-400" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                      </span>
                  </div>
                  <div className="flex flex-col">
                      <h3 className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-l from-white to-sky-200">شبیه‌سازی ذهن حریف</h3>
                      <span className="text-[10px] text-sky-400 font-bold tracking-widest uppercase mt-0.5">Neural Profile Cloning</span>
                  </div>
                </div>
              </div>

              {cloneStatus === 'processing' ? (
                // انیمیشن پردازش عصبی
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 gap-6 min-h-[400px]">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-24 h-24 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                        <div className="absolute w-16 h-16 border-4 border-amber-500/20 border-b-amber-500 rounded-full animate-[spin_2s_linear_reverse]"></div>
                        <ScanLine size={32} className="text-sky-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <h3 className="font-black text-white text-lg animate-pulse">در حال استخراج الگوها...</h3>
                        <p className="text-xs text-zinc-500 font-mono">Analyzing Games & Tactics</p>
                    </div>
                </motion.div>
              ) : cloneStatus === 'success' ? (
                // صفحه موفقیت
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-10 gap-4 min-h-[400px]">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 size={40} className="text-emerald-400" />
                    </div>
                    <h3 className="font-black text-white text-xl mt-2">دیتا با موفقیت دریافت شد!</h3>
                    <p className="text-sm text-zinc-400 text-center leading-relaxed px-4">
                        موتور هوش مصنوعی فرزین در حال ساخت پروفایل عصبی این بازیکن است. نتیجه از طریق <b>ایمیل یا شبکه‌های اجتماعی</b> برای شما ارسال خواهد شد.
                    </p>
                </motion.div>
              ) : (
                // فرم دریافت اطلاعات
                <div className="p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                    
                    <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl flex items-start gap-3 shadow-inner">
                        <Sparkles size={20} className="text-sky-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-sky-100 leading-relaxed font-medium">
                            ما دیتای بازی‌های این شخص را آنالیز کرده و یک ربات اختصاصی با <b>دقیقاً همان سبک بازی، نقاط ضعف و قوت</b> برای شما می‌سازیم.
                        </p>
                    </div>

                    {/* مرحله ۱ */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-[13px] text-zinc-200 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#262421] border border-[#403e3a] flex items-center justify-center text-[10px] text-sky-400">1</div>
                            شناسه بازیکن <span className="text-[10px] font-normal text-zinc-500">(حداقل یکی پر شود)</span>
                        </h4>
                        
                        <div className="flex flex-col gap-3">
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-3 flex items-center"><img src="https://lichess1.org/assets/images/logo/lichess-favicon-256.png" className="w-5 h-5 opacity-50 group-focus-within:opacity-100 transition-opacity" alt="Lichess" /></div>
                                <input type="text" dir="ltr" placeholder="Lichess Username" value={lichessId} onChange={e => setLichessId(e.target.value)} className="w-full bg-[#161512] border border-[#35332e] focus:border-sky-500 rounded-xl py-3.5 pr-10 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors shadow-inner" />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-3 flex items-center"><img src="https://lichess1.org/assets/images/logo/chess-com.favicon.png" className="w-5 h-5 opacity-50 rounded-sm group-focus-within:opacity-100 transition-opacity" alt="Chess.com" /></div>
                                <input type="text" dir="ltr" placeholder="Chess.com Username" value={chesscomId} onChange={e => setChesscomId(e.target.value)} className="w-full bg-[#161512] border border-[#35332e] focus:border-sky-500 rounded-xl py-3.5 pr-10 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors shadow-inner" />
                            </div>
                            <div onClick={() => setHasUploadedZip(!hasUploadedZip)} className={`w-full py-5 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 cursor-pointer transition-all ${hasUploadedZip ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'bg-[#161512] border-[#35332e] hover:border-zinc-500'}`}>
                                {hasUploadedZip ? <><CheckCircle2 size={24} className="text-sky-400" /><span className="text-xs font-bold text-sky-400">فایل PGN آپلود شد</span></> : <><UploadCloud size={24} className="text-zinc-500" /><span className="text-xs font-bold text-zinc-400">یا فایل بازی‌ها (ZIP/PGN) را آپلود کنید</span></>}
                            </div>
                        </div>
                    </div>

                    {/* مرحله ۲ */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-[13px] text-zinc-200 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#262421] border border-[#403e3a] flex items-center justify-center text-[10px] text-sky-400">2</div>
                            استخراج سبک در <span className="text-rose-500">*</span>
                        </h4>
                        
                        <div className="flex flex-wrap gap-2">
                            {['bullet', 'blitz', 'rapid', 'classic'].map(t => {
                                const isSelected = selectedTimes.includes(t);
                                return (
                                    <button key={t} onClick={() => toggleTimeFormat(t)} className={`px-4 py-2.5 rounded-xl text-[11px] font-black transition-all ${isSelected ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.3)] border-transparent' : 'bg-[#161512] text-zinc-500 border border-[#35332e] hover:border-zinc-500'}`}>{t.toUpperCase()}</button>
                                );
                            })}
                            <button onClick={() => toggleTimeFormat('all')} className="px-4 py-2.5 rounded-xl text-[11px] font-black bg-[#161512] text-sky-400 border border-sky-500/30 hover:bg-sky-500/10 transition-colors">همه موارد</button>
                        </div>
                    </div>

                    {/* مرحله ۳ */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-[13px] text-zinc-200 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#262421] border border-[#403e3a] flex items-center justify-center text-[10px] text-sky-400">3</div>
                            کجا براتون ارسالش کنیم؟ <span className="text-rose-500">*</span>
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-3 flex items-center text-zinc-500 group-focus-within:text-sky-400 transition-colors"><Mail size={16} /></div>
                                <input type="email" dir="ltr" placeholder="Email Address" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-[#161512] border border-[#35332e] focus:border-sky-500 rounded-xl py-3.5 pr-10 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors shadow-inner" />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-3 flex items-center text-zinc-500 group-focus-within:text-sky-400 transition-colors"><MessageCircle size={16} /></div>
                                <input type="text" dir="ltr" placeholder="Telegram / WhatsApp ID" value={contactSocial} onChange={e => setContactSocial(e.target.value)} className="w-full bg-[#161512] border border-[#35332e] focus:border-sky-500 rounded-xl py-3.5 pr-10 pl-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors shadow-inner" />
                            </div>
                        </div>
                    </div>

                    {/* بخش پرداخت جادویی */}
                    <div className="flex flex-col gap-3 border-t border-[#35332e] pt-6 pb-2">
                        {userTier === 'DIAMOND' ? (
                            <>
                                <div className="flex items-center justify-between px-1 mb-2 bg-[#161512] p-3 rounded-xl border border-[#35332e]">
                                    <span className="text-xs text-zinc-400 font-bold flex items-center gap-2"><Fingerprint size={14} className="text-sky-400"/> سهمیه استخراج:</span>
                                    <span className={`font-black text-xs px-2 py-1 rounded bg-[#262421] ${diamondQuota > 0 ? 'text-sky-400' : 'text-red-400'}`}>{diamondQuota} از ۱ (هفتگی)</span>
                                </div>
                                <button onClick={handleSubmitCloneRequest} disabled={!isFormValid || cloneStatus === 'processing'} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex justify-center items-center gap-2 ${!isFormValid ? 'bg-[#35332e] text-zinc-500' : 'bg-sky-500 text-white shadow-[0_5px_20px_rgba(56,189,248,0.4)] active:scale-95'}`}>
                                    {diamondQuota > 0 ? <><Zap size={16} fill="currentColor"/> استخراج و شبیه‌سازی (رایگان)</> : 'پرداخت هزینه و استخراج'}
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <button onClick={handleSubmitCloneRequest} disabled={!isFormValid || cloneStatus === 'processing'} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!isFormValid ? 'bg-[#262421] text-zinc-500 border border-[#35332e]' : 'bg-[#262421] text-white border border-zinc-500 hover:bg-[#35332e] active:scale-95'}`}>
                                    خرید تکی این پروفایل (۹۹,۰۰۰ ت)
                                </button>
                                <button className="w-full py-4 rounded-xl font-black text-sm bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_5px_20px_rgba(56,189,248,0.4)] active:scale-95 flex items-center justify-center gap-2">
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