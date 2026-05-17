import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Volume2, MousePointer2, Palette, Cpu, Globe, 
  Activity, BrainCircuit, Link2, RefreshCw, ShieldCheck,
  Send, MessageCircle, ExternalLink, MessageSquare, X, CheckCircle2, 
  Crown, Users, Trash2, Check, PlusCircle, CloudDownload, AlertTriangle, Loader2,
  Store, Gem, Sparkles, CheckCircle
} from 'lucide-react';

const defaultSettings = {
  soundEnabled: true,
  premove: true,
  confirmMove: false,
  boardTheme: 'green',
  pieceTheme: 'neo',
  evalBar: true,
  showMoveQualities: true,
  engineThreads: 2,
  engineHash: 32,
  language: 'fa',
};

const boardThemes = [
  { id: 'green', name: 'سبز فرزین', light: '#ebecd0', dark: '#779556' },
  { id: 'wood', name: 'چوب کلاسیک', light: '#f0d9b5', dark: '#b58863' },
  { id: 'walnut', name: 'گردویی', light: '#d0af88', dark: '#6e472a' },
  { id: 'marble', name: 'سنگ مرمر', light: '#e8ecef', dark: '#8f9ea8' },
  { id: 'granite', name: 'گرانیت', light: '#c4c8cc', dark: '#50565a' },
  { id: 'sand', name: 'ماسه صحرا', light: '#f4dfba', dark: '#d2a66e' },
  { id: 'carbon', name: 'فیبر کربن', light: '#888888', dark: '#222222' },
  { id: 'canvas', name: 'بوم نقاشی', light: '#f2ece4', dark: '#a59b8c' },
  { id: 'dark', name: 'گرافیت', light: '#bababa', dark: '#4a4a4a' },
  { id: 'glass', name: 'شیشه‌ای', light: '#dff9fb', dark: '#95afc0' },
  { id: 'sky', name: 'آسمان', light: '#e0f7fa', dark: '#4fc3f7' },
];

const pieceThemes = [
  { id: 'neo', name: 'نئو (Neo)' },
  { id: 'classic', name: 'استانتون' },
  { id: 'neo-wood', name: 'چوبی (Wood)' },
  { id: 'glass', name: 'شیشه‌ای' },
  { id: 'metal', name: 'فلزی (Metal)' },
];

// 💎 ۱۵ تم تخته بی‌نظیر VIP (از Unsplash با کیفیت بهینه)
const VIP_BOARDS = [
    { id: 'vip_galaxy', name: 'کهکشان آندرومدا', price: 150, texture: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_lava', name: 'مواد مذاب', price: 200, texture: 'https://images.unsplash.com/photo-1542360663-8f40838b8d7a?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_gold', name: 'طلای ۲۴ عیار', price: 350, texture: 'https://images.unsplash.com/photo-1618526569106-96a84d4642f4?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_cyberpunk', name: 'سایبرپانک ۲۰۷۷', price: 250, texture: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_emerald', name: 'زمرد کبود', price: 180, texture: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_amethyst', name: 'کریستال بنفش', price: 180, texture: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_ocean', name: 'اقیانوس عمیق', price: 150, texture: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_matrix', name: 'کد ماتریکس', price: 300, texture: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_bloodmoon', name: 'ماه خونین', price: 220, texture: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_forest', name: 'جنگل مه‌آلود', price: 120, texture: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_rosegold', name: 'رز گلد الماس', price: 400, texture: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_iceberg', name: 'کوه یخ شکسته', price: 160, texture: 'https://images.unsplash.com/photo-1478719059408-592965723cbc?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_darkmatter', name: 'ماده تاریک', price: 500, texture: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_neonwaves', name: 'امواج نئونی', price: 280, texture: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=60&w=400&auto=format&fit=crop' },
    { id: 'vip_abstract', name: 'آبستره طلایی', price: 320, texture: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=60&w=400&auto=format&fit=crop' },
];

// 💎 ۱۵ تم مهره بی‌نظیر VIP
const VIP_PIECES = [
    { id: '3d', name: 'رئالیسم سه‌بعدی', price: 250 },
    { id: '3d_wood', name: 'چوب حکاکی‌شده', price: 300 },
    { id: 'tournament', name: 'مسابقات جهانی', price: 150 },
    { id: 'dash', name: 'اسپید (Dash)', price: 180 },
    { id: 'lolz', name: 'کارتونی (Lolz)', price: 120 },
    { id: 'bubblegum', name: 'آدامس خرسی', price: 100 },
    { id: 'graffito', name: 'گرافیتی خیابانی', price: 220 },
    { id: 'marble', name: 'سنگ مرمر خالص', price: 350 },
    { id: 'modern', name: 'مدرن مینیمال', price: 200 },
    { id: 'ocean', name: 'اسرار اقیانوس', price: 180 },
    { id: 'light', name: 'نور خالص (Light)', price: 280 },
    { id: 'maya', name: 'تمدن مایا', price: 400 },
    { id: 'cases', name: 'پیکسلی کلاسیک', price: 150 },
    { id: 'condal', name: 'کوندال اسپانیا', price: 190 },
    { id: 'game_room', name: 'اتاق بازی ۸۰s', price: 250 },
];

const toPersianDigits = (num: number | string) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // موجودی کاربر (فرضی برای تست)
  const [gems, setGems] = useState(1250);

  const [downloadingBoard, setDownloadingBoard] = useState<string | null>(null);
  const [downloadingPiece, setDownloadingPiece] = useState<string | null>(null);
  const [downloadErrorModal, setDownloadErrorModal] = useState(false);
  const [forceRenderCount, setForceRenderCount] = useState(0);

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('farzin_active_tab') || 'store');
  const [storeTab, setStoreTab] = useState<'boards' | 'pieces'>('boards');

  useEffect(() => {
    const saved = localStorage.getItem('farzin_settings');
    if (saved) setSettings({...defaultSettings, ...JSON.parse(saved)});
    setIsLoaded(true);
  }, []);

  const updateSetting = (key: keyof typeof defaultSettings, value: any) => {
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, [key]: value };
      localStorage.setItem('farzin_settings', JSON.stringify(newSettings));
      window.dispatchEvent(new Event('farzin_settings_changed'));
      return newSettings;
    });
  };

  const fetchAsBase64 = async (url: string): Promise<string> => {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
  };

  const handleDownloadBoardTheme = async (theme: any) => {
      setDownloadingBoard(theme.id);
      try {
          const base64data = await fetchAsBase64(theme.texture);
          localStorage.setItem(`farzin_board_${theme.id}`, base64data);
          setForceRenderCount(p => p + 1); 
          updateSetting('boardTheme', theme.id);
      } catch (err) {
          setDownloadErrorModal(true);
      } finally {
          setDownloadingBoard(null);
      }
  };

  const handleDownloadPieceTheme = async (theme: any) => {
      setDownloadingPiece(theme.id);
      try {
          const pieces = ['wp', 'wn', 'wb', 'wr', 'wq', 'wk', 'bp', 'bn', 'bb', 'br', 'bq', 'bk'];
          const promises = pieces.map(async (p) => {
              const url = `https://images.chesscomfiles.com/chess-themes/pieces/${theme.id}/150/${p}.png`;
              const data = await fetchAsBase64(url);
              return { piece: p, data };
          });
          const results = await Promise.all(promises);
          results.forEach(res => {
              localStorage.setItem(`farzin_piece_${theme.id}_${res.piece}`, res.data);
          });
          setForceRenderCount(p => p + 1);
          updateSetting('pieceTheme', theme.id);
      } catch (err) {
          setDownloadErrorModal(true);
      } finally {
          setDownloadingPiece(null);
      }
  };

  const tabs = [
    { id: 'store', title: 'فروشگاه VIP', icon: <Store size={16} /> },
    { id: 'appearance', title: 'ظاهر پایه', icon: <Palette size={16} /> },
    { id: 'gameplay', title: 'گیم‌پلی', icon: <MousePointer2 size={16} /> },
    { id: 'engine', title: 'موتور و تحلیل', icon: <Cpu size={16} /> },
    { id: 'general', title: 'عمومی', icon: <Globe size={16} /> }
  ];

  const Switch = ({ checked, onChange }: any) => (
    <div onClick={() => onChange(!checked)} className={`flex items-center w-12 h-6 p-1 rounded-full cursor-pointer transition-colors duration-300 shadow-inner ${checked ? 'bg-farzin-accent' : 'bg-[#35332e]'}`} dir="ltr">
      <motion.div initial={false} animate={{ x: checked ? 24 : 0 }} transition={{ type: "spring", stiffness: 600, damping: 30 }} className="w-4 h-4 bg-white rounded-full shadow-md" />
    </div>
  );

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen bg-[#11100e] text-zinc-200 flex flex-col items-center pb-20 overflow-x-hidden" dir="rtl">
        
        {/* Header */}
        <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between sticky top-0 z-50 bg-[#11100e]/80 backdrop-blur-xl border-b border-white/5">
          <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]">
            <ChevronRight size={24} />
          </button>
          <h1 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-md">تنظیمات فرزین</h1>
          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <span className="font-mono font-black text-amber-400 mt-0.5">{toPersianDigits(gems)}</span>
              <Gem size={14} className="text-amber-400" fill="currentColor" />
          </div>
        </div>

        <div className={`w-full max-w-2xl px-4 mt-2 flex flex-col gap-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          <div className="relative flex overflow-x-auto gap-2 pb-4 pt-2 no-scrollbar px-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); localStorage.setItem('farzin_active_tab', tab.id); }} className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13px] whitespace-nowrap transition-colors duration-300 outline-none ${isActive ? (tab.id==='store'?'text-amber-400':'text-white') : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {isActive && <motion.div layoutId="activeTabPill" className={`absolute inset-0 border rounded-2xl shadow-lg ${tab.id==='store'?'bg-amber-500/10 border-amber-500/30':'bg-[#262421] border-[#403e3a]'}`} transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                  <span className="relative z-10 flex items-center gap-2"><span className={isActive ? (tab.id==='store'?"text-amber-400":"text-farzin-accent") : ""}>{tab.icon}</span>{tab.title}</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                
                {/* 🌟 تب جدید و خارق‌العاده فروشگاه VIP */}
                {activeTab === 'store' && (
                  <div className="flex flex-col gap-6">
                    {/* بنر فروشگاه */}
                    <div className="w-full h-36 rounded-3xl bg-gradient-to-br from-amber-600 via-orange-500 to-rose-600 relative overflow-hidden flex items-center justify-between px-8 shadow-[0_15px_40px_rgba(245,158,11,0.3)]">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
                        <div className="relative z-10 flex flex-col">
                            <h2 className="text-3xl font-black text-white drop-shadow-md flex items-center gap-2">بوتیک VIP <Crown size={24} className="text-yellow-200" fill="currentColor"/></h2>
                            <p className="text-amber-100 font-bold text-xs mt-1">اختصاصی‌ترین گرافیک‌ها برای خاص‌پسندان</p>
                        </div>
                        <Sparkles size={100} className="text-white/20 absolute -left-5 -bottom-5" />
                    </div>

                    {/* تب‌های داخلی فروشگاه */}
                    <div className="flex bg-[#1e1c19] p-1.5 rounded-2xl border border-white/5 mx-auto">
                        <button onClick={() => setStoreTab('boards')} className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${storeTab === 'boards' ? 'bg-[#2a2824] text-amber-400 shadow-md' : 'text-zinc-500 hover:text-white'}`}>تخته‌های ویژه</button>
                        <button onClick={() => setStoreTab('pieces')} className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${storeTab === 'pieces' ? 'bg-[#2a2824] text-amber-400 shadow-md' : 'text-zinc-500 hover:text-white'}`}>مهره‌های کلکسیونی</button>
                    </div>

                    {/* لیست آیتم‌ها */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-10">
                        {(storeTab === 'boards' ? VIP_BOARDS : VIP_PIECES).map((item: any, idx) => {
                            const isBoard = storeTab === 'boards';
                            const isSelected = isBoard ? settings.boardTheme === item.id : settings.pieceTheme === item.id;
                            const isCached = !!localStorage.getItem(`farzin_${isBoard?'board':'piece'}_${item.id}${!isBoard?'_wp':''}`);
                            const isDownloadingThis = isBoard ? downloadingBoard === item.id : downloadingPiece === item.id;
                            
                            return (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`bg-[#1a1916] rounded-3xl border-2 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${isSelected ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-white/5'}`}
                                >
                                    {/* بخش عکس کالا */}
                                    <div className="w-full aspect-square relative bg-[#22201d] flex items-center justify-center p-4">
                                        {isBoard ? (
                                            <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-white/10 relative">
                                                <img src={item.texture} className="w-full h-full object-cover" alt={item.name} loading="lazy" />
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/40 mix-blend-overlay"></div>
                                            </div>
                                        ) : (
                                            <img src={`https://images.chesscomfiles.com/chess-themes/pieces/${item.id}/150/wn.png`} className="w-[80%] h-[80%] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]" alt={item.name} loading="lazy" />
                                        )}
                                        
                                        {/* نشانگر دانلود/اکتیو */}
                                        <div className="absolute top-3 right-3 flex gap-1">
                                            {isSelected && <div className="bg-amber-500 text-black px-2 py-1 rounded-md text-[9px] font-black tracking-widest shadow-md">ACTIVE</div>}
                                            {isCached && !isSelected && <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md text-[9px] font-black shadow-md"><Check size={10}/></div>}
                                        </div>
                                    </div>

                                    {/* بخش اطلاعات و دکمه */}
                                    <div className="p-4 flex flex-col gap-3">
                                        <span className="font-black text-white text-sm text-center truncate">{item.name}</span>
                                        
                                        <button 
                                            onClick={() => {
                                                if (!isCached) isBoard ? handleDownloadBoardTheme(item) : handleDownloadPieceTheme(item);
                                                else updateSetting(isBoard ? 'boardTheme' : 'pieceTheme', item.id);
                                            }}
                                            disabled={isDownloadingThis}
                                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${isSelected ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : isCached ? 'bg-[#2a2824] text-white hover:bg-[#35332e]' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_5px_15px_rgba(245,158,11,0.3)]'}`}
                                        >
                                            {isDownloadingThis ? <Loader2 size={14} className="animate-spin" /> : 
                                             isSelected ? <><CheckCircle2 size={14}/> استفاده شده</> : 
                                             isCached ? 'انتخاب و استفاده' : 
                                             <><Gem size={12} fill="currentColor"/> {toPersianDigits(item.price)}</>}
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                  </div>
                )}

                {/* 🌟 تب ظاهر پایه (کلاسیک) */}
                {activeTab === 'appearance' && (
                  <div className="flex flex-col gap-6">
                    <div className="bg-[#1e1c19] pt-6 pb-4 rounded-[28px] border border-[#35332e] shadow-xl overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 px-6 text-farzin-accent"><Palette size={18} /><h2 className="font-black text-xs uppercase tracking-widest">تخته‌های پایه و سبک</h2></div>
                        <div className="flex overflow-x-auto gap-4 px-6 pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
                            {boardThemes.map(t => {
                                const isSelected = settings.boardTheme === t.id;
                                return (
                                    <motion.button key={t.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => updateSetting('boardTheme', t.id)} className={`flex-shrink-0 flex flex-col items-center gap-3 p-3 w-[110px] rounded-[20px] border-2 transition-colors snap-center ${isSelected ? 'border-farzin-accent bg-[#262421] shadow-[0_5px_15px_rgba(119,149,86,0.2)]' : 'border-transparent bg-[#161512] shadow-inner'}`}>
                                        <div className="w-16 h-16 rounded-xl shadow-md border border-black/30 overflow-hidden grid grid-cols-2 grid-rows-2 relative">
                                            <div style={{ backgroundColor: t.light }}></div><div style={{ backgroundColor: t.dark }}></div><div style={{ backgroundColor: t.dark }}></div><div style={{ backgroundColor: t.light }}></div>
                                        </div>
                                        <span className={`text-[11px] font-black truncate w-full text-center ${isSelected ? 'text-white' : 'text-zinc-500'}`}>{t.name}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="bg-[#1e1c19] pt-6 pb-4 rounded-[28px] border border-[#35332e] shadow-xl overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 px-6 text-farzin-accent"><Crown size={18} /><h2 className="font-black text-xs uppercase tracking-widest">مهره‌های پایه</h2></div>
                        <div className="flex overflow-x-auto gap-4 px-6 pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
                            {pieceThemes.map(p => {
                                const isSelected = settings.pieceTheme === p.id;
                                return (
                                    <motion.button key={p.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => updateSetting('pieceTheme', p.id)} className={`flex-shrink-0 flex flex-col items-center gap-3 p-3 w-[110px] rounded-[20px] border-2 transition-colors snap-center ${isSelected ? 'border-farzin-accent bg-[#262421] shadow-[0_5px_15px_rgba(119,149,86,0.2)]' : 'border-transparent bg-[#161512] shadow-inner'}`}>
                                        <div className="w-16 h-16 rounded-xl shadow-inner border border-[#35332e] bg-[#22201d] flex items-center justify-center p-1"><img src={`https://images.chesscomfiles.com/chess-themes/pieces/${p.id}/150/wn.png`} alt={p.name} className="w-full h-full object-contain drop-shadow-md" /></div>
                                        <span className={`text-[11px] font-black truncate w-full text-center ${isSelected ? 'text-white' : 'text-zinc-500'}`}>{p.name}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                  </div>
                )}

                {/* بقیه تب‌ها (بدون تغییر) */}
                {activeTab === 'gameplay' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                      <div className="flex items-center gap-2 mb-6 text-farzin-accent"><ShieldCheck size={18} /><h2 className="font-black text-xs uppercase tracking-widest">قوانین حرکت</h2></div>
                      <div className="space-y-2">
                          <div className="flex items-center justify-between py-3"><div className="flex flex-col"><span className="text-sm font-bold text-white">پیش‌حرکت (Premove)</span><span className="text-[10px] text-zinc-500 mt-1">حرکت قبل از نوبت حریف</span></div><Switch checked={settings.premove} onChange={(v: boolean) => updateSetting('premove', v)} /></div>
                          <div className="flex items-center justify-between py-3 border-t border-white/5"><div className="flex flex-col"><span className="text-sm font-bold text-white">تایید حرکت</span><span className="text-[10px] text-zinc-500 mt-1">دکمه تایید بعد از جابجایی</span></div><Switch checked={settings.confirmMove} onChange={(v: boolean) => updateSetting('confirmMove', v)} /></div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'engine' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#1e1c19] p-6 rounded-[28px] border border-[#35332e] shadow-xl">
                      <div className="flex items-center gap-2 mb-6 text-farzin-accent"><Activity size={18} /><h2 className="font-black text-xs uppercase tracking-widest">تحلیل گرافیکی</h2></div>
                      <div className="space-y-6">
                          <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">نوار ارزیابی (Eval Bar)</span><Switch checked={settings.evalBar} onChange={(v: boolean) => updateSetting('evalBar', v)} /></div>
                          <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">کیفیت حرکات (Brilliant/Miss)</span><Switch checked={settings.showMoveQualities} onChange={(v: boolean) => updateSetting('showMoveQualities', v)} /></div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 🌟 مودال خطای دانلود */}
      <AnimatePresence>
        {downloadErrorModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" dir="rtl">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#1e1c19] border border-rose-500/30 rounded-[32px] shadow-[0_20px_60px_rgba(225,29,72,0.3)] overflow-hidden flex flex-col items-center p-8 text-center">
                    <AlertTriangle size={56} className="text-rose-500 mb-4 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]" />
                    <h2 className="text-2xl font-black text-white mb-2">دانلود ناموفق بود!</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                        برای دانلود این آیتم ویژه به اینترنت آزاد نیاز دارید. لطفاً فیلترشکن (VPN) خود را روشن کرده و مجدداً تلاش کنید.
                    </p>
                    <button onClick={() => setDownloadErrorModal(false)} className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-2xl transition-all shadow-[0_5px_20px_rgba(225,29,72,0.4)] active:scale-95">متوجه شدم</button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}