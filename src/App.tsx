import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

function App() {
  const [game, setGame] = useState(new Chess());

  // با قرار دادن any، خطای تایپ‌اسکریپت react-chessboard در VS Code برطرف می‌شود
  function onDrop(sourceSquare: any, targetSquare: any) {
    const gameCopy = new Chess(game.fen());
    
    // پیدا کردن مهره‌ای که کاربر کشیده است
    const piece = gameCopy.get(sourceSquare);
    
    // تشخیص اینکه آیا این حرکت، ارتقاء یک سرباز به خانه آخر است یا خیر؟
    const isPromotion = piece && piece.type === 'p' && 
                       ((piece.color === 'w' && targetSquare.charAt(1) === '8') || 
                        (piece.color === 'b' && targetSquare.charAt(1) === '1'));
    
    try {
      // انجام حرکت به صورت کاملا ایمن
      gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        ...(isPromotion && { promotion: 'q' }) // پارامتر ارتقاء فقط در صورت نیاز ارسال می‌شود
      });
      
      setGame(gameCopy);
      return true; // حرکت موفق بود
    } catch (e) {
      // حرکت غیرقانونی است (مثل حرکت دادن فیل در مسیر مستقیم)
      return false; 
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Farzin Web App</h1>
      
      <div className="w-full max-w-[500px] shadow-2xl rounded-lg overflow-hidden">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          customDarkSquareStyle={{ backgroundColor: '#4b7399' }}
          customLightSquareStyle={{ backgroundColor: '#eae9d2' }}
        />
      </div>
      
      <p className="mt-6 text-gray-400">تخته آماده است! یک حرکت انجام دهید.</p>
    </div>
  );
}

export default App;