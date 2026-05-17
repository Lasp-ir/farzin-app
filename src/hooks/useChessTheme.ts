// src/hooks/useChessTheme.ts
import { useState, useEffect, useMemo } from 'react';

const BOARD_THEMES: Record<string, { light: string, dark: string }> = {
  green: { light: '#ebecd0', dark: '#779556' },
  wood: { light: '#f0d9b5', dark: '#b58863' },
  walnut: { light: '#d0af88', dark: '#6e472a' },
  marble: { light: '#e8ecef', dark: '#8f9ea8' },
  granite: { light: '#c4c8cc', dark: '#50565a' },
  sand: { light: '#f4dfba', dark: '#d2a66e' },
  carbon: { light: '#888888', dark: '#222222' },
  canvas: { light: '#f2ece4', dark: '#a59b8c' },
  dark: { light: '#bababa', dark: '#4a4a4a' },
  glass: { light: '#dff9fb', dark: '#95afc0' },
  sky: { light: '#e0f7fa', dark: '#4fc3f7' },
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
    
    // لیسنر اختصاصی برای اعمال لحظه‌ای تغییرات بدون نیاز به رفرش
    window.addEventListener('farzin_settings_changed', loadSettings);
    return () => window.removeEventListener('farzin_settings_changed', loadSettings);
  }, []);

  const themeColors = BOARD_THEMES[boardTheme] || BOARD_THEMES['green'];

  // ساخت گرافیک مهره‌ها بر اساس انتخاب کاربر
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
            filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.35))' // سایه جذاب برای مهره‌ها
        }} />
      );
    });
    return pieceComponents;
  }, [pieceTheme]);

  return {
    lightSquareStyle: { backgroundColor: themeColors.light },
    darkSquareStyle: { backgroundColor: themeColors.dark },
    customPieces
  };
}