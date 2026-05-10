import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronRight, ShieldCheck, Cpu, BrainCircuit, ChevronDown, Zap, Flame, Timer, Infinity as InfinityIcon, Star, Dices } from 'lucide-react';

const botCategories = [
  {
    id: 'beginner',
    title: 'کلاسیک (مبتدی)',
    icon: <Cpu size={18} className="text-zinc-400" />,
    color: 'from-zinc-500/10 to-transparent',
    heroGlow: 'rgba(161, 161, 170, 0.1)', 
    bots: [
      { id: 'b1', name: 'مارتین', rating: 250, type: 'standard', desc: 'مارتین تازه شطرنج رو یاد گرفته. خیلی اشتباه می‌کنه و بهترین حریف برای دست‌گرمیه!', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martin&backgroundColor=e5e7eb' },
      { id: 'b2', name: 'سارا', rating: 400, type: 'standard', desc: 'سارا کمی بهتر از مارتین بازی می‌کنه ولی هنوز پیاده‌هاش رو بی‌دلیل از دست میده.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=fef08a' },
      { id: 'b3', name: 'علی', rating: 700, type: 'standard', desc: 'علی می‌تونه چند حرکت جلوتر رو ببینه. باید مراقب تاکتیک‌های سادش باشی!', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali&backgroundColor=bfdbfe' },
      { id: 'b4', name: 'نورا', rating: 900, type: 'standard', desc: 'نورا خیلی با احتیاط بازی می‌کنه و دوست نداره مهره‌هاش رو فدا کنه.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nora&backgroundColor=fbcfe8' },
    ]
  },
  {
    id: 'advanced',
    title: 'کلاسیک (پیشرفته)',
    icon: <ShieldCheck size={18} className="text-blue-400" />,
    color: 'from-blue-500/10 to-transparent',
    heroGlow: 'rgba(59, 130, 246, 0.1)',
    bots: [
      { id: 'a1', name: 'استاک‌فیش ۸', rating: 1400, type: 'standard', desc: 'یک موتور قدرتمند که سطحش محدود شده تا بتونی باهاش رقابت کنی.', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Stockfish8&backgroundColor=d8b4fe' },
      { id: 'a2', name: 'کومودو', rating: 1800, type: 'standard', desc: 'کومودو عاشق بازی پوزیسیونی و بسته است. بهت اجازه نفس کشیدن نمیده!', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Komodo&backgroundColor=86efac' },
      { id: 'a3', name: 'استاک‌فیش ۱۴', rating: 2400, type: 'standard', desc: 'یک ماشین محاسباتی بی‌رحم. کوچکترین اشتباهت رو به بدترین شکل مجازات می‌کنه.', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Stock14&backgroundColor=fca5a5' },
    ]
  },
  {
    id: 'neural',
    title: 'شبکه‌های عصبی (تیم فرزین)',
    icon: <BrainCircuit size={18} className="text-farzin-accent" />,
    color: 'from-farzin-accent/10 to-transparent',
    heroGlow: 'rgba(119, 149, 86, 0.15)',
    bots: [
      { id: 'n1', name: 'فرزین (آلفا)', rating: 1600, type: 'neural', desc: 'نسخه آزمایشی فرزین. بازی تهاجمی و گاهی غیرقابل پیش‌بینی داره.', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=FarzinAlpha&backgroundColor=fcd34d' },
      { id: 'n2', name: 'فرزین (انسانی)', rating: 2100, type: 'neural', desc: 'این مدل روی میلیون‌ها بازی انسانی آموزش دیده تا دقیقاً شبیه یک استادبزرگ فکر کنه.', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=FarzinHuman&backgroundColor=6ee7b7' },
      { id: 'n3', name: 'فرزین (کابوس)', rating: 2800, type: 'neural', desc: 'قوی‌ترین مدل ما. ترکیب شبکه عصبی و جستجوی درختی عمیق.', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=FarzinPro&backgroundColor=ef4444' },
    ]
  }
];

export default function BotSelection() {
  const navigate = useNavigate();
  const [selectedBot, setSelectedBot] = useState(botCategories[2].bots[1]);
  const [selectedCategory, setSelectedCategory] = useState(botCategories[2]);
  const [playerColor, setPlayerColor] = useState<'white' | 'random' | 'black'>('white');
  const [showOptions, setShowOptions] = useState(false);
  
  // 🔥 اضافه شدن فیلد catId برای تشخیص دینامیک آیکون
  const [selectedTime, setSelectedTime] = useState({ label: '۱۰ دقیقه', value: 600, inc: 0, catId: 'rapid' });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const updateSelectedBot = (bot: any) => {
    setSelectedBot(bot);
    const category = botCategories.find(cat => cat.bots.some(b => b.id === bot.id));
    if (category) setSelectedCategory(category);
  };

  const timeControls = [
    { id: 'bullet', title: 'بولت', icon: <Zap size={16} className="text-amber-400 drop-shadow-md" />, options: [{ l: '۱ دقیقه', v: 60, inc: 0 }, { l: '۱ | ۱', v: 60, inc: 1 }, { l: '۲ | ۱', v: 120, inc: 1 }] },
    { id: 'blitz', title: 'بلیتس', icon: <Flame size={16} className="text-rose-400 drop-shadow-md" />, options: [{ l: '۳ دقیقه', v: 180, inc: 0 }, { l: '۳ | ۲', v: 180, inc: 2 }, { l: '۵ دقیقه', v: 300, inc: 0 }] },
    { id: 'rapid', title: 'رپید', icon: <Timer size={16} className="text-emerald-400 drop-shadow-md" />, options: [{ l: '۱۰ دقیقه', v: 600, inc: 0 }, { l: '۱۵ | ۱۰', v: 900, inc: 10 }, { l: '۳۰ دقیقه', v: 1800, inc: 0 }] },
  ];

  const handleStartGame = () => {
    const safeBotData = { id: selectedBot.id, name: selectedBot.name, rating: selectedBot.rating, accuracy: selectedBot.type === 'neural' ? 'پیشرفته' : 'پایه' };
    navigate('/play-ai', { state: { selectedBot: safeBotData, color: playerColor, time: selectedTime.value, increment: selectedTime.inc } });
  };

  // 🔥 فانکشن برای رندر آیکون اصلی بر اساس دسته‌بندی انتخاب شده
  const renderSelectedTimeIcon = () => {
    if (selectedTime.value === 0) return <InfinityIcon size={18} className="text-zinc-400" />;
    switch (selectedTime.catId) {
      case 'bullet': return <Zap size={18} className="text-amber-400 drop-shadow-sm" />;
      case 'blitz': return <Flame size={18} className="text-rose-400 drop-shadow-sm" />;
      case 'rapid': return <Timer size={18} className="text-emerald-400 drop-shadow-sm" />;
      default: return <Timer size={18} className="text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center">
      
      {/* Header */}
      <div className={`w-full max-w-2xl px-4 py-4 flex items-center justify-between transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90"><ChevronRight size={28} /></button>
        <h1 className="text-lg font-bold tracking-tight">انتخاب حریف</h1>
        <div className="w-8"></div>
      </div>

      <div className="w-full max-w-2xl px-4 pb-64 flex flex-col gap-6 mt-2 relative">
        
        {/* باکس Hero پین شده */}
        <div 
          className={`sticky top-4 z-40 relative group p-[1px] transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ perspective: '1500px' }}
        >
            <div 
                className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-[23px] bg-[#1e1c19] relative overflow-hidden transition-all duration-500 ease-out shadow-2xl border border-[#35332e] group-hover:border-[#52525b] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]
                    group-hover:[transform:rotateX(2deg)_rotateY(-2deg)]"
                style={{
                   backgroundImage: `
                     radial-gradient(circle at center, transparent 0%, #1a1916 100%),
                     repeating-conic-gradient(rgba(38, 36, 33, 0.6) 0% 25%, transparent 25% 50%)
                   `,
                   backgroundSize: '100% 100%, 32px 32px',
                   boxShadow: `0 20px 40px -10px rgba(0,0,0,0.8), inset 0 0 80px -10px ${selectedCategory.heroGlow}`
                }}
            >
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -mr-16 -mt-16 transition-colors duration-1000" style={{ backgroundColor: selectedCategory.heroGlow }}></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[40px] -ml-10 -mb-10 transition-colors duration-1000" style={{ backgroundColor: selectedCategory.heroGlow }}></div>

                <div className="relative shrink-0 animate-float z-10 p-1 rounded-2xl bg-[#262421] border border-[#35332e] shadow-lg">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-zinc-900 border border-[#35332e]">
                        <img src={selectedBot.avatar} className="w-full h-full object-cover" alt="" />
                    </div>
                </div>

                <div className="flex flex-col flex-1 z-10 text-center md:text-right">
                    <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                        <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-md">{selectedBot.name}</h2>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161512] rounded-lg border border-[#35332e] shadow-inner">
                            <Star size={13} className="text-farzin-accent fill-farzin-accent" />
                            <span className="text-[13px] font-mono font-bold text-farzin-accent">{selectedBot.rating}</span>
                        </div>
                    </div>
                    
                    <div className="relative p-3.5 rounded-xl bg-[#161512] border border-[#35332e] text-zinc-300 text-[13px] leading-relaxed italic shadow-inner animate-in fade-in duration-1000">
                        <div className="absolute top-0 md:top-1/2 md:-translate-y-1/2 right-1/2 md:right-[-6px] translate-x-1/2 md:translate-x-0 w-3 h-3 bg-[#161512] border-t border-r md:border-t md:border-r border-[#35332e] transform rotate-45 -translate-y-1 md:translate-y-0"></div>
                        <span className="relative z-10">"{selectedBot.desc}"</span>
                    </div>
                </div>
            </div>
        </div>

        {/* لیست دسته‌بندی‌ها */}
        <div className="flex flex-col gap-8 mt-2">
          {botCategories.map((cat, catIdx) => (
            <div key={cat.id} 
              className={`flex flex-col gap-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${catIdx * 150}ms` }}
            >
              <div className="flex items-center gap-3 text-zinc-400 text-sm font-black px-2 uppercase tracking-widest">
                <span className="p-1.5 rounded-lg bg-[#262421] border border-[#35332e]">{cat.icon}</span>
                {cat.title}
              </div>

              <div className={`grid grid-cols-4 sm:grid-cols-6 gap-4 p-5 bg-gradient-to-b ${cat.color} rounded-[28px] border border-[#35332e] shadow-inner`}>
                {cat.bots.map((bot) => {
                  const isSelected = selectedBot.id === bot.id;
                  return (
                    <div 
                      key={bot.id} 
                      onClick={() => updateSelectedBot(bot)}
                      className={`group relative flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${isSelected ? 'scale-110 z-20' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
                    >
                      {isSelected && (
                          <div className="absolute inset-0 bg-farzin-accent/20 blur-xl rounded-full scale-125 animate-pulse"></div>
                      )}
                      
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 transition-all duration-300 relative shadow-xl
                        ${isSelected ? 'border-farzin-accent shadow-[0_0_15px_rgba(119,149,86,0.4)]' : 'border-[#35332e] group-hover:border-zinc-500'}
                      `}>
                        <img src={bot.avatar} className="w-full h-full object-cover bg-zinc-900" alt={bot.name} />
                      </div>
                      <span className={`text-[10px] md:text-xs font-bold truncate w-full text-center transition-colors ${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                          {bot.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* منوی پایین ثابت با پس زمینه سالید */}
      <div className={`fixed bottom-0 left-0 right-0 p-5 bg-[#161512] border-t border-[#35332e] z-50 flex flex-col items-center transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0' : 'translate-y-full'} shadow-[0_-10px_40px_rgba(0,0,0,0.5)]`}>
        <div className="w-full max-w-2xl flex flex-col gap-4">
          
          <div className="flex items-center justify-between gap-3">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="flex-1 flex items-center justify-between bg-[#1e1c19] px-5 py-3.5 rounded-[18px] text-sm font-bold text-zinc-300 hover:bg-[#262421] transition-all border border-[#35332e] active:scale-95 shadow-inner"
            >
              <div className="flex items-center gap-3">
                {/* 🔥 باکس آیکون دینامیک */}
                <div className="w-8 h-8 rounded-lg bg-[#161512] flex items-center justify-center border border-[#35332e]">
                    {renderSelectedTimeIcon()}
                </div>
                <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">فرمت بازی</span>
                    <span dir="ltr" className="font-bold text-right">{selectedTime.label}</span>
                </div>
              </div>
              <div className={`transition-transform duration-300 ${showOptions ? 'rotate-180' : ''}`}>
                 <ChevronDown size={20} className="text-zinc-500" />
              </div>
            </button>

            <div className="flex items-center gap-1.5 bg-[#1e1c19] p-2 rounded-[18px] border border-[#35332e] shadow-inner">
               <button 
                 onClick={() => setPlayerColor('white')} 
                 className={`w-12 h-11 flex items-center justify-center rounded-xl transition-all duration-200 ${playerColor === 'white' ? 'bg-[#35332e] ring-2 ring-farzin-accent/50 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
               >
                 <span className="text-[32px] leading-none drop-shadow-sm select-none pb-1" style={{ color: '#fff', WebkitTextStroke: '1.5px #666' }}>♟</span>
               </button>
               <button 
                 onClick={() => setPlayerColor('random')} 
                 className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 ${playerColor === 'random' ? 'bg-[#35332e] ring-2 ring-farzin-accent/50 text-white' : 'text-zinc-500 opacity-40 hover:opacity-100'}`}
               >
                  <Dices size={24} />
               </button>
               <button 
                 onClick={() => setPlayerColor('black')} 
                 className={`w-12 h-11 flex items-center justify-center rounded-xl transition-all duration-200 ${playerColor === 'black' ? 'bg-[#35332e] ring-2 ring-farzin-accent/50 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
               >
                 <span className="text-[32px] leading-none drop-shadow-sm select-none pb-1" style={{ color: '#000', WebkitTextStroke: '1.5px #888' }}>♟</span>
               </button>
            </div>
          </div>

          <div className={`w-full overflow-hidden transition-all duration-400 ease-in-out ${showOptions ? 'max-h-[600px] opacity-100 mb-2 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="bg-[#1e1c19] p-5 rounded-[24px] border border-[#35332e] shadow-2xl space-y-6">
              <button
                onClick={() => { setSelectedTime({ label: 'بدون محدودیت', value: 0, inc: 0, catId: 'infinite' }); setShowOptions(false); }}
                className={`w-full py-4 rounded-[18px] text-[14px] font-bold transition-all border flex items-center justify-center gap-3 ${selectedTime.value === 0 ? 'bg-farzin-accent text-white shadow-[0_4px_15px_rgba(119,149,86,0.3)] border-transparent' : 'bg-[#262421] text-zinc-300 hover:bg-[#35332e] border-[#35332e] hover:border-[#52525b]'}`}
              >
                <InfinityIcon size={20} /> بدون محدودیت زمانی
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                {timeControls.map(tc => (
                  <div key={tc.id} className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-2 text-zinc-300 text-[11px] font-black uppercase tracking-widest pl-1 border-b border-[#35332e] pb-2">
                      {tc.icon} {tc.title}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {tc.options.map(opt => (
                        <button 
                          key={opt.l}
                          onClick={() => { setSelectedTime({ label: opt.l, value: opt.v, inc: opt.inc, catId: tc.id }); setShowOptions(false); }}
                          className={`py-3 rounded-xl text-[13px] transition-all border flex items-center justify-center ${selectedTime.label === opt.l ? 'bg-farzin-accent text-white shadow-[0_4px_15px_rgba(119,149,86,0.3)] border-transparent' : 'bg-[#262421] text-zinc-300 hover:bg-[#35332e] border-[#35332e] hover:border-[#52525b]'}`}
                        >
                          <span dir="ltr" className="font-bold tracking-widest">{opt.l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleStartGame}
            className="w-full py-5 bg-farzin-accent hover:bg-[#86a566] text-white rounded-[22px] font-black text-xl transition-all duration-300 shadow-[0_15px_40px_-10px_rgba(119,149,86,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(119,149,86,0.5)] active:scale-[0.97] flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span className="relative z-10 uppercase tracking-widest">تایید و شروع بازی</span>
            <Play size={24} className="relative z-10 transition-transform group-hover:scale-125" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}