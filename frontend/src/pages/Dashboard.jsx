import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ClipboardList, FileText, Activity, HeartPulse, FlaskConical } from 'lucide-react';
import jsPDF from 'jspdf';
import Chatbot from '../components/Chatbot';
import RiskGauge from '../components/RiskGauge';
import DietPlan from '../components/DietPlan';
import { INITIAL_FORM, LABELS, DROPDOWNS } from '../data/formConfig';
import { useLang } from '../context/LanguageContext';
import { T } from '../lang/translations';
import { API_BASE_URL } from '../config';

const VITALS_KEYS = ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba'];
const BLOOD_KEYS = ['bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc'];

function getDefaultPatientName() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.role === 'patient' && user?.name ? user.name : '';
  } catch {
    return '';
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tx = T[lang];

  const [patientName, setPatientName] = useState(getDefaultPatientName);
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
    if (!patientName.trim()) {
      setError('Please enter the patient full name.');
      return;
    }
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
        body: JSON.stringify({ patientName: patientName.trim(), modelKey, features: formData })
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

    doc.setFontSize(16);
    doc.text('SWASTHYA CKD SCREENING REPORT', 20, 20);
    doc.setFontSize(10);
    doc.text('Department of Nephrology & Preventive Care', 20, 27);

    doc.setFontSize(12);
    doc.text(`Patient Name: ${result.patientName || patientName}`, 20, 42);
    doc.text(`Patient Age: ${formData.age} yrs`, 20, 50);
    doc.text(`Screening Date: ${date}`, 20, 58);
    doc.text(`Screening Result: ${verdict}`, 20, 66);
    doc.text(`CKD Risk Probability: ${prob}%`, 20, 74);

    doc.setFontSize(12);
    doc.text('Top Contributing Clinical Factors (SHAP):', 20, 90);
    doc.setFontSize(10);
    chartData.slice(0, 6).forEach((f, i) => {
      const sign = f.impact > 0 ? '+' : '';
      doc.text(`  ${i + 1}. ${f.name}: ${sign}${f.impact.toFixed(3)}`, 20, 100 + i * 8);
    });

    doc.save(`CKD_Report_${(result.patientName || patientName).replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`);
  };

  const renderField = (key) => (
    <div key={key}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{LABELS[key]}</label>
      {key in DROPDOWNS ? (
        <select
          value={formData[key]}
          onChange={(e) => updateField(key, e.target.value)}
          className="w-full p-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:border-[#0a3d62]"
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
          className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-[#0a3d62]"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Official Screening Notice Banner */}
      <div className="bg-blue-50 border-l-4 border-[#0a3d62] text-slate-700 px-4 py-3 rounded text-xs flex items-center gap-2 shadow-xs">
        <Activity className="w-4 h-4 text-[#0a3d62] shrink-0" />
        <span>
          {lang === 'hi'
            ? 'सूचना: यह पोर्टल मरीज के क्लिनिकल लैब मानों के आधार पर प्रारंभिक CKD जोखिम जांच के लिए है।'
            : 'Clinical Notice: Enter verified patient pathology & vitals values below to generate an AI-assisted CKD risk screening report.'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hospital Patient Intake Form */}
        <div className="lg:col-span-7 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#0a3d62] text-white px-5 py-3 flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-teal-300" />
            <div>
              <h2 className="text-base font-bold">{tx.patientData}</h2>
              <p className="text-xs text-blue-100">{tx.patientDataDesc}</p>
            </div>
          </div>

          <div className="p-5">
            {error && (
              <p className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border-l-4 border-red-600">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Patient Registration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tx.patientName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter patient full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:border-[#0a3d62]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{tx.mlModel}</label>
                  <select
                    value={modelKey}
                    onChange={(e) => setModelKey(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:border-[#0a3d62]"
                  >
                    <option value="rf">Random Forest</option>
                    <option value="xgb">XGBoost</option>
                    <option value="lr">Logistic Regression</option>
                    <option value="dt">Decision Tree</option>
                    <option value="svm">SVM</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Vitals & Urine Examination */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a3d62] flex items-center gap-1.5 mb-2.5 border-b border-slate-200 pb-1">
                  <HeartPulse className="w-3.5 h-3.5" /> Vitals & Urine Examination
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {VITALS_KEYS.map(renderField)}
                </div>
              </div>

              {/* Section 3: Blood & Renal Biochemistry */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a3d62] flex items-center gap-1.5 mb-2.5 border-b border-slate-200 pb-1">
                  <FlaskConical className="w-3.5 h-3.5" /> Blood & Renal Biochemistry
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {BLOOD_KEYS.map(renderField)}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0a3d62] hover:bg-[#08304d] text-white font-semibold rounded text-sm disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? tx.predicting : tx.predict}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Diagnostic Screening Report */}
        <div className="lg:col-span-5">
          {result ? (
            <div className="space-y-5">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 text-white px-5 py-2.5 flex justify-between items-center text-xs font-semibold tracking-wide uppercase">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-300" /> Diagnostic Screening Report
                  </span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>

                <div className={`p-5 text-white ${result.prediction === 1 ? 'bg-red-700' : 'bg-emerald-700'}`}>
                  <h2 className="text-xl font-bold">
                    {result.prediction === 1 ? tx.highRisk : tx.lowRisk}
                  </h2>
                  <p className="mt-1 text-base font-medium">{tx.probability}: {(result.probability * 100).toFixed(1)}%</p>
                  <div className="mt-3 pt-2 border-t border-white/20 text-xs flex flex-wrap gap-x-4 gap-y-1 opacity-95">
                    <span><strong>Patient:</strong> {result.patientName || patientName}</span>
                    <span><strong>Age:</strong> {formData.age} yrs</span>
                    <span><strong>Model:</strong> {result.modelUsed?.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Risk Gauge */}
              <RiskGauge probability={result.probability * 100} label={tx.riskGauge} />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadPDF}
                  className="flex-1 bg-[#0a3d62] text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-[#08304d] cursor-pointer"
                >
                  {tx.downloadReport}
                </button>
                <Link
                  to="/trends"
                  className="flex-1 text-center bg-teal-700 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-teal-800"
                >
                  {tx.trends}
                </Link>
              </div>

              {/* SHAP chart */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">{tx.shapTitle}</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {chartData.map((item) => (
                          <Cell key={item.name} fill={item.impact > 0 ? '#dc2626' : '#0a3d62'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
                    {tx.increasesRisk}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0a3d62] inline-block"></span>
                    {tx.protective}
                  </span>
                </div>
              </div>

              {/* Diet Plan */}
              <DietPlan result={result} features={formData} label={tx.dietTitle} />
            </div>
          ) : (
            <div className="bg-white p-10 rounded-lg shadow-sm border border-slate-200 h-full min-h-[380px] flex flex-col items-center justify-center text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">{tx.noResult}</h3>
              <p className="text-sm mt-1 max-w-xs">{tx.noResultDesc}</p>
            </div>
          )}
        </div>
      </div>

      <Chatbot patientContext={result} />
    </div>
  );
}
