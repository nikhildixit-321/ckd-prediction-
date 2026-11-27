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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Prediction History</h2>

      {error && (
        <p className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Model</th>
              <th className="px-4 py-3 text-left">Prediction</th>
              <th className="px-4 py-3 text-left">Risk %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No predictions found.</td></tr>
            ) : (
              history.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3 text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.patientName}</td>
                  <td className="px-4 py-3 text-gray-500 uppercase">{item.modelUsed}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.prediction === 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.prediction === 1 ? 'CKD' : 'Healthy'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(item.probability * 100).toFixed(1)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
