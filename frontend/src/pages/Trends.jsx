import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts';
import { useLang } from '../context/LanguageContext';
import { T } from '../lang/translations';
import { API_BASE_URL } from '../config';

export default function Trends() {
    const { lang } = useLang();
    const tx = T[lang];

    const [history, setHistory] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selected, setSelected] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/predictions/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to fetch history');

                setHistory(data);

                // Get unique patient names
                const names = [...new Set(data.map(r => r.patientName))];
                setPatients(names);
                if (names.length > 0) setSelected(names[0]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

    // Filter records for selected patient, sorted by date
    const patientRecords = history
        .filter(r => r.patientName === selected)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map(r => ({
            date: new Date(r.createdAt).toLocaleDateString(),
            probability: parseFloat((r.probability * 100).toFixed(1)),
            prediction: r.prediction,
            model: r.modelUsed
        }));

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (error)   return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/dashboard" className="text-blue-600 hover:underline">← {tx.back || 'Back'}</Link>
                <h1 className="text-2xl font-bold text-gray-800">{tx.trendsTitle || 'Patient Trend Dashboard'}</h1>
            </div>

            {patients.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                    {tx.noHistory || 'No prediction history found. Make some predictions first!'}
                </div>
            ) : (
                <>
                    {/* Patient selector */}
                    <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center gap-4">
                        <label className="text-gray-600 font-medium">{tx.selectPatient || 'Select Patient'}:</label>
                        <select
                            value={selected}
                            onChange={e => setSelected(e.target.value)}
                            className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            {patients.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <span className="text-sm text-gray-500">
                            {patientRecords.length} {tx.records || 'records'}
                        </span>
                    </div>

                    {/* Line Chart */}
                    {patientRecords.length < 2 ? (
                        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                            {tx.needMoreRecords || 'Need at least 2 records to show trend chart.'}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow p-6 mb-6">
                            <h2 className="font-semibold text-gray-700 mb-4">
                                {tx.ckdTrend || 'CKD Risk Trend'} — {selected}
                            </h2>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={patientRecords} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                    <Tooltip formatter={v => [`${v}%`, 'CKD Probability']} />
                                    <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '50% threshold', position: 'right', fontSize: 11 }} />
                                    <Line
                                        type="monotone"
                                        dataKey="probability"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', r: 5 }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Records table */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="font-semibold text-gray-700 mb-4">
                            {tx.recordsFor || 'Records for'} {selected}
                        </h2>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="text-left p-2 border">{tx.date || 'Date'}</th>
                                    <th className="text-left p-2 border">{tx.model || 'Model'}</th>
                                    <th className="text-left p-2 border">{tx.prediction || 'Prediction'}</th>
                                    <th className="text-left p-2 border">{tx.probability || 'Probability'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientRecords.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-2 border">{r.date}</td>
                                        <td className="p-2 border">{r.model}</td>
                                        <td className="p-2 border">
                                            <span className={`px-2 py-0.5 rounded-full text-white text-xs ${
                                                r.prediction === 1 ? 'bg-red-500' : 'bg-green-500'
                                            }`}>
                                                {r.prediction === 1 ? 'CKD' : 'No CKD'}
                                            </span>
                                        </td>
                                        <td className="p-2 border">{r.probability}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
