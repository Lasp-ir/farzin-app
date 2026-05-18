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
import AnalysisSetup from './pages/AnalysisSetup';
import AnalysisBoard from './pages/AnalysisBoard';
import GameReport from './pages/GameReport';
import LichessLobby from './pages/LichessLobby';
import LichessLiveGame from './pages/LichessLiveGame';
import PuzzleBoard from "./pages/PuzzleBoard";
import PuzzleRush from './pages/PuzzleRush';
import AdminDashboard from './pages/AdminDashboard';
import CoursePlayer from './pages/CoursePlayer';
import CourseDetail from './pages/CourseDetail';
import LessonExercisePlayer from './pages/LessonExercisePlayer';

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
          <Route path="/analysis" element={<AnalysisSetup />} />
          <Route path="/analysis/board" element={<AnalysisBoard />} />
          <Route path="/report" element={<GameReport />} />
          <Route path="/play/online/lobby" element={<LichessLobby />} />
          <Route path="/play/online/game/:gameId" element={<LichessLiveGame />} />
          <Route path="/puzzle/:mode" element={<PuzzleBoard />} />
          <Route path="/puzzles" element={<Puzzles />} />
          <Route path="/puzzle/rush" element={<PuzzleRush />} />
          <Route path="/puzzle/:mode" element={<PuzzleBoard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/course/:courseId/play" element={<CoursePlayer />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/course/:courseId/lesson/:lessonId/exercises" element={<LessonExercisePlayer />} />
          

        </Routes>
        
        <PaywallModal />
      </div>
    </BrowserRouter>
  );
}