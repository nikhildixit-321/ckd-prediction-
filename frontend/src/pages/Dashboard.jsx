import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import Chatbot from '../components/Chatbot';
import RiskGauge from '../components/RiskGauge';
import DietPlan from '../components/DietPlan';
import { INITIAL_FORM, LABELS, DROPDOWNS } from '../data/formConfig';
import { useLang } from '../context/LanguageContext';
import { T } from '../lang/translations';
import { API_BASE_URL } from '../config';

export default function Dashboard() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tx = T[lang];

  const [patientName, setPatientName] = useState('Test Patient');
  const [modelKey, setModelKey] = useState('rf');
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (key, value) => {
    setFormData({
      ...formData,
      [key]: key in DROPDOWNS ? value : (value === '' ? '' : Number(value))
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ patientName, modelKey, features: formData })
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Prediction failed'); return; }
      setResult(data);
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Top 8 SHAP features for chart
  const chartData = result
    ? result.featureNames
        .map((name, i) => ({ name, impact: result.shapValues[i] || 0 }))
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
        .slice(0, 8)
    : [];

  // PDF Report download
  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const prob = (result.probability * 100).toFixed(1);
    const verdict = result.prediction === 1 ? 'CKD Detected (High Risk)' : 'No CKD (Low Risk)';

    doc.setFontSize(18);
    doc.text('CKD Prediction Report', 20, 20);

    doc.setFontSize(12);
    doc.text(`Patient: ${patientName}`, 20, 35);
    doc.text(`Date: ${date}`, 20, 44);
    doc.text(`Model Used: ${result.modelUsed?.toUpperCase() || 'RF'}`, 20, 53);
    doc.text(`Result: ${verdict}`, 20, 62);
    doc.text(`CKD Probability: ${prob}%`, 20, 71);

    doc.setFontSize(13);
    doc.text('Top Risk Factors (SHAP):', 20, 86);
    doc.setFontSize(11);
    chartData.slice(0, 6).forEach((f, i) => {
        const sign = f.impact > 0 ? '+' : '';
        doc.text(`  ${i + 1}. ${f.name}: ${sign}${f.impact.toFixed(3)}`, 20, 96 + i * 9);
    });

    doc.save(`CKD_Report_${patientName}_${date.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Patient Input Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{tx.patientData}</h2>
        <p className="text-sm text-gray-500 mb-5">{tx.patientDataDesc}</p>

        {error && (
          <p className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">{tx.patientName}</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{tx.mlModel}</label>
            <select
              value={modelKey}
              onChange={(e) => setModelKey(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm bg-white"
            >
              <option value="rf">Random Forest</option>
              <option value="xgb">XGBoost</option>
              <option value="lr">Logistic Regression</option>
              <option value="dt">Decision Tree</option>
              <option value="svm">SVM</option>
            </select>
          </div>

          {Object.keys(INITIAL_FORM).map((key) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{LABELS[key]}</label>
              {key in DROPDOWNS ? (
                <select
                  value={formData[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm bg-white"
                >
                  {DROPDOWNS[key].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  step="any"
                  required
                  value={formData[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="col-span-2 sm:col-span-3 mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? tx.predicting : tx.predict}
          </button>
        </form>
      </div>

      {/* Right: Results */}
      <div>
        {result ? (
          <div className="space-y-5">
            {/* Result card */}
            <div className={`p-6 rounded-xl text-white shadow-sm ${result.prediction === 1 ? 'bg-red-600' : 'bg-green-600'}`}>
              <h2 className="text-2xl font-bold">
                {result.prediction === 1 ? tx.highRisk : tx.lowRisk}
              </h2>
              <p className="mt-1 text-lg">{tx.probability}: {(result.probability * 100).toFixed(1)}%</p>
              <p className="mt-2 text-xs opacity-90">{tx.model}: {result.modelUsed?.toUpperCase()}</p>
            </div>

            {/* Risk Gauge */}
            <RiskGauge probability={result.probability * 100} label={tx.riskGauge} />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadPDF}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
              >
                {tx.downloadReport}
              </button>
              <Link
                to="/compare"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
              >
                {tx.compareAll}
              </Link>
              <Link
                to="/trends"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700"
              >
                {tx.trends}
              </Link>
            </div>

            {/* SHAP chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{tx.shapTitle}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {chartData.map((item) => (
                        <Cell key={item.name} fill={item.impact > 0 ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                  {tx.increasesRisk}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                  {tx.protective}
                </span>
              </div>
            </div>

            {/* Diet Plan (AI-powered) */}
            <DietPlan result={result} features={formData} label={tx.dietTitle} />
          </div>
        ) : (
          <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center text-gray-500">
            <h3 className="text-lg font-semibold text-gray-700">{tx.noResult}</h3>
            <p className="text-sm mt-1">{tx.noResultDesc}</p>
          </div>
        )}
      </div>

      <Chatbot patientContext={result} />
    </div>
  );
}
