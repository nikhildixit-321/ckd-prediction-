import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LanguageProvider, useLang } from './context/LanguageContext';
import { T } from './lang/translations';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Compare from './pages/Compare';
import Trends from './pages/Trends';

// Redirect to login page if user has no token
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
}

function Navbar() {
  const navigate = useNavigate();
  const { lang, toggleLang } = useLang();
  const tx = T[lang];
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  if (!isLoggedIn) return null;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-blue-600">
          CKD Insight
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium flex-wrap">
          <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">{tx.dashboard}</Link>
          <Link to="/history"   className="text-gray-700 hover:text-blue-600">{tx.history}</Link>
          <Link to="/compare"   className="text-gray-700 hover:text-blue-600">{tx.compare}</Link>
          <Link to="/trends"    className="text-gray-700 hover:text-blue-600">{tx.trends}</Link>
          <button
            onClick={toggleLang}
            className="border border-gray-300 rounded px-2 py-0.5 text-gray-600 hover:bg-gray-100"
          >
            {tx.lang}
          </button>
          <button onClick={logout} className="text-red-600 hover:underline cursor-pointer">
            {tx.logout}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-6xl mx-auto p-6">
            <Routes>
              <Route path="/"         element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/history"   element={<PrivateRoute><History /></PrivateRoute>} />
              <Route path="/compare"   element={<PrivateRoute><Compare /></PrivateRoute>} />
              <Route path="/trends"    element={<PrivateRoute><Trends /></PrivateRoute>} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </LanguageProvider>
    </BrowserRouter>
  );
}
