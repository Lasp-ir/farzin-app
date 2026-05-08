import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Splash = () => <div className="flex h-screen items-center justify-center bg-gray-900 text-white text-2xl">صفحه بارگذاری (Splash)</div>;
const Auth = () => <div className="flex h-screen items-center justify-center bg-gray-900 text-white text-2xl">ورود / ثبتنام</div>;
const Home = () => <div className="flex h-screen items-center justify-center bg-gray-900 text-white text-2xl">داشبورد ویجتها</div>;

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white font-sans" dir="rtl">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
