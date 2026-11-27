import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldPlus, UserCheck } from 'lucide-react';
import { LanguageProvider, useLang } from './context/LanguageContext';
import { T } from './lang/translations';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Trends from './pages/Trends';

// Redirect to login page if user has no token
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, toggleLang } = useLang();
  const tx = T[lang];
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const user = getStoredUser();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const navLinkClass = (path) =>
    `px-3 py-2 text-sm font-medium border-b-2 transition ${
      location.pathname === path
        ? 'border-[#0a3d62] text-[#0a3d62] font-semibold'
        : 'border-transparent text-slate-600 hover:text-[#0a3d62]'
    }`;

  return (
    <header className="bg-white border-b-4 border-[#0a3d62] shadow-sm">
      {/* Top official health portal bar */}
      <div className="bg-[#0a3d62] text-white text-xs py-1.5 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>
            {lang === 'hi'
              ? 'राष्ट्रीय किडनी स्वास्थ्य एवं CKD जांच पोर्टल • क्लिनिकल सहायता प्रणाली'
              : 'National Renal Health & CKD Screening Portal • Clinical Decision Support'}
          </span>
          <button
            onClick={toggleLang}
            className="bg-white/15 hover:bg-white/25 text-white px-2.5 py-0.5 rounded text-xs cursor-pointer"
          >
            {tx.lang}
          </button>
        </div>
      </div>

      {/* Main hospital / portal navigation bar */}
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center flex-wrap gap-3">
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <div className="bg-[#0a3d62] text-white p-2 rounded-lg shadow-sm">
            <ShieldPlus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-bold text-[#0a3d62] block leading-tight">
              Swasthya CKD Portal
            </span>
            <span className="text-[11px] text-slate-500 block">
              {lang === 'hi' ? 'नेफ्रोलॉजी एवं निवारक देखभाल विभाग' : 'Department of Nephrology & Preventive Care'}
            </span>
          </div>
        </Link>

        {isLoggedIn && (
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>{tx.dashboard}</Link>
            <Link to="/history" className={navLinkClass('/history')}>{tx.history}</Link>
            <Link to="/trends" className={navLinkClass('/trends')}>{tx.trends}</Link>

            {user?.name && (
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                <UserCheck className="w-3.5 h-3.5 text-[#0a3d62]" />
                {user.name} ({user.role === 'doctor' ? 'Doctor' : 'Patient'})
              </span>
            )}

            <button
              onClick={logout}
              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 cursor-pointer"
            >
              {tx.logout}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="min-h-screen flex flex-col bg-slate-100">
          <Header />
          <main className="flex-1 max-w-6xl w-full mx-auto p-6">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
              <Route path="/trends" element={<PrivateRoute><Trends /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-[#0a3d62] text-blue-100 text-xs py-3 px-6 text-center">
            Swasthya CKD Screening Portal • For clinical screening support only. Always consult a qualified Nephrologist.
          </footer>
        </div>
      </LanguageProvider>
    </BrowserRouter>
  );
}
