import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { INITIAL_FORM, LABELS, DROPDOWNS } from '../data/formConfig';
import { useLang } from '../context/LanguageContext';
import { T } from '../lang/translations';
import { API_BASE_URL } from '../config';

export default function Compare() {
    const { lang } = useLang();
    const tx = T[lang];

    const [form, setForm] = useState({ ...INITIAL_FORM });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: DROPDOWNS[name] ? value : parseFloat(value) || value
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/compare`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ features: form })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Compare failed');
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const numericFields = Object.keys(INITIAL_FORM).filter(k => !DROPDOWNS[k]);
    const dropFields    = Object.keys(DROPDOWNS);

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/dashboard" className="text-blue-600 hover:underline">← {tx.back || 'Back'}</Link>
                <h1 className="text-2xl font-bold text-gray-800">{tx.compareTitle || 'Compare All Models'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    {tx.enterFeatures || 'Enter Patient Features'}
                </h2>

                {/* Numeric fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {numericFields.map(key => (
                        <div key={key}>
                            <label className="text-xs text-gray-500 block mb-1">{LABELS[key]}</label>
                            <input
                                type="number"
                                name={key}
                                value={form[key]}
                                onChange={handleChange}
                                step="any"
                                className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    ))}
                </div>

                {/* Dropdown fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {dropFields.map(key => (
                        <div key={key}>
                            <label className="text-xs text-gray-500 block mb-1">{LABELS[key]}</label>
                            <select
                                name={key}
                                value={form[key]}
                                onChange={handleChange}
                                className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                {DROPDOWNS[key].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? (tx.comparing || 'Comparing...') : (tx.compareBtn || 'Compare Models')}
                </button>
            </form>

            {result && (
                <div className="bg-white rounded-xl shadow p-6">
                    {/* Consensus badge */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-gray-600 font-medium">{tx.consensus || 'Consensus'}:</span>
                        <span className={`px-4 py-1 rounded-full text-white font-bold text-lg ${
                            result.consensus === 'CKD' ? 'bg-red-500' : 'bg-green-500'
                        }`}>
                            {result.consensus}
                        </span>
                        <span className="text-gray-500 text-sm">
                            ({result.ckd_votes}/{result.total_models} {tx.modelsVoted || 'models voted CKD'})
                        </span>
                    </div>

                    {/* Bar chart */}
                    <h3 className="font-semibold text-gray-700 mb-3">{tx.probabilityChart || 'CKD Probability by Model'}</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={result.results} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="model" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                            <Tooltip formatter={v => [`${v.toFixed(1)}%`, 'Probability']} />
                            <Bar dataKey="probability">
                                {result.results.map((entry, i) => (
                                    <Cell key={i} fill={entry.prediction === 1 ? '#ef4444' : '#22c55e'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Results table */}
                    <table className="w-full mt-6 text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="text-left p-2 border">{tx.model || 'Model'}</th>
                                <th className="text-left p-2 border">{tx.prediction || 'Prediction'}</th>
                                <th className="text-left p-2 border">{tx.probability || 'Probability'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.results.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-2 border font-medium">{r.model}</td>
                                    <td className="p-2 border">
                                        <span className={`px-2 py-0.5 rounded-full text-white text-xs ${
                                            r.prediction === 1 ? 'bg-red-500' : 'bg-green-500'
                                        }`}>
                                            {r.prediction === 1 ? 'CKD' : 'No CKD'}
                                        </span>
                                    </td>
                                    <td className="p-2 border">{r.probability.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
