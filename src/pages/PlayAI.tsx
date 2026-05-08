import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Flag, Handshake, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Board = Chessboard as any;

export default function PlayAI() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // گرفتن اطلاعات ربات انتخاب شده از صفحه قبل (اگر از لیست ربات‌ها آمده باشد)
  const opponent = location.state?.selectedBot || { name: 'شبیه‌ساز (مبتدی)', rating: 1200, accuracy: 'پایه' };

  const [fen, setFen] = useState("start");
  const [playerTimer, setPlayerTimer] = useState(600); // 10 دقیقه به ثانیه
  const [opponentTimer, setOpponentTimer] = useState(600);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // فرمت کردن زمان (ثانیه به دقیقه:ثانیه)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // شبیه‌سازی تایمر ساده (فقط برای نمایش)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlayerTurn && playerTimer > 0) setPlayerTimer(p => p - 1);
      if (!isPlayerTurn && opponentTimer > 0) setOpponentTimer(p => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayerTurn, playerTimer, opponentTimer]);

  async function onDrop(sourceSquare: string, targetSquare: string) {
    // اگر نوبت بازیکن نبود، اجازه حرکت نده
    if (!isPlayerTurn) return false;

    try {
      const response = await fetch("http://127.0.0.1:8000/validate_move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen, source: sourceSquare, target: targetSquare })
      });

      const data = await response.json();

      if (data.valid) {
        setFen(data.fen);
        setIsPlayerTurn(false); // نوبت را به ربات بده
        
        // شبیه‌سازی حرکت ربات (در واقعیت باید درخواست به موتور پایتون برود تا ربات حرکت کند)
        setTimeout(() => {
             // اینجا منطق واقعی ربات فرزین قرار می‌گیرد که FEN جدید را از پایتون می‌گیرد
             // فعلاً برای دمو فقط نوبت را برمی‌گردانیم
             setIsPlayerTurn(true); 
        }, 1500);

        return true;
      }
      return false;
    } catch (error) {
      console.error("Connection error:", error);
      return false;
    }
  }

  // کامپوننت داخلی برای نمایش پروفایل و تایمر
  const PlayerInfo = ({ name, rating, time, isOpponent, isActive, accuracy }: any) => (
    <div className={`flex items-center justify-between p-3 rounded-xl mb-2 mt-2 bg-gray-800 border ${isActive ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-gray-700'} transition-all`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${isOpponent ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'}`}>
           {name.charAt(0)}
        </div>
        <div>
          <div className="font-bold text-gray-100 flex items-center gap-2">
            {name} 
            {isOpponent && accuracy && accuracy !== 'پایه' && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                   <Zap size={10} /> PRO
                </span>
            )}
          </div>
          <div className="text-sm text-gray-400">ریتیگ: {rating}</div>
        </div>
      </div>
      <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-900 text-gray-300'}`}>
        {formatTime(time)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      
      {/* هدر بالایی شبیه لیچس */}
      <div className="flex items-center justify-between p-4 bg-gray-800/80 border-b border-gray-700 shadow-sm backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate(-1)} 
             className="text-gray-400 hover:text-white transition-colors"
           >
             {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
           </button>
           <span className="font-bold text-gray-200">کلاسیک ۱۰+۰</span>
        </div>
        <div className="flex gap-4">
            <button className="text-gray-400 hover:text-white" title="پیشنهاد تساوی"><Handshake size={20} /></button>
            <button className="text-gray-400 hover:text-red-400" title="تسلیم شدن"><Flag size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        
        {/* اطلاعات حریف (بالا) */}
        <div className="w-full">
            <PlayerInfo 
                name={opponent.name} 
                rating={opponent.rating} 
                time={opponentTimer} 
                isOpponent={true} 
                isActive={!isPlayerTurn}
                accuracy={opponent.accuracy}
            />
        </div>

        {/* تخته شطرنج */}
        <div className="w-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded border border-gray-700/50 overflow-hidden relative">
          <Board 
            position={fen} 
            onPieceDrop={onDrop}
            animationDuration={200} // انیمیشن نرم‌تر حرکت مهره‌ها
            customDarkSquareStyle={{ backgroundColor: '#779556' }} // رنگ سبز کلاسیک چس‌دات‌کام/لیچس
            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
          />
        </div>

        {/* اطلاعات بازیکن (پایین) */}
        <div className="w-full">
            <PlayerInfo 
                name="کاربر شما" 
                rating={1500} 
                time={playerTimer} 
                isOpponent={false} 
                isActive={isPlayerTurn}
            />
        </div>

        {/* نوار کنترل حرکات (عقب/جلو بردن در حین بازی) */}
        <div className="flex items-center justify-center gap-6 mt-6 bg-gray-800 w-full py-3 rounded-2xl border border-gray-700">
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"><ChevronRight size={28} /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"><ChevronLeft size={28} /></button>
        </div>

      </div>
    </div>
  );
}