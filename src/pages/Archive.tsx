import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, Search, Filter, Trophy, Target, Globe, Bot } from 'lucide-react';

export default function Archive() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, FARZIN, ONLINE

  // دیتای آزمایشی (بعداً از دیتابیس یا API لیچس خوانده می‌شود)
  const mockGames = [
    { id: 1, opponent: 'شبیه‌ساز (Lichess Master)', result: 'L', date: 'امروز', platform: 'Farzin', accuracy: '۶۲٪', moves: 42 },
    { id: 2, opponent: 'Amir_Kasparov88', result: 'W', date: 'دیروز', platform: 'Lichess', accuracy: '۸۵٪', moves: 31 },
    { id: 3, opponent: 'شبیه‌ساز (مبتدی)', result: 'W', date: 'دیروز', platform: 'Farzin', accuracy: '۹۱٪', moves: 24 },
    { id: 4, opponent: 'MagnusFan_12', result: 'D', date: '۳ روز پیش', platform: 'Chess.com', accuracy: '۷۸٪', moves: 56 },
  ];

  // فیلتر کردن بازی‌ها بر اساس تب انتخاب شده
  const filteredGames = mockGames.filter(game => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'FARZIN') return game.platform === 'Farzin';
    if (activeTab === 'ONLINE') return game.platform !== 'Farzin';
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4 pb-10">
      {/* هدر */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/home')} 
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
          >
            {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
          </button>
          <h1 className="text-2xl font-bold mx-4">تاریخچه بازی‌ها</h1>
        </div>
        <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-blue-400">
          <Search size={20} />
        </button>
      </div>

      <div className="max-w-lg mx-auto w-full">
        {/* تب‌های فیلتر */}
        <div className="flex bg-gray-800 p-1 rounded-xl mb-6 shadow-lg border border-gray-700/50">
          {['ALL', 'FARZIN', 'ONLINE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'ALL' ? 'همه' : tab === 'FARZIN' ? 'فرزین (آفلاین)' : 'آنلاین'}
            </button>
          ))}
        </div>

        {/* لیست بازی‌ها */}
        <div className="flex flex-col gap-3">
          {filteredGames.map((game) => {
            const isWin = game.result === 'W';
            const isLoss = game.result === 'L';
            const isDraw = game.result === 'D';

            return (
              <div 
                key={game.id}
                onClick={() => alert('ورود به صفحه Game Review (آنالیز حرکت به حرکت)')}
                className="bg-gray-800 p-4 rounded-2xl border border-gray-700 hover:border-gray-500 transition-all cursor-pointer shadow-md flex items-center"
              >
                {/* نوار رنگی نتیجه */}
                <div className={`w-1.5 h-12 rounded-full mr-3 ml-3 shrink-0 ${
                  isWin ? 'bg-green-500' : isLoss ? 'bg-red-500' : 'bg-gray-500'
                }`} />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-100 truncate w-40">{game.opponent}</h3>
                    <span className="text-xs text-gray-400">{game.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-medium">
                    {/* نوع پلتفرم */}
                    <div className="flex items-center gap-1 text-gray-400">
                      {game.platform === 'Farzin' ? <Bot size={12} className="text-teal-400"/> : <Globe size={12} className="text-blue-400"/>}
                      <span>{game.platform}</span>
                    </div>
                    {/* دقت بازی */}
                    <div className="flex items-center gap-1 text-gray-400">
                      <Target size={12} className="text-amber-400"/>
                      <span>دقت: {game.accuracy}</span>
                    </div>
                  </div>
                </div>

                {/* آیکون نتیجه در سمت چپ/راست */}
                <div className="mx-2 shrink-0">
                  {isWin && <div className="bg-green-500/20 text-green-400 p-2 rounded-xl"><Trophy size={20} /></div>}
                  {isLoss && <div className="bg-red-500/20 text-red-400 p-2 rounded-xl font-bold text-lg">0</div>}
                  {isDraw && <div className="bg-gray-500/20 text-gray-400 p-2 rounded-xl font-bold text-lg">½</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}