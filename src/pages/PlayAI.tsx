import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ترفند تایپ‌اسکریپت برای React 18
const Board = Chessboard as any;

export default function PlayAI() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [fen, setFen] = useState("start");

  async function onDrop(sourceSquare: string, targetSquare: string) {
    try {
      const response = await fetch("http://127.0.0.1:8000/validate_move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: fen,
          source: sourceSquare,
          target: targetSquare
        })
      });

      const data = await response.json();

      if (data.valid) {
        setFen(data.fen);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Connection error:", error);
      return false;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4">
      {/* هدر صفحه و دکمه برگشت */}
      <div className="flex items-center mb-6 pt-2">
        <button 
          onClick={() => navigate('/home')} 
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
        >
          {/* جهت فلش بر اساس زبان برنامه تغییر می‌کند */}
          {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
        <h1 className="text-xl font-bold mx-4">{t('home.play_ai')}</h1>
      </div>

      {/* کانتینر اصلی تخته شطرنج */}
      <div className="flex-1 flex flex-col items-center justify-center pb-12">
        <div className="w-full max-w-[500px] shadow-2xl shadow-black/60 rounded-lg overflow-hidden border border-gray-700/50">
          <Board 
            position={fen} 
            onPieceDrop={onDrop}
            customDarkSquareStyle={{ backgroundColor: '#4b7399' }}
            customLightSquareStyle={{ backgroundColor: '#eae9d2' }}
          />
        </div>
        
        {/* این بخش در آینده پنل اطلاعات بازی خواهد شد */}
        <div className="mt-8 bg-gray-800 px-6 py-3 rounded-full border border-gray-700 shadow-lg">
          <p className="text-sm text-gray-400">وضعیت: متصل به سرور محلی Python 🟢</p>
        </div>
      </div>
    </div>
  );
}