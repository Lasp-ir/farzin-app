import React, { useEffect, useState } from 'react';
import { Loader2, Database, AlertCircle } from 'lucide-react';

interface OpeningExplorerProps {
  fen: string;
  onMoveSelect: (uci: string) => void;
}

interface MoveStats {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
}

interface ExplorerData {
  white: number;
  draws: number;
  black: number;
  moves: MoveStats[];
}

export default function OpeningExplorer({ fen, onMoveSelect }: OpeningExplorerProps) {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    // اتصال مستقیم به دیتابیس بازیکنان لیچس (Lichess Community)
    // برای سرعت بیشتر، درخواست رو فقط برای بازی‌های استاندارد می‌فرستیم
    fetch(`https://explorer.lichess.ovh/lichess?variant=standard&fen=${encodeURIComponent(fen)}`)
      .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
      })
      .then(fetchedData => {
        if (isMounted) {
          setData(fetchedData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    // Cleanup function برای جلوگیری از Memory Leak هنگام ورق زدن سریع حرکات
    return () => { isMounted = false; };
  }, [fen]);

  // فرمت‌بندی اعداد میلیونی و هزارتایی برای تمیزی UI
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-purple-500/50 gap-3">
              <Loader2 size={28} className="animate-spin text-purple-500" />
              <span className="text-xs font-sans text-zinc-400">در حال اتصال به دیتابیس...</span>
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-red-500/50 gap-3">
              <AlertCircle size={28} />
              <span className="text-xs font-sans text-zinc-400">خطا در دریافت اطلاعات دیتابیس</span>
          </div>
      );
  }

  if (!data || data.moves.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3">
              <Database size={28} className="opacity-50" />
              <span className="text-xs font-sans">حرکتی در این پوزیسیون یافت نشد</span>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#161512] rounded-xl border border-[#35332e] overflow-hidden" dir="ltr">
      {/* هدر جدول */}
      <div className="flex items-center text-[10px] text-zinc-500 font-bold px-3 py-2 border-b border-[#35332e] bg-[#1a1916]">
         <div className="w-12">Move</div>
         <div className="w-12 text-right">Games</div>
         <div className="flex-1 text-center ml-4">Win / Draw / Loss</div>
      </div>
      
      {/* لیست حرکات */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
        {data.moves.map(move => {
          const total = move.white + move.draws + move.black;
          if (total === 0) return null;
          
          const wPct = (move.white / total) * 100;
          const dPct = (move.draws / total) * 100;
          const bPct = (move.black / total) * 100;

          return (
            <div 
                key={move.uci} 
                onClick={() => onMoveSelect(move.uci)} 
                className="flex items-center text-xs py-2 px-2 hover:bg-[#262421] cursor-pointer rounded-lg transition-colors group mb-0.5"
            >
              {/* نام حرکت (SAN) */}
              <div className="w-12 font-black text-zinc-200 group-hover:text-purple-400 transition-colors">{move.san}</div>
              
              {/* تعداد بازی‌ها */}
              <div className="w-12 text-right text-zinc-400 font-mono text-[10px] opacity-80">{formatNumber(total)}</div>
              
              {/* نمودار میله‌ای عملکرد (Performance Bar) */}
              <div className="flex-1 ml-4 h-[14px] flex rounded-md overflow-hidden opacity-90 group-hover:opacity-100 shadow-inner">
                 <div style={{ width: `${wPct}%` }} className="bg-zinc-200 flex items-center justify-center text-[#100f0d] font-bold" style={{fontSize: '8px'}}>
                     {wPct > 15 ? Math.round(wPct) : ''}
                 </div>
                 <div style={{ width: `${dPct}%` }} className="bg-zinc-500 flex items-center justify-center text-zinc-100 font-bold" style={{fontSize: '8px'}}>
                     {dPct > 15 ? Math.round(dPct) : ''}
                 </div>
                 <div style={{ width: `${bPct}%` }} className="bg-[#262421] flex items-center justify-center text-zinc-400 font-bold" style={{fontSize: '8px'}}>
                     {bPct > 15 ? Math.round(bPct) : ''}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}