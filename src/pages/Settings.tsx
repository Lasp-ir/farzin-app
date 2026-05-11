import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Volume2, MousePointer2, Palette, Cpu, Globe, 
  CheckCircle2, Sliders, Activity, BrainCircuit, Link2, 
  RefreshCw, ShieldCheck
} from 'lucide-react';

const defaultSettings = {
  soundEnabled: true,
  premove: true,
  confirmMove: false,
  boardTheme: 'green',
  evalBar: true,
  showMoveQualities: true,
  engineThreads: 2,
  engineHash: 32,
  language: 'fa',
  lichessConnected: false,
  chessDotComConnected: false
};

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('accounts'); // تب پیش‌فرض رو گذاشتیم روی اکانت‌ها
  const [settings, setSettings] = useState(defaultSettings);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('farzin_settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const updateSetting = (key: keyof typeof defaultSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('farzin_settings', JSON.stringify(newSettings));
  };

  const handleConnect = (platform: 'lichess' | 'chessDotCom') => {
    setIsSyncing(platform);
    setTimeout(() => {
      updateSetting(platform === 'lichess' ? 'lichessConnected' : 'chessDotComConnected', true);
      setIsSyncing(null);
    }, 2000);
  };

  const tabs = [
    { id: 'accounts', title: 'اتصال اکانت', icon: <Link2 size={16} /> },
    { id: 'gameplay', title: 'گیم‌پلی', icon: <MousePointer2 size={16} /> },
    { id: 'appearance', title: 'ظاهر تخته', icon: <Palette size={16} /> },
    { id: 'engine', title: 'موتور و تحلیل', icon: <Cpu size={16} /> },
    { id: 'general', title: 'عمومی', icon: <Globe size={16} /> }
  ];

  // 🔥 مشکل بیرون‌زدگی با استفاده از Flexbox و ویژگی layout برطرف شد
  const AnimatedToggle = ({ checked, onChange }: any) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`flex items-center w-12 h-6 p-1 rounded-full cursor-pointer transition-colors duration-300 ${checked ? 'bg-farzin-accent justify-end' : 'bg-[#35332e] justify-start'}`}
    >
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-4 h-4 bg-white rounded-full shadow-md"
      />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-20 overflow-x-hidden" 
      dir="rtl"
    >
      {/* هدر */}
      <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]">
          <ChevronRight size={24} />
        </button>
        <h1 className="text-lg font-black tracking-tight text-white uppercase">تنظیمات فرزین</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-2xl px-4 flex flex-col gap-6">
        
        {/* منوی تب‌ها */}
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-[13px] transition-all whitespace-nowrap border active:scale-95 ${
                activeTab === tab.id 
                ? 'bg-farzin-accent text-white border-transparent shadow-lg shadow-farzin-accent/20' 
                : 'bg-[#1e1c19] text-zinc-500 border-[#35332e] hover:bg-[#262421]'
              }`}
            >
              {tab.icon} {tab.title}
            </button>
          ))}
        </div>

        {/* محتوای تب‌ها با انیمیشن */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* 🔥 تب جدید: اکانت‌های متصل */}
              {activeTab === 'accounts' && (
                <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-farzin-accent/30 to-transparent"></div>
                  <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                      <Link2 size={18} />
                      <h2 className="font-black text-xs uppercase tracking-widest">همگام‌سازی پلتفرم‌ها (Sync)</h2>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                      {/* Lichess */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#161512] border border-[#35332e] shadow-inner">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-[#403e3a] shadow-sm">
                                  <span className="font-black text-xl text-white">L</span>
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">Lichess.org</span>
                                  <span className={`text-[10px] font-bold mt-0.5 ${settings.lichessConnected ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                      {settings.lichessConnected ? 'متصل شده (آماده سینک)' : 'عدم اتصال'}
                                  </span>
                              </div>
                          </div>
                          <button 
                              onClick={() => !settings.lichessConnected && handleConnect('lichess')}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${settings.lichessConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-farzin-accent text-white shadow-lg shadow-farzin-accent/20'}`}
                          >
                              {isSyncing === 'lichess' ? <RefreshCw size={16} className="animate-spin" /> : (settings.lichessConnected ? 'متصل' : 'اتصال اکانت')}
                          </button>
                      </div>

                      {/* Chess.com */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#161512] border border-[#35332e] shadow-inner">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7fa650] to-[#5a7d33] flex items-center justify-center border border-[#8cb757] shadow-sm">
                                  <span className="font-black text-2xl text-white drop-shadow-md leading-none pb-1">♟</span>
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">Chess.com</span>
                                  <span className={`text-[10px] font-bold mt-0.5 ${settings.chessDotComConnected ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                      {settings.chessDotComConnected ? 'متصل شده (آماده سینک)' : 'عدم اتصال'}
                                  </span>
                              </div>
                          </div>
                          <button 
                              onClick={() => !settings.chessDotComConnected && handleConnect('chessDotCom')}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${settings.chessDotComConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-[#35332e] text-white hover:bg-[#403e3a]'}`}
                          >
                              {isSyncing === 'chessDotCom' ? <RefreshCw size={16} className="animate-spin" /> : (settings.chessDotComConnected ? 'متصل' : 'اتصال اکانت')}
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
                                <span className="text-[10px] text-zinc-500 mt-1">حرکت مهره قبل از نوبت حریف</span>
                            </div>
                            <AnimatedToggle checked={settings.premove} onChange={(v: boolean) => updateSetting('premove', v)} />
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-white/5">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">تایید حرکت</span>
                                <span className="text-[10px] text-zinc-500 mt-1">نمایش دکمه تایید بعد از جابجایی</span>
                            </div>
                            <AnimatedToggle checked={settings.confirmMove} onChange={(v: boolean) => updateSetting('confirmMove', v)} />
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
                            <span className="text-[10px] text-zinc-500 mt-1">صدای مهره‌ها و زمان</span>
                        </div>
                        <AnimatedToggle checked={settings.soundEnabled} onChange={(v: boolean) => updateSetting('soundEnabled', v)} />
                    </div>
                  </div>
                </div>
              )}

              {/* تب ظاهر */}
              {activeTab === 'appearance' && (
                <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                    <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                        <Palette size={18} />
                        <h2 className="font-black text-xs uppercase tracking-widest">تم‌های بصری</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: 'green', name: 'سبز فرزین', color: '#779556' },
                            { id: 'wood', name: 'چوبی لوکس', color: '#b58863' },
                            { id: 'dark', name: 'سایه گرافیت', color: '#3f3f46' },
                        ].map(t => (
                            <button 
                                key={t.id}
                                onClick={() => updateSetting('boardTheme', t.id)}
                                className={`flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all ${settings.boardTheme === t.id ? 'border-farzin-accent bg-[#262421]' : 'border-transparent bg-[#161512]'}`}
                            >
                                <div className="w-12 h-12 rounded-lg shadow-inner" style={{ backgroundColor: t.color }}></div>
                                <span className="text-[10px] font-bold">{t.name}</span>
                            </button>
                        ))}
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
                            <AnimatedToggle checked={settings.evalBar} onChange={(v: boolean) => updateSetting('evalBar', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">کیفیت حرکات (Brilliant/Miss)</span>
                            <AnimatedToggle checked={settings.showMoveQualities} onChange={(v: boolean) => updateSetting('showMoveQualities', v)} />
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
                                <span className="text-xs font-bold text-zinc-400">تعداد هسته‌ها (Threads)</span>
                                <span className="font-mono text-farzin-accent font-bold text-sm bg-[#161512] px-3 py-1 rounded-lg border border-[#35332e]">{settings.engineThreads}</span>
                            </div>
                            <input 
                                type="range" min="1" max="8" 
                                value={settings.engineThreads}
                                onChange={(e) => updateSetting('engineThreads', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-[#35332e] rounded-lg appearance-none accent-farzin-accent outline-none" 
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-400">حافظه موقت (Hash MB)</span>
                                <span className="font-mono text-farzin-accent font-bold text-sm bg-[#161512] px-3 py-1 rounded-lg border border-[#35332e]">{settings.engineHash}</span>
                            </div>
                            <input 
                                type="range" min="16" max="512" step="16"
                                value={settings.engineHash}
                                onChange={(e) => updateSetting('engineHash', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-[#35332e] rounded-lg appearance-none accent-farzin-accent outline-none" 
                            />
                        </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* تب عمومی */}
              {activeTab === 'general' && (
                <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                    <div className="flex items-center gap-2 mb-6 text-farzin-accent">
                        <Globe size={18} />
                        <h2 className="font-black text-xs uppercase tracking-widest">زبان برنامه</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => updateSetting('language', 'fa')}
                            className={`py-3.5 rounded-xl border-2 font-black text-sm transition-all ${settings.language === 'fa' ? 'bg-farzin-accent text-white border-transparent shadow-lg' : 'bg-[#161512] text-zinc-400 border-[#35332e] hover:bg-[#262421]'}`}
                        >
                            فارسی
                        </button>
                        <button 
                            onClick={() => updateSetting('language', 'en')}
                            className={`py-3.5 rounded-xl border-2 font-black text-sm transition-all ${settings.language === 'en' ? 'bg-farzin-accent text-white border-transparent shadow-lg' : 'bg-[#161512] text-zinc-400 border-[#35332e] hover:bg-[#262421]'}`}
                        >
                            English
                        </button>
                    </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}