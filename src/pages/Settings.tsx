import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Volume2, MousePointer2, Palette, Cpu, Globe, 
  Activity, BrainCircuit, Link2, RefreshCw, ShieldCheck,
  Send, MessageCircle, ExternalLink, MessageSquare, X, CheckCircle2, Crown
} from 'lucide-react';

const defaultSettings = {
  soundEnabled: true,
  premove: true,
  confirmMove: false,
  boardTheme: 'green',
  pieceTheme: 'neo', // تغییر پیش‌فرض به نئو که گرافیک جذابی دارد
  evalBar: true,
  showMoveQualities: true,
  engineThreads: 2,
  engineHash: 32,
  language: 'fa',
  lichessConnected: false,
  chessDotComConnected: false
};

// لیست تم‌های تخته (بافت‌دار و ساده)
const boardThemes = [
  { id: 'green', name: 'سبز فرزین', light: '#ebecd0', dark: '#779556' },
  { id: 'wood', name: 'چوب کالیفرنیا', light: '#f0d9b5', dark: '#b58863', texture: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=200&auto=format&fit=crop' },
  { id: 'walnut', name: 'گردویی تیره', light: '#d0af88', dark: '#6e472a', texture: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=200&auto=format&fit=crop' },
  { id: 'marble', name: 'مرمر ایتالیایی', light: '#e8ecef', dark: '#8f9ea8', texture: 'https://images.unsplash.com/photo-1518712398506-64c9d9ff0e65?q=80&w=200&auto=format&fit=crop' },
  { id: 'granite', name: 'سنگ گرانیت', light: '#c4c8cc', dark: '#50565a', texture: 'https://images.unsplash.com/photo-1508215885820-4585e5610d28?q=80&w=200&auto=format&fit=crop' },
  { id: 'sand', name: 'ماسه صحرا', light: '#f4dfba', dark: '#d2a66e', texture: 'https://images.unsplash.com/photo-1545464197-e89bd74737dd?q=80&w=200&auto=format&fit=crop' },
  { id: 'carbon', name: 'فیبر کربن', light: '#888888', dark: '#222222', texture: 'https://images.unsplash.com/photo-1585807469395-586b46b1076b?q=80&w=200&auto=format&fit=crop' },
  { id: 'canvas', name: 'بوم نقاشی', light: '#f2ece4', dark: '#a59b8c', texture: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?q=80&w=200&auto=format&fit=crop' },
  { id: 'dark', name: 'گرافیت کلاسیک', light: '#bababa', dark: '#4a4a4a' },
  { id: 'glass', name: 'شیشه‌ای', light: '#dff9fb', dark: '#95afc0' },
  { id: 'sky', name: 'آبی آسمان', light: '#e0f7fa', dark: '#4fc3f7' },
];

// لیست تم‌های مهره (متصل به سرور Chess.com)
const pieceThemes = [
  { id: 'neo', name: 'نئو (Neo)' },
  { id: 'classic', name: 'استانتون' },
  { id: 'neo-wood', name: 'چوبی (Wood)' },
  { id: 'glass', name: 'شیشه‌ای' },
  { id: 'metal', name: 'فلزی (Metal)' },
  { id: 'gothic', name: 'گوتیک' },
  { id: 'icy_sea', name: 'دریای یخی' },
  { id: 'nature', name: 'طبیعت' },
  { id: 'space', name: 'فضایی' },
];

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(defaultSettings);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [feedbackData, setFeedbackData] = useState({ text: '', name: '', phone: '', email: '' });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('farzin_active_tab') || 'accounts';
  });

  useEffect(() => {
    const saved = localStorage.getItem('farzin_settings');
    if (saved) setSettings(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  const updateSetting = (key: keyof typeof defaultSettings, value: any) => {
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, [key]: value };
      localStorage.setItem('farzin_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    localStorage.setItem('farzin_active_tab', id);
  };

  const handleConnect = (platform: 'lichess' | 'chessDotCom') => {
    setIsSyncing(platform);
    setTimeout(() => {
      updateSetting(platform === 'lichess' ? 'lichessConnected' : 'chessDotComConnected', true);
      setIsSyncing(null);
    }, 2000);
  };

  const handleSendFeedback = () => {
    if (!feedbackData.text.trim()) return;
    setFeedbackStatus('sending');
    setTimeout(() => {
      setFeedbackStatus('success');
      setTimeout(() => {
        setIsFeedbackOpen(false);
        setFeedbackStatus('idle');
        setFeedbackData({ text: '', name: '', phone: '', email: '' });
      }, 2000);
    }, 1500);
  };

  const tabs = [
    { id: 'accounts', title: 'اتصال اکانت', icon: <Link2 size={16} /> },
    { id: 'gameplay', title: 'گیم‌پلی', icon: <MousePointer2 size={16} /> },
    { id: 'appearance', title: 'ظاهر و تم', icon: <Palette size={16} /> },
    { id: 'engine', title: 'موتور و تحلیل', icon: <Cpu size={16} /> },
    { id: 'general', title: 'عمومی', icon: <Globe size={16} /> }
  ];

  const Switch = ({ checked, onChange }: any) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`flex items-center w-12 h-6 p-1 rounded-full cursor-pointer transition-colors duration-300 shadow-inner ${checked ? 'bg-farzin-accent' : 'bg-[#35332e]'}`}
      dir="ltr" 
    >
      <motion.div 
        initial={false}
        animate={{ x: checked ? 24 : 0 }} 
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className="w-4 h-4 bg-white rounded-full shadow-md"
      />
    </div>
  );

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-20 overflow-x-hidden" 
        dir="rtl"
      >
        <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]">
            <ChevronRight size={24} />
          </button>
          <h1 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-md">تنظیمات فرزین</h1>
          <div className="w-10"></div>
        </div>

        <div className={`w-full max-w-2xl px-4 flex flex-col gap-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          <div className="relative flex overflow-x-auto gap-2 pb-4 pt-2 no-scrollbar px-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13px] whitespace-nowrap transition-colors duration-300 outline-none ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-[#262421] border border-[#403e3a] rounded-2xl shadow-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className={isActive ? "text-farzin-accent" : ""}>{tab.icon}</span>
                    {tab.title}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                
                {/* تب اکانت‌ها */}
                {activeTab === 'accounts' && (
                  <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-farzin-accent/30 to-transparent"></div>
                    <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                        <Link2 size={18} />
                        <h2 className="font-black text-xs uppercase tracking-widest">همگام‌سازی پلتفرم‌ها</h2>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between p-4 rounded-[20px] bg-[#161512] border border-[#35332e] shadow-inner">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                    <img src="https://lichess1.org/assets/images/logo/lichess-favicon-256.png" className="w-8 h-8" alt="Lichess" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white">Lichess.org</span>
                                    <span className={`text-[10px] font-bold mt-0.5 ${settings.lichessConnected ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                        {settings.lichessConnected ? 'متصل شده' : 'عدم اتصال'}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => !settings.lichessConnected && handleConnect('lichess')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${settings.lichessConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-farzin-accent text-white shadow-lg shadow-farzin-accent/20 border border-[#86a566]'}`}
                            >
                                {isSyncing === 'lichess' ? <RefreshCw size={16} className="animate-spin" /> : (settings.lichessConnected ? 'متصل' : 'اتصال')}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-[20px] bg-[#161512] border border-[#35332e] shadow-inner">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-black/10">
                                    <img src="https://lichess1.org/assets/images/logo/chess-com.favicon.png" className="w-8 h-8 rounded-lg" alt="Chess.com" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white">Chess.com</span>
                                    <span className={`text-[10px] font-bold mt-0.5 ${settings.chessDotComConnected ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                        {settings.chessDotComConnected ? 'متصل شده' : 'عدم اتصال'}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => !settings.chessDotComConnected && handleConnect('chessDotCom')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${settings.chessDotComConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-[#35332e] text-white hover:bg-[#403e3a]'}`}
                            >
                                {isSyncing === 'chessDotCom' ? <RefreshCw size={16} className="animate-spin" /> : (settings.chessDotComConnected ? 'متصل' : 'اتصال')}
                            </button>
                        </div>
                    </div>
                  </div>
                )}

                {/* تب گیم‌پلی */}
                {activeTab === 'gameplay' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                      <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                          <ShieldCheck size={18} />
                          <h2 className="font-black text-xs uppercase tracking-widest">قوانین حرکت</h2>
                      </div>
                      <div className="space-y-2">
                          <div className="flex items-center justify-between py-3">
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">پیش‌حرکت (Premove)</span>
                                  <span className="text-[10px] text-zinc-500 mt-1">حرکت قبل از نوبت حریف</span>
                              </div>
                              <Switch checked={settings.premove} onChange={(v: boolean) => updateSetting('premove', v)} />
                          </div>
                          <div className="flex items-center justify-between py-3 border-t border-white/5">
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">تایید حرکت</span>
                                  <span className="text-[10px] text-zinc-500 mt-1">دکمه تایید بعد از جابجایی</span>
                              </div>
                              <Switch checked={settings.confirmMove} onChange={(v: boolean) => updateSetting('confirmMove', v)} />
                          </div>
                      </div>
                    </div>

                    <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                      <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                          <Volume2 size={18} />
                          <h2 className="font-black text-xs uppercase tracking-widest">صدا</h2>
                      </div>
                      <div className="flex items-center justify-between py-1">
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">افکت‌های صوتی</span>
                              <span className="text-[10px] text-zinc-500 mt-1">صدای مهره‌ها و ساعت</span>
                          </div>
                          <Switch checked={settings.soundEnabled} onChange={(v: boolean) => updateSetting('soundEnabled', v)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 🔥 تب ظاهر و تم (نسخه افقی با انیمیشن) */}
                {activeTab === 'appearance' && (
                  <div className="flex flex-col gap-6">
                    {/* تم تخته شطرنج */}
                    <div className="bg-[#1e1c19] pt-6 pb-4 rounded-[28px] border border-[#35332e] shadow-xl overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 px-6 text-farzin-accent">
                            <Palette size={18} />
                            <h2 className="font-black text-xs uppercase tracking-widest">تم‌های تخته (چهارخونه)</h2>
                        </div>
                        {/* لیست افقی اسکرول‌شونده */}
                        <div className="flex overflow-x-auto gap-4 px-6 pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
                            {boardThemes.map(t => {
                                const isSelected = settings.boardTheme === t.id;
                                return (
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        key={t.id}
                                        onClick={() => updateSetting('boardTheme', t.id)}
                                        className={`flex-shrink-0 flex flex-col items-center gap-3 p-3 w-[110px] rounded-[20px] border-2 transition-colors snap-center ${isSelected ? 'border-farzin-accent bg-[#262421] shadow-[0_5px_15px_rgba(119,149,86,0.2)]' : 'border-transparent bg-[#161512] shadow-inner'}`}
                                    >
                                        <div className="w-16 h-16 rounded-xl shadow-md border border-black/30 overflow-hidden grid grid-cols-2 grid-rows-2 relative">
                                            {t.texture && <img src={t.texture} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" alt={t.name} />}
                                            <div style={{ backgroundColor: t.light }}></div>
                                            <div style={{ backgroundColor: t.dark }}></div>
                                            <div style={{ backgroundColor: t.dark }}></div>
                                            <div style={{ backgroundColor: t.light }}></div>
                                        </div>
                                        <span className={`text-[11px] font-black truncate w-full text-center ${isSelected ? 'text-white' : 'text-zinc-500'}`}>{t.name}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* تم مهره‌های شطرنج */}
                    <div className="bg-[#1e1c19] pt-6 pb-4 rounded-[28px] border border-[#35332e] shadow-xl overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 px-6 text-farzin-accent">
                            <Crown size={18} />
                            <h2 className="font-black text-xs uppercase tracking-widest">تم‌های مهره‌ها</h2>
                        </div>
                        {/* لیست افقی اسکرول‌شونده برای مهره‌ها */}
                        <div className="flex overflow-x-auto gap-4 px-6 pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
                            {pieceThemes.map(p => {
                                const isSelected = settings.pieceTheme === p.id;
                                // استفاده از اسب سفید به عنوان پیش‌نمایش تم
                                const pieceUrl = `https://images.chesscomfiles.com/chess-themes/pieces/${p.id}/150/wn.png`;
                                return (
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        key={p.id}
                                        onClick={() => updateSetting('pieceTheme', p.id)}
                                        className={`flex-shrink-0 flex flex-col items-center gap-3 p-3 w-[110px] rounded-[20px] border-2 transition-colors snap-center ${isSelected ? 'border-farzin-accent bg-[#262421] shadow-[0_5px_15px_rgba(119,149,86,0.2)]' : 'border-transparent bg-[#161512] shadow-inner'}`}
                                    >
                                        <div className="w-16 h-16 rounded-xl shadow-inner border border-[#35332e] bg-[#22201d] flex items-center justify-center p-1">
                                            <img src={pieceUrl} alt={p.name} className="w-full h-full object-contain drop-shadow-md" />
                                        </div>
                                        <span className={`text-[11px] font-black truncate w-full text-center ${isSelected ? 'text-white' : 'text-zinc-500'}`}>{p.name}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                  </div>
                )}

                {/* تب موتور */}
                {activeTab === 'engine' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                      <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                          <Activity size={18} />
                          <h2 className="font-black text-xs uppercase tracking-widest">تحلیل گرافیکی</h2>
                      </div>
                      <div className="space-y-6">
                          <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white">نوار ارزیابی (Eval Bar)</span>
                              <Switch checked={settings.evalBar} onChange={(v: boolean) => updateSetting('evalBar', v)} />
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white">کیفیت حرکات (Brilliant/Miss)</span>
                              <Switch checked={settings.showMoveQualities} onChange={(v: boolean) => updateSetting('showMoveQualities', v)} />
                          </div>
                      </div>
                    </div>

                    <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                      <div className="flex items-center gap-2 mb-8 text-farzin-accent">
                          <BrainCircuit size={18} />
                          <h2 className="font-black text-xs uppercase tracking-widest">قدرت پردازش موتور</h2>
                      </div>
                      <div className="space-y-8">
                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-zinc-400">هسته‌ها (Threads)</span>
                                  <span className="font-mono text-farzin-accent font-black text-sm bg-[#161512] px-3 py-1.5 rounded-lg border border-[#35332e] shadow-inner">{settings.engineThreads}</span>
                              </div>
                              <input 
                                  type="range" min="1" max="8" 
                                  value={settings.engineThreads}
                                  onChange={(e) => updateSetting('engineThreads', parseInt(e.target.value))}
                                  className="w-full h-2 bg-[#161512] rounded-lg appearance-none accent-farzin-accent outline-none shadow-inner border border-[#35332e]" 
                              />
                          </div>
                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-zinc-400">حافظه موقت (Hash MB)</span>
                                  <span className="font-mono text-farzin-accent font-black text-sm bg-[#161512] px-3 py-1.5 rounded-lg border border-[#35332e] shadow-inner">{settings.engineHash}</span>
                              </div>
                              <input 
                                  type="range" min="16" max="512" step="16"
                                  value={settings.engineHash}
                                  onChange={(e) => updateSetting('engineHash', parseInt(e.target.value))}
                                  className="w-full h-2 bg-[#161512] rounded-lg appearance-none accent-farzin-accent outline-none shadow-inner border border-[#35332e]" 
                              />
                          </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* تب عمومی */}
                {activeTab === 'general' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                        <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                            <Globe size={18} />
                            <h2 className="font-black text-xs uppercase tracking-widest">زبان برنامه</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => updateSetting('language', 'fa')}
                                className={`py-3.5 rounded-2xl border-2 font-black text-sm transition-all ${settings.language === 'fa' ? 'bg-farzin-accent text-white border-transparent shadow-[0_4px_15px_rgba(119,149,86,0.4)]' : 'bg-[#161512] text-zinc-400 border-[#35332e] hover:bg-[#262421] shadow-inner'}`}
                            >
                                فارسی
                            </button>
                            <button 
                                onClick={() => updateSetting('language', 'en')}
                                className={`py-3.5 rounded-2xl border-2 font-black text-sm transition-all ${settings.language === 'en' ? 'bg-farzin-accent text-white border-transparent shadow-[0_4px_15px_rgba(119,149,86,0.4)]' : 'bg-[#161512] text-zinc-400 border-[#35332e] hover:bg-[#262421] shadow-inner'}`}
                            >
                                English
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                        <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                            <MessageCircle size={18} />
                            <h2 className="font-black text-xs uppercase tracking-widest">ارتباط با ما</h2>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => window.open('https://t.me/lasp_ir', '_blank')}
                                className="flex items-center justify-between p-4 rounded-xl bg-[#161512] border border-[#35332e] hover:bg-[#262421] transition-colors group active:scale-95"
                            >
                                <div className="flex items-center gap-3">
                                    <Send size={18} className="text-sky-400 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-sm text-zinc-200">کانال تلگرام</span>
                                </div>
                                <ExternalLink size={16} className="text-zinc-600" />
                            </button>
                            
                            <button 
                                onClick={() => window.open('https://ble.ir/lasp_ir', '_blank')}
                                className="flex items-center justify-between p-4 rounded-xl bg-[#161512] border border-[#35332e] hover:bg-[#262421] transition-colors group active:scale-95"
                            >
                                <div className="flex items-center gap-3">
                                    <MessageCircle size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-sm text-zinc-200">کانال بله</span>
                                </div>
                                <ExternalLink size={16} className="text-zinc-600" />
                            </button>

                            <button 
                                onClick={() => window.open('https://lasp.ir', '_blank')}
                                className="flex items-center justify-between p-4 rounded-xl bg-[#161512] border border-[#35332e] hover:bg-[#262421] transition-colors group active:scale-95"
                            >
                                <div className="flex items-center gap-3">
                                    <Globe size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-sm text-zinc-200">بازدید از سایت رسمی</span>
                                </div>
                                <ExternalLink size={16} className="text-zinc-600" />
                            </button>

                            <button 
                                onClick={() => setIsFeedbackOpen(true)}
                                className="flex items-center justify-between p-4 mt-2 rounded-xl bg-farzin-accent/10 border border-farzin-accent/20 hover:bg-farzin-accent/20 transition-colors group active:scale-95"
                            >
                                <div className="flex items-center gap-3">
                                    <MessageSquare size={18} className="text-farzin-accent group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-sm text-farzin-accent">ارسال انتقاد و پیشنهاد</span>
                                </div>
                                <ChevronRight size={16} className="text-farzin-accent/60" />
                            </button>
                        </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </motion.div>

      {/* پاپ‌آپ (Modal) ارسال بازخورد */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[#1e1c19] border border-[#35332e] rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#35332e] bg-[#262421]">
                <h3 className="font-black text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-farzin-accent" />
                  ارسال بازخورد
                </h3>
                <button 
                  onClick={() => { if (feedbackStatus !== 'sending') setIsFeedbackOpen(false); }}
                  className="p-2 bg-[#161512] rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                
                {feedbackStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 gap-4"
                  >
                    <div className="w-16 h-16 bg-farzin-accent/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-farzin-accent" />
                    </div>
                    <span className="font-black text-white text-lg">با موفقیت ارسال شد!</span>
                    <span className="text-xs text-zinc-400">از اینکه به بهبود فرزین کمک می‌کنید متشکریم.</span>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 px-1">متن پیام (الزامی)</label>
                      <textarea 
                        value={feedbackData.text}
                        onChange={(e) => setFeedbackData({...feedbackData, text: e.target.value})}
                        placeholder="مشکل، پیشنهاد یا انتقاد خود را بنویسید..."
                        className="w-full h-28 resize-none bg-[#161512] border border-[#35332e] focus:border-farzin-accent rounded-xl p-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-zinc-400 px-1">نام (اختیاری)</label>
                        <input 
                          type="text"
                          value={feedbackData.name}
                          onChange={(e) => setFeedbackData({...feedbackData, name: e.target.value})}
                          placeholder="نام شما"
                          className="w-full bg-[#161512] border border-[#35332e] focus:border-farzin-accent rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-zinc-400 px-1">شماره تماس (اختیاری)</label>
                        <input 
                          type="tel"
                          dir="ltr"
                          value={feedbackData.phone}
                          onChange={(e) => setFeedbackData({...feedbackData, phone: e.target.value})}
                          placeholder="0912..."
                          className="w-full bg-[#161512] border border-[#35332e] focus:border-farzin-accent rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors text-right"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-zinc-400 px-1">ایمیل (اختیاری)</label>
                        <input 
                          type="email"
                          dir="ltr"
                          value={feedbackData.email}
                          onChange={(e) => setFeedbackData({...feedbackData, email: e.target.value})}
                          placeholder="your@email.com"
                          className="w-full bg-[#161512] border border-[#35332e] focus:border-farzin-accent rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors text-right"
                        />
                    </div>

                    <button 
                      onClick={handleSendFeedback}
                      disabled={!feedbackData.text.trim() || feedbackStatus === 'sending'}
                      className={`mt-2 w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!feedbackData.text.trim() ? 'bg-[#35332e] text-zinc-500 cursor-not-allowed' : 'bg-farzin-accent text-white shadow-[0_4px_15px_rgba(119,149,86,0.4)] active:scale-[0.98]'}`}
                    >
                      {feedbackStatus === 'sending' ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={16} />
                          ارسال پیام
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}