import { useState, useEffect, useMemo } from 'react';

// 🔥 تولید بافت‌های گرافیکی آفلاین با استفاده از فیلترهای SVG (بدون نیاز به دانلود عکس!)
const getSvgTexture = (type: string, opacity: number) => {
  const freq = type === 'wood' ? '0.01 0.15' : type === 'sand' ? '0.6' : '0.03';
  return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${opacity}'/%3E%3C/svg%3E")`;
};

// دیکشنری تم‌ها با استایل‌های کاملاً داینامیک
const BOARD_THEMES: Record<string, { light: any, dark: any }> = {
  green: { light: { backgroundColor: '#ebecd0' }, dark: { backgroundColor: '#779556' } },
  wood: { 
    light: { backgroundColor: '#f0d9b5', backgroundImage: getSvgTexture('wood', 0.15) }, 
    dark: { backgroundColor: '#b58863', backgroundImage: getSvgTexture('wood', 0.25) } 
  },
  walnut: { 
    light: { backgroundColor: '#d0af88', backgroundImage: getSvgTexture('wood', 0.15) }, 
    dark: { backgroundColor: '#6e472a', backgroundImage: getSvgTexture('wood', 0.25) } 
  },
  marble: { 
    light: { backgroundColor: '#e8ecef', backgroundImage: getSvgTexture('marble', 0.1) }, 
    dark: { backgroundColor: '#8f9ea8', backgroundImage: getSvgTexture('marble', 0.15) } 
  },
  granite: { 
    light: { backgroundColor: '#c4c8cc', backgroundImage: getSvgTexture('marble', 0.1) }, 
    dark: { backgroundColor: '#50565a', backgroundImage: getSvgTexture('marble', 0.15) } 
  },
  sand: { 
    light: { backgroundColor: '#f4dfba', backgroundImage: getSvgTexture('sand', 0.1) }, 
    dark: { backgroundColor: '#d2a66e', backgroundImage: getSvgTexture('sand', 0.15) } 
  },
  carbon: { 
    light: { backgroundColor: '#888888', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 10px, transparent 10px, transparent 20px)' }, 
    dark: { backgroundColor: '#222222', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 10px, transparent 10px, transparent 20px)' } 
  },
  canvas: { light: { backgroundColor: '#f2ece4' }, dark: { backgroundColor: '#a59b8c' } },
  dark: { light: { backgroundColor: '#bababa' }, dark: { backgroundColor: '#4a4a4a' } },
  glass: { light: { backgroundColor: '#dff9fb' }, dark: { backgroundColor: '#95afc0' } },
  sky: { light: { backgroundColor: '#e0f7fa' }, dark: { backgroundColor: '#4fc3f7' } },
};

export function useChessTheme() {
  const [boardTheme, setBoardTheme] = useState('green');
  const [pieceTheme, setPieceTheme] = useState('neo');

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('farzin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.boardTheme) setBoardTheme(parsed.boardTheme);
        if (parsed.pieceTheme) setPieceTheme(parsed.pieceTheme);
      }
    };
    
    loadSettings();
    window.addEventListener('farzin_settings_changed', loadSettings);
    return () => window.removeEventListener('farzin_settings_changed', loadSettings);
  }, []);

  const themeColors = BOARD_THEMES[boardTheme] || BOARD_THEMES['green'];

  const customPieces = useMemo(() => {
    const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
    const pieceComponents: any = {};
    
    pieces.forEach(piece => {
      pieceComponents[piece] = ({ squareWidth }: { squareWidth: number }) => (
        <div style={{ 
            width: squareWidth, 
            height: squareWidth, 
            backgroundImage: `url(https://images.chesscomfiles.com/chess-themes/pieces/${pieceTheme}/150/${piece.toLowerCase()}.png)`, 
            backgroundSize: '100%',
            filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.35))' 
        }} />
      );
    });
    return pieceComponents;
  }, [pieceTheme]);

  return {
    lightSquareStyle: themeColors.light,
    darkSquareStyle: themeColors.dark,
    customPieces
  };
}