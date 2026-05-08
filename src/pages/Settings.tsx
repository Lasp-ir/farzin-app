import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowRight, ArrowLeft, Globe, User, 
  LogOut, Info, Link as LinkIcon, Palette, Cpu, MessageSquare
} from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SettingSection = ({ title, children }: any) => (
    <div className="mb-8">
      <h3 className="text-gray-400 text-sm font-bold mb-3 px-2 uppercase tracking-wider">{title}</h3>
      <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden shadow-lg">
        {children}
      </div>
    </div>
  );

  const SettingItem = ({ icon: Icon, label, value, onClick, isDanger, isAction }: any) => (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-4 border-b border-gray-700/50 last:border-0 
        ${onClick ? 'cursor-pointer hover:bg-gray-700/30 transition-colors' : ''}
        ${isDanger ? 'text-red-400' : 'text-gray-200'}
      `}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={isDanger ? 'text-red-400' : 'text-blue-400'} />
        <span className="font-medium">{label}</span>
      </div>
      {value && <span className="text-gray-400 text-sm">{value}</span>}
      {isAction && !value && (
        <span className="text-gray-500">
          {i18n.language === 'fa' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4 pb-10">
      {/* هدر */}
      <div className="flex items-center mb-8 pt-2">
        <button 
          onClick={() => navigate('/home')} 
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
        >
          {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
        <h1 className="text-2xl font-bold mx-4">{t('settings.title')}</h1>
      </div>

      <div className="max-w-md mx-auto w-full">
        
        {/* بخش حساب کاربری */}
        <SettingSection title={t('settings.account')}>
          <SettingItem icon={User} label="پروفایل کاربری" isAction />
          <SettingItem icon={LinkIcon} label={t('settings.connect_lichess')} value="متصل نشده" isAction />
          <SettingItem icon={LinkIcon} label={t('settings.connect_chesscom')} value="متصل نشده" isAction />
        </SettingSection>

        {/* بخش تنظیمات ظاهری و بازی */}
        <SettingSection title={t('settings.preferences')}>
          <SettingItem 
            icon={Globe} 
            label={t('settings.language')} 
            value={i18n.language === 'fa' ? 'فارسی' : 'English'} 
            onClick={handleLanguageToggle}
          />
          <SettingItem icon={Palette} label={t('settings.board_theme')} value="کلاسیک" isAction />
          <SettingItem icon={Cpu} label={t('settings.engine_settings')} isAction />
        </SettingSection>

        {/* بخش درباره و خروج */}
        <SettingSection title={t('settings.about')}>
          <SettingItem icon={Info} label={t('settings.about')} isAction />
          <SettingItem icon={MessageSquare} label={t('settings.send_feedback')} isAction />
          <SettingItem icon={LogOut} label={t('settings.logout')} isDanger onClick={handleLogout} />
        </SettingSection>

      </div>
    </div>
  );
}