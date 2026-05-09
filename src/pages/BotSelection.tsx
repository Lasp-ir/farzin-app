import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Cpu, Zap, Activity, Shield, ChevronLeft } from 'lucide-react';

const bots = [
  {
    id: 'bot_easy',
    name: 'شبیه‌ساز (مبتدی)',
    rating: 800,
    type: 'standard',
    icon: <Cpu size={28} className="text-zinc-400" />,
    description: 'یک موتور شطرنج ساده با حرکات تصادفی و خطاهای انسانی بالا.',
    color: 'from-[#35332e] to-[#262421]',
    glow: 'hover:shadow-[#35332e]/50 hover:border-[#45433e]'
  },
  {
    id: 'bot_medium',
    name: 'استاک‌فیش (متوسط)',
    rating: 1500,
    type: 'standard',
    icon: <Shield size={28} className="text-blue-400" />,
    description: 'موتور قدرتمند شطرنج با محدودیت محاسبه. سبکی کاملاً ماشینی و دقیق.',
    color: 'from-[#2e3e50] to-[#1c2836]',
    glow: 'hover:shadow-blue-500/20 hover:border-blue-500/30'
  },
  {
    id: 'farzin_alpha',
    name: 'فرزین (نسخه آلفا)',
    rating: 1800,
    type: 'neural',
    icon: <Zap size={28} className="text-amber-500" />,
    description: 'هوش مصنوعی مبتنی بر شبکه عصبی. دارای سبک بازی تهاجمی و غیرقابل پیش‌بینی.',
    color: 'from-[#5e3a1f] to-[#3a200d]',
    glow: 'hover:shadow-amber-600/20 hover:border-amber-600/30'
  },
  {
    id: 'farzin_pro',
    name: 'فرزین (مدل انسانی)',
    rating: 2400,
    type: 'neural',
    icon: <Brain size={28} className="text-[#ebecd0]" />,
    description: 'مدل پیشرفته فرزین که بر روی میلیون‌ها بازی انسانی آموزش دیده است.',
    color: 'from-[#779556] to-[#4c6331]',
    glow: 'ai-glow' 
  }
];

export default function SelectBot() {
  const navigate = useNavigate();
  const [selectedBot, setSelectedBot] = useState(bots[3]);

  const handleStartGame = () => {
    const { icon, ...safeBotData } = selectedBot;
    navigate('/play-ai', { state: { selectedBot: safeBotData } });
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-200 p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      {/* هاله‌های نوری کلاسیک در پس‌زمینه */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#779556]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ebecd0]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl w-full z-10 flex flex-col pt-8">
        
        {/* هدر صفحه */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-farzin-accent/10 border border-farzin-accent/20 text-farzin-glow text-sm font-bold mb-4">
            <Activity size={16} className="animate-pulse" />
            سیستم انتخاب حریف
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
            نبرد با <span className="text-farzin-accent">هوش مصنوعی</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            رقیب خود را انتخاب کنید. از موتورهای کلاسیک تا شبکه‌های عصبی پیشرفته فرزین که الگوهای انسانی را شبیه‌سازی می‌کنند.
          </p>
        </div>

        {/* گرید انتخاب ربات‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {bots.map((bot, index) => (
            <div 
              key={bot.id}
              onClick={() => setSelectedBot(bot)}
              className={`relative cursor-pointer glass-panel rounded-2xl p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 flex flex-col h-full
                ${selectedBot.id === bot.id ? 'border-farzin-accent/60 shadow-[0_0_20px_rgba(119,149,86,0.15)] transform -translate-y-2' : `border-farzin-border ${bot.glow}`}
              `}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* خط بالایی کارت (نشانگر انتخاب) */}
              {selectedBot.id === bot.id && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-farzin-accent to-transparent rounded-full shadow-[0_0_10px_rgba(119,149,86,0.8)]"></div>
              )}

              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br border border-white/5 ${bot.color} ${bot.type === 'neural' ? 'animate-pulse-glow' : ''}`}>
                  {bot.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white leading-tight">{bot.name}</h3>
                  <div className="text-farzin-glow font-mono font-bold text-sm mt-1">ELO: {bot.rating}</div>
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1">
                {bot.description}
              </p>

              {/* تگ‌های پایین کارت */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-farzin-border">
                <span className={`text-[10px] px-2 py-1 rounded-md border font-bold tracking-wider
                  ${bot.type === 'neural' ? 'bg-farzin-accent/10 text-farzin-glow border-farzin-accent/20' : 'bg-[#1e1c19] text-zinc-400 border-[#35332e]'}
                `}>
                  {bot.type === 'neural' ? 'NEURAL NET' : 'CLASSIC ENGINE'}
                </span>
                
                {/* رادیو باتن کاستوم */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${selectedBot.id === bot.id ? 'border-farzin-accent' : 'border-zinc-600'}
                `}>
                  {selectedBot.id === bot.id && <div className="w-2.5 h-2.5 bg-farzin-accent rounded-full animate-in zoom-in"></div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* دکمه شروع بازی */}
        <div className="flex justify-center mt-auto pb-10 animate-in fade-in duration-1000 delay-500">
          <button 
            onClick={handleStartGame}
            className="group relative px-8 py-4 bg-farzin-accent hover:bg-[#86a566] text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(119,149,86,0.3)] hover:shadow-[0_0_30px_rgba(119,149,86,0.5)] active:scale-95 flex items-center gap-3 overflow-hidden border border-[#86a566]"
          >
            {/* افکت نوری رد شونده */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
            
            <span>شروع مسابقه</span>
            <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}