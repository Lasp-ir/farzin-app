import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Home from './pages/Home';
import PlayAI from './pages/PlayAI';
import BotSelection from './pages/BotSelection';
import Settings from './pages/Settings';
import Archive from './pages/Archive';
import Puzzles from './pages/Puzzles';
import Education from './pages/Education';

import PaywallModal from './components/PaywallModal';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const currentLang = i18n.language;
    document.documentElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    
    if (currentLang === 'fa') {
      document.body.style.fontFamily = 'Tahoma, Arial, sans-serif';
    } else {
      document.body.style.fontFamily = 'Inter, system-ui, sans-serif';
    }
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white selection:bg-blue-500/30 relative">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/play-ai" element={<PlayAI />} />
          <Route path="/select-bot" element={<BotSelection />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/puzzles" element={<Puzzles />} />
          <Route path="/education" element={<Education />} />
        </Routes>
        
        <PaywallModal />
      </div>
    </BrowserRouter>
  );
}