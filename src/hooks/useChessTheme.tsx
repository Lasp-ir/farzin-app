import { useState, useEffect, useMemo } from 'react';

// فیلترهای آفلاین برای بک‌آپ (سبک و سریع)
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
    const savedCustomBoard = localStorage.getItem(`farzin_board_${boardTheme}`);
    
    // 🚀 بهینه‌سازی حداکثری برای موبایل: استفاده از یک لایه عکس با ترکیب رنگی ساده (Blend Mode)
    // این روش برای پردازنده موبایل مثل آب خوردنه و هیچ افت فریمی ایجاد نمیکنه
    if (savedCustomBoard && !['wood','walnut','marble','granite','sand','carbon','canvas','neon','leather'].includes(boardTheme)) {
        return {
            light: { 
                background: `rgba(255, 255, 255, 0.7) url("${savedCustomBoard}")`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay' 
            },
            dark: { 
                background: `rgba(0, 0, 0, 0.6) url("${savedCustomBoard}")`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay'
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
            backgroundRepeat: 'no-repeat',
            // 🚀 بازگشت به همان سایه ساده و سبک اولیه
            filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.35))'
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