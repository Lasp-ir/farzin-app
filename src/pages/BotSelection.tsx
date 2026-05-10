import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronRight, ShieldCheck, Cpu, BrainCircuit, Clock, ChevronDown, ChevronUp, Zap, Flame, Timer } from 'lucide-react';

const botCategories = [
  {
    id: 'beginner',
    title: 'کلاسیک (مبتدی)',
    icon: <Cpu size={18} className="text-zinc-400" />,
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
    bots: [
      { id: 'a1', name: 'استاک‌فیش ۸', rating: 1400, type: 'standard', desc: 'یک موتور قدرتمند که سطحش محدود شده تا بتونی باهاش رقابت کنی.', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Stockfish8&backgroundColor=d8b4fe' },
      { id: 'a2', name: 'کومودو', rating: 1800, type: 'standard', desc: 'کومودو عاشق بازی پوزیسیونی و بسته است. بهت اجازه نفس کشیدن نمیده!', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Komodo&backgroundColor=86efac' },
      { id: 'a3', name: 'استاک‌فیش ۱۴', rating: 2400, type: 'standard', desc: 'یک ماشین محاسباتی بی‌رحم. کوچکترین اشتباهت رو به بدترین شکل مجازات می‌کنه.', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Stock14&backgroundColor=fca5a5' },
    ]
  },
  {
    id: 'neural',
    title: 'شبکه‌های عصبی (تیم فرزین)',
    icon: <BrainCircuit size={18} className="text-[#ebecd0]" />,
    bots: [
      { id: 'n1', name: 'فرزین (آلفا)', rating: 1600, type: 'neural', desc: 'نسخه آزمایشی فرزین. بازی تهاجمی و گاهی غیرقابل پیش‌بینی داره.', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=FarzinAlpha&backgroundColor=fcd34d' },
      { id: 'n2', name: 'فرزین (انسانی)', rating: 2100, type: 'neural', desc: 'این مدل روی میلیون‌ها بازی انسانی آموزش دیده تا دقیقاً شبیه یک استادبزرگ فکر کنه.', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=FarzinHuman&backgroundColor=6ee7b7' },
      { id: 'n3', name: 'فرزین (کابوس)', rating: 2800, type: 'neural', desc: 'قوی‌ترین مدل ما. ترکیب شبکه عصبی و جستجوی درختی عمیق.', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=FarzinPro&backgroundColor=ef4444' },
    ]
  }
];

// آیکون‌های شاه برای انتخاب رنگ
const WhiteKingIcon = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8 fill-zinc-100 stroke-zinc-900 stroke-2">
    <path d="M20 80h60v10H20zM25 75l5-35 20-15 20 15 5 35z" />
    <circle cx="50" cy="20" r="8" />
  </svg>
);
const BlackKingIcon = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8 fill-zinc-800 stroke-zinc-500 stroke-2">
    <path d="M20 80h60v10H20zM25 75l5-35 20-15 20 15 5 35z" />
    <circle cx="50" cy="20" r="8" />
  </svg>
);

export default function SelectBot() {
  const navigate = useNavigate();
  const [selectedBot, setSelectedBot] = useState(botCategories[2].bots[1]);
  const [playerColor, setPlayerColor] = useState<'white' | 'random' | 'black'>('white');
  const [showOptions, setShowOptions] = useState(false);
  const [selectedTime, setSelectedTime] = useState({ label: '10 min', value: 600 });

  const timeControls = [
    { title: 'Bullet', icon: <Zap size={14} />, options: [{ l: '1 min', v: 60 }, { l: '1|1', v: 61 }, { l: '2|1', v: 121 }] },
    { title: 'Blitz', icon: <Flame size={14} />, options: [{ l: '3 min', v: 180 }, { l: '3|2', v: 182 }, { l: '5 min', v: 300 }] },
    { title: 'Rapid', icon: <Timer size={14} />, options: [{ l: '10 min', v: 600 }, { l: '15|10', v: 910 }, { l: '30 min', v: 1800 }] },
  ];

  const handleStartGame = () => {
    const safeBotData = {
      id: selectedBot.id,
      name: selectedBot.name,
      rating: selectedBot.rating,
      accuracy: selectedBot.type === 'neural' ? 'پیشرفته' : 'پایه'
    };
    navigate('/play-ai', { state: { selectedBot: safeBotData, color: playerColor, time: selectedTime.value } });
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-200 flex flex-col items-center">
      
      {/* هدر */}
      <div className="w-full max-w-2xl px-4 py-4 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white"><ChevronRight size={28} /></button>
        <h1 className="text-lg font-bold">انتخاب حریف</h1>
        <div className="w-8"></div>
      </div>

      <div className="w-full max-w-2xl px-4 pb-60 flex flex-col gap-6 mt-6">
        
        {/* ویترین حریف */}
        <div className="flex items-center gap-4 p-4 glass-panel rounded-2xl bg-[#262421]">
          <img src={selectedBot.avatar} className="w-20 h-20 rounded-xl bg-zinc-800" alt="" />
          <div className="flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {selectedBot.name} <span className="text-sm font-mono text-farzin-accent">({selectedBot.rating})</span>
            </h2>
            <p className="text-zinc-400 text-sm mt-1">{selectedBot.desc}</p>
          </div>
        </div>

        {/* لیست ربات‌ها */}
        {botCategories.map(cat => (
          <div key={cat.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold px-2">
              {cat.icon} {cat.title}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 bg-[#262421] p-4 rounded-2xl border border-white/5">
              {cat.bots.map(bot => (
                <div key={bot.id} onClick={() => setSelectedBot(bot)} className={`cursor-pointer transition-all ${selectedBot.id === bot.id ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}>
                  <img src={bot.avatar} className={`w-14 h-14 rounded-xl border-2 ${selectedBot.id === bot.id ? 'border-farzin-accent' : 'border-transparent'}`} alt="" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 بخش پایینی فیکس شده (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#161512]/95 backdrop-blur-md border-t border-white/5 z-50 flex flex-col items-center">
        <div className="w-full max-w-2xl flex flex-col gap-3">
          
          {/* نوار Options و انتخاب رنگ */}
          <div className="flex items-center justify-between">
            {/* دکمه Options */}
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 bg-[#262421] px-4 py-2 rounded-xl text-sm font-bold text-zinc-300 hover:bg-[#35332e] transition-all"
            >
              <Clock size={16} /> 
              <span>Options ({selectedTime.label})</span>
              {showOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* انتخاب رنگ (ظریف و لیچس استایل) */}
            <div className="flex items-center bg-[#262421] p-1 rounded-xl border border-white/5 shadow-inner">
               <button onClick={() => setPlayerColor('black')} className={`p-2 rounded-lg transition-all ${playerColor === 'black' ? 'bg-[#35332e] ring-1 ring-farzin-accent' : 'opacity-40'}`}>
                 <BlackKingIcon />
               </button>
               <button onClick={() => setPlayerColor('random')} className={`px-4 text-xl font-bold transition-all ${playerColor === 'random' ? 'text-white' : 'opacity-40'}`}>
                 ?
               </button>
               <button onClick={() => setPlayerColor('white')} className={`p-2 rounded-lg transition-all ${playerColor === 'white' ? 'bg-[#35332e] ring-1 ring-farzin-accent' : 'opacity-40'}`}>
                 <WhiteKingIcon />
               </button>
            </div>
          </div>

          {/* پنل بازشوی تنظیم زمان */}
          {showOptions && (
            <div className="bg-[#262421] p-4 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-2">
              <div className="flex flex-col gap-4">
                {timeControls.map(tc => (
                  <div key={tc.title} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                      {tc.icon} {tc.title}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {tc.options.map(opt => (
                        <button 
                          key={opt.l}
                          onClick={() => { setSelectedTime({ label: opt.l, value: opt.v }); setShowOptions(false); }}
                          className={`py-2 rounded-lg text-sm font-bold transition-all ${selectedTime.label === opt.l ? 'bg-farzin-accent text-white shadow-lg' : 'bg-[#1e1c19] text-zinc-400 hover:bg-[#35332e]'}`}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* دکمه شروع بازی */}
          <button 
            onClick={handleStartGame}
            className="w-full py-4 bg-farzin-accent hover:bg-[#86a566] text-white rounded-2xl font-bold text-xl transition-all shadow-[0_10px_30px_rgba(119,149,86,0.3)] active:scale-95"
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
}