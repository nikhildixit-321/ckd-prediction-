import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Wake up Render Backend & ML API on login page load; redirect if already logged in
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/predictions/wakeup`).catch(() => {});
    if (localStorage.getItem('token')) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isRegister ? `${API_BASE_URL}/api/auth/register` : `${API_BASE_URL}/api/auth/login`;
    const body = isRegister ? { name, email, password, role } : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/dashboard');
    } catch {
      setError('Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh]">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Official Hospital Portal Card Header */}
        <div className="bg-[#0a3d62] text-white px-6 py-4 flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-teal-300" />
          <div>
            <h2 className="text-lg font-bold">
              {isRegister ? 'Patient / Doctor Registration' : 'Hospital Portal Sign In'}
            </h2>
            <p className="text-xs text-blue-100">Authorized Clinical & Patient Access</p>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <p className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border-l-4 border-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Dr. / Patient Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-[#0a3d62]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:border-[#0a3d62]"
                  >
                    <option value="doctor">Doctor / Clinician</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="name@hospital.org"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-[#0a3d62]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-[#0a3d62]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0a3d62] hover:bg-[#08304d] text-white font-semibold rounded text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verifying...' : isRegister ? 'Register Account' : 'Sign In to Portal'}
            </button>
          </form>

          <p className="mt-5 pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
            {isRegister ? 'Already registered? ' : 'New user? '}
            <button
              type="button"
              onClick={() => { setError(''); setIsRegister(!isRegister); }}
              className="text-[#0a3d62] font-semibold hover:underline cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
