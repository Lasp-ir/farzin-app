import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronRight, ShieldCheck, Cpu, BrainCircuit } from 'lucide-react';

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

export default function SelectBot() {
  const navigate = useNavigate();
  const [selectedBot, setSelectedBot] = useState(botCategories[2].bots[1]);
  // 🔥 استیت برای انتخاب رنگ کاربر
  const [playerColor, setPlayerColor] = useState<'white' | 'random' | 'black'>('white');

  const handleStartGame = () => {
    const safeBotData = {
      id: selectedBot.id,
      name: selectedBot.name,
      rating: selectedBot.rating,
      accuracy: selectedBot.type === 'neural' ? 'پیشرفته' : 'پایه'
    };
    // رنگ رو هم به صفحه بازی ارسال می‌کنیم
    navigate('/play-ai', { state: { selectedBot: safeBotData, color: playerColor } });
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-200 flex flex-col items-center">
      
      <div className="w-full max-w-2xl px-4 py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-[#262421] rounded-xl">
          <ChevronRight size={24} />
        </button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
           بازی با ربات‌ها
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-2xl px-4 pb-40 flex flex-col gap-6 animate-in fade-in duration-500">
        
        <div className="flex items-start gap-4 p-5 glass-panel rounded-2xl bg-[#262421] border border-[#35332e] shadow-lg">
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-zinc-800 shadow-inner border border-[#35332e]">
              <img src={selectedBot.avatar} alt={selectedBot.name} className="w-full h-full object-cover" />
            </div>
            {selectedBot.type === 'neural' && (
              <div className="absolute -bottom-2 -right-2 bg-farzin-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md border border-[#86a566]">PRO</div>
            )}
          </div>
          
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-xl font-bold text-white">{selectedBot.name}</h2>
              <span className="text-sm font-mono text-[#b0aba2] bg-[#1e1c19] px-2 py-0.5 rounded-md border border-[#35332e]">
                {selectedBot.rating}
              </span>
            </div>
            
            <div className="relative mt-2 p-3 bg-[#1e1c19] rounded-xl rounded-tr-none border border-[#35332e] text-zinc-300 text-sm leading-relaxed shadow-inner">
               <div className="absolute top-0 right-[-6px] w-3 h-3 bg-[#1e1c19] border-t border-r border-[#35332e] transform rotate-45 -translate-y-[1px]"></div>
               <span className="relative z-10">{selectedBot.desc}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 mt-2">
          {botCategories.map((category) => (
            <div key={category.id} className="flex flex-col">
              <div className="flex items-center justify-between px-2 mb-3">
                <div className="flex items-center gap-2 text-zinc-300 font-bold">
                  {category.icon}
                  <h3>{category.title}</h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">{category.bots.length} ربات</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 p-4 bg-[#262421] border border-[#35332e] rounded-2xl shadow-sm">
                {category.bots.map((bot) => {
                  const isSelected = selectedBot.id === bot.id;
                  return (
                    <div 
                      key={bot.id} 
                      onClick={() => setSelectedBot(bot)}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className={`w-14 h-14 rounded-xl overflow-hidden transition-all duration-200 relative
                        ${isSelected ? 'ring-2 ring-farzin-accent ring-offset-2 ring-offset-[#262421] scale-105 shadow-lg' : 'border border-[#35332e] hover:border-zinc-500 hover:scale-105 opacity-80 hover:opacity-100'}
                      `}>
                        <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover bg-zinc-800" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-farzin-accent/10"></div>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold truncate w-full text-center transition-colors
                        ${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}
                      `}>
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#161512] via-[#161512] to-transparent z-50 flex justify-center pb-8 pt-16">
        <div className="w-full max-w-2xl px-4 flex flex-col gap-4">
          
          {/* 🔥 نوار انتخاب رنگ */}
          <div className="flex items-center justify-between bg-[#1e1c19] p-1.5 rounded-2xl border border-[#35332e] shadow-lg">
            <span className="text-zinc-400 text-sm font-bold ml-2 pr-3">بازی با مهره:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPlayerColor('black')}
                className={`w-14 h-12 flex items-center justify-center rounded-xl text-3xl pb-1 transition-all duration-300 ${playerColor === 'black' ? 'bg-[#262421] text-zinc-100 shadow-sm border border-[#35332e]' : 'text-zinc-600 hover:text-zinc-400'}`}
                title="سیاه"
              >♚</button>
              <button
                onClick={() => setPlayerColor('random')}
                className={`w-14 h-12 flex items-center justify-center rounded-xl text-2xl font-bold transition-all duration-300 ${playerColor === 'random' ? 'bg-[#35332e] text-white shadow-sm border border-[#45433e]' : 'text-zinc-600 hover:text-zinc-400'}`}
                title="تصادفی"
              >?</button>
              <button
                onClick={() => setPlayerColor('white')}
                className={`w-14 h-12 flex items-center justify-center rounded-xl text-3xl pb-1 transition-all duration-300 ${playerColor === 'white' ? 'bg-zinc-200 text-zinc-900 shadow-sm border border-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                title="سفید"
              >♔</button>
            </div>
          </div>

          <button 
            onClick={handleStartGame}
            className="w-full py-4 bg-farzin-accent hover:bg-[#86a566] text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_5px_20px_rgba(119,149,86,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 border border-[#86a566]"
          >
            شروع مسابقه
            <Play size={20} fill="currentColor" />
          </button>
        </div>
      </div>

    </div>
  );
}