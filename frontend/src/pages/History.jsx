import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function History() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDiet, setSelectedDiet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHistory() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/predictions/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Could not load history');
          return;
        }
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        setError('Cannot connect to server');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [navigate]);

  const filtered = history.filter((item) =>
    (item.patientName || '').toLowerCase().includes(search.toLowerCase())
  );

  const highRiskCount = history.filter((item) => item.prediction === 1).length;
  const healthyCount = history.length - highRiskCount;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-[#0a3d62] rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Screenings</p>
            <p className="text-xl font-bold text-slate-800">{history.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-700 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">High Risk (CKD)</p>
            <p className="text-xl font-bold text-red-700">{highRiskCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Healthy / Low Risk</p>
            <p className="text-xl font-bold text-emerald-700">{healthyCount}</p>
          </div>
        </div>
      </div>

      {/* Patient Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0a3d62] text-white px-5 py-3 flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-base font-bold">Patient Screening Records (EMR History)</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient name..."
              className="pl-8 pr-3 py-1 rounded text-xs text-slate-800 bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="p-5">
          {error && (
            <p className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border-l-4 border-red-600">
              {error}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-200 text-sm">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left border-b">Date</th>
                  <th className="px-4 py-3 text-left border-b">Patient Name</th>
                  <th className="px-4 py-3 text-left border-b">Age</th>
                  <th className="px-4 py-3 text-left border-b">BP / Creatinine / Hemo</th>
                  <th className="px-4 py-3 text-left border-b">Screening Result</th>
                  <th className="px-4 py-3 text-left border-b">Risk %</th>
                  <th className="px-4 py-3 text-left border-b">Diet Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-500">Loading records...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-500">No screening records found.</td></tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.patientName}</td>
                      <td className="px-4 py-3 text-slate-600">{item.features?.age ?? '—'} yrs</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        BP: {item.features?.bp ?? '—'} | SC: {item.features?.sc ?? '—'} | Hb: {item.features?.hemo ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded ${item.prediction === 1 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {item.prediction === 1 ? 'CKD Risk' : 'Healthy'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{(item.probability * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        {item.dietPlan ? (
                          <button
                            onClick={() => setSelectedDiet(item)}
                            className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded font-semibold hover:bg-emerald-100 cursor-pointer"
                          >
                            View Diet
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Saved Diet Plan Modal */}
      {selectedDiet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <div className="bg-emerald-800 text-white px-5 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm">Saved Diet Plan — {selectedDiet.patientName}</h3>
              <button onClick={() => setSelectedDiet(null)} className="text-white hover:text-emerald-200 cursor-pointer font-bold">✕</button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {selectedDiet.dietPlan.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^#+\s*/gm, '').replace(/\|/g, ' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
