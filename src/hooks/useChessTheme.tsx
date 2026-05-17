import { useState, useEffect, useMemo } from 'react';

const getSvgTexture = (type: string, opacity: number) => {
  const freq = type === 'wood' ? '0.01 0.15' : type === 'sand' ? '0.6' : '0.03';
  return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${opacity}'/%3E%3C/svg%3E")`;
};

export function useChessTheme() {
  const [boardTheme, setBoardTheme] = useState('green');
  const [pieceTheme, setPieceTheme] = useState('neo');
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('farzin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.boardTheme) setBoardTheme(parsed.boardTheme);
        if (parsed.pieceTheme) setPieceTheme(parsed.pieceTheme);
      }
      setUpdateTrigger(prev => prev + 1);
    };
    
    loadSettings();
    window.addEventListener('farzin_settings_changed', loadSettings);
    return () => window.removeEventListener('farzin_settings_changed', loadSettings);
  }, []);

  const themeColors = useMemo(() => {
    // 🔥 موتور رندر تم‌های پولی (VIP)
    // اگر تم در دیتابیس دانلود شده بود، با افکت شیشه‌ای (Glassmorphism) رندرش کن
    const savedCustomBoard = localStorage.getItem(`farzin_board_${boardTheme}`);
    if (savedCustomBoard && !['wood','walnut','marble','granite','sand','carbon','canvas','neon','leather'].includes(boardTheme)) {
        return {
            light: { 
                background: `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), url("${savedCustomBoard}")`, 
                backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)'
            },
            dark: { 
                background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("${savedCustomBoard}")`, 
                backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.7)'
            }
        };
    }

    const getBg = (id: string, fallbackType?: string, op: number = 0.15) => {
        const saved = localStorage.getItem(`farzin_board_${id}`);
        if (saved) return `url("${saved}")`;
        if (fallbackType) return getSvgTexture(fallbackType, op);
        return undefined;
    };

    const themes: Record<string, any> = {
      green: { light: { backgroundColor: '#ebecd0' }, dark: { backgroundColor: '#779556' } },
      wood: { light: { backgroundColor: '#f0d9b5', backgroundImage: getBg('wood', 'wood', 0.15) }, dark: { backgroundColor: '#b58863', backgroundImage: getBg('wood', 'wood', 0.25) } },
      walnut: { light: { backgroundColor: '#d0af88', backgroundImage: getBg('walnut', 'wood', 0.15) }, dark: { backgroundColor: '#6e472a', backgroundImage: getBg('walnut', 'wood', 0.25) } },
      marble: { light: { backgroundColor: '#e8ecef', backgroundImage: getBg('marble', 'marble', 0.1) }, dark: { backgroundColor: '#8f9ea8', backgroundImage: getBg('marble', 'marble', 0.15) } },
      granite: { light: { backgroundColor: '#c4c8cc', backgroundImage: getBg('granite', 'marble', 0.1) }, dark: { backgroundColor: '#50565a', backgroundImage: getBg('granite', 'marble', 0.15) } },
      sand: { light: { backgroundColor: '#f4dfba', backgroundImage: getBg('sand', 'sand', 0.1) }, dark: { backgroundColor: '#d2a66e', backgroundImage: getBg('sand', 'sand', 0.15) } },
      carbon: { light: { backgroundColor: '#888888', backgroundImage: getBg('carbon') || 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 10px, transparent 10px, transparent 20px)' }, dark: { backgroundColor: '#222222', backgroundImage: getBg('carbon') || 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 10px, transparent 10px, transparent 20px)' } },
      canvas: { light: { backgroundColor: '#f2ece4', backgroundImage: getBg('canvas') }, dark: { backgroundColor: '#a59b8c', backgroundImage: getBg('canvas') } },
      dark: { light: { backgroundColor: '#bababa' }, dark: { backgroundColor: '#4a4a4a' } },
      glass: { light: { backgroundColor: '#dff9fb' }, dark: { backgroundColor: '#95afc0' } },
      sky: { light: { backgroundColor: '#e0f7fa' }, dark: { backgroundColor: '#4fc3f7' } },
    };

    return themes[boardTheme] || themes['green'];
  }, [boardTheme, updateTrigger]);

  const customPieces = useMemo(() => {
    const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
    const pieceComponents: any = {};
    
    pieces.forEach(piece => {
      const lowerPiece = piece.toLowerCase();
      const savedUrl = localStorage.getItem(`farzin_piece_${pieceTheme}_${lowerPiece}`);
      const pieceUrl = savedUrl || `https://images.chesscomfiles.com/chess-themes/pieces/${pieceTheme}/150/${lowerPiece}.png`;

      pieceComponents[piece] = ({ squareWidth }: { squareWidth: number }) => (
        <div style={{ 
            width: squareWidth, 
            height: squareWidth, 
            backgroundImage: `url("${pieceUrl}")`, 
            backgroundSize: '100%',
            filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.5)) drop-shadow(0 2px 3px rgba(0,0,0,0.4))' // سایه‌های سه‌بعدی سنگین‌تر برای مهره‌های VIP
        }} />
      );
    });
    return pieceComponents;
  }, [pieceTheme, updateTrigger]);

  return {
    lightSquareStyle: themeColors.light,
    darkSquareStyle: themeColors.dark,
    customPieces
  };
}