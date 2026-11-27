import { useState } from 'react';
import { Utensils } from 'lucide-react';
import { API_BASE_URL } from '../config';

function cleanDietText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\|/g, ' ')
    .replace(/^[-\s:]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Hospital Clinical Nutrition Card powered by Groq AI
export default function DietPlan({ result, features, label }) {
  const [diet, setDiet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPlan = async () => {
    setLoading(true);
    setError('');
    setDiet('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/diet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prediction: result?.prediction,
          probability: result?.probability,
          features
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to get plan'); return; }
      setDiet(data.diet || '');
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-emerald-800 text-white px-5 py-3 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-emerald-200" />
          <h3 className="text-sm font-bold">{label || 'Clinical Nutrition & Diet Plan'}</h3>
        </div>
        <button
          onClick={fetchPlan}
          disabled={loading}
          className="px-3 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-semibold rounded disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Generating...' : diet ? 'Regenerate Plan' : 'Get Diet Plan'}
        </button>
      </div>

      <div className="p-5">
        {error && (
          <p className="text-red-700 bg-red-50 border-l-4 border-red-600 p-3 rounded text-sm">
            {error}
          </p>
        )}

        {diet ? (
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-emerald-50/60 p-4 rounded-lg border border-emerald-200">
            {cleanDietText(diet)}
          </div>
        ) : !loading && !error && (
          <p className="text-xs text-slate-500">
            Click &quot;Get Diet Plan&quot; to generate personalized renal nutrition and lifestyle guidance based on this patient&apos;s lab values.
          </p>
        )}
      </div>
    </div>
  );
}
