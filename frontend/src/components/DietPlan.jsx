import { useState } from 'react';
import { API_BASE_URL } from '../config';

// Shows a "Get Diet Plan" button that calls Groq AI for personalized nutrition advice
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
                    'Authorization': `Bearer ${token}`
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800">🥗 {label || 'Personalized Diet Plan'}</h3>
                <button
                    onClick={fetchPlan}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                >
                    {loading ? 'Generating...' : 'Get Diet Plan'}
                </button>
            </div>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            {diet ? (
                <div className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-green-50 p-4 rounded-lg border border-green-100">
                    {diet}
                </div>
            ) : !loading && !error && (
                <p className="text-sm text-gray-400 mt-1">
                    Click "Get Diet Plan" to receive AI-powered personalized nutrition advice based on the patient's CKD result.
                </p>
            )}
        </div>
    );
}
