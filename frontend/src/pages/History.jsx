import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHistory() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/predictions/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-[#0a3d62] text-white px-5 py-3">
        <h2 className="text-base font-bold">Patient Screening Records (History)</h2>
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
                <th className="px-4 py-3 text-left border-b">Model</th>
                <th className="px-4 py-3 text-left border-b">Screening Result</th>
                <th className="px-4 py-3 text-left border-b">Risk %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">Loading records...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">No screening records found.</td></tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.patientName}</td>
                    <td className="px-4 py-3 text-slate-500 uppercase">{item.modelUsed}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded ${item.prediction === 1 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {item.prediction === 1 ? 'CKD Risk' : 'Healthy'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{(item.probability * 100).toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
