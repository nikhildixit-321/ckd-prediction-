import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import Chatbot from '../components/Chatbot';
import { API_BASE_URL } from '../config';

const NUMERIC_FIELDS = [
  { key: 'age', label: 'Age (yrs)', step: '1' },
  { key: 'bp', label: 'Blood Pressure (mm/Hg)', step: '1' },
  { key: 'sg', label: 'Specific Gravity', step: '0.005' },
  { key: 'al', label: 'Albumin (0-5)', step: '1' },
  { key: 'su', label: 'Sugar (0-5)', step: '1' },
  { key: 'bgr', label: 'Blood Glucose (mg/dL)', step: '1' },
  { key: 'bu', label: 'Blood Urea (mg/dL)', step: '0.1' },
  { key: 'sc', label: 'Serum Creatinine (mg/dL)', step: '0.1' },
  { key: 'sod', label: 'Sodium (mEq/L)', step: '0.1' },
  { key: 'pot', label: 'Potassium (mEq/L)', step: '0.1' },
  { key: 'hemo', label: 'Hemoglobin (g/dL)', step: '0.1' },
  { key: 'pcv', label: 'Packed Cell Vol (%)', step: '1' },
  { key: 'wc', label: 'WBC Count (cells/cumm)', step: '100' },
  { key: 'rc', label: 'RBC Count (millions/cmm)', step: '0.1' }
];

const CATEGORICAL_FIELDS = [
  { key: 'rbc', label: 'Red Blood Cells', options: ['normal', 'abnormal'] },
  { key: 'pc', label: 'Pus Cell', options: ['normal', 'abnormal'] },
  { key: 'pcc', label: 'Pus Cell Clumps', options: ['notpresent', 'present'] },
  { key: 'ba', label: 'Bacteria', options: ['notpresent', 'present'] }
];

const MODEL_OPTIONS = [
  { key: 'rf', label: 'Random Forest (Recommended)' },
  { key: 'xgb', label: 'XGBoost' },
  { key: 'lr', label: 'Logistic Regression' },
  { key: 'dt', label: 'Decision Tree' },
  { key: 'svm', label: 'SVM' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState('Test Patient');
  const [modelKey, setModelKey] = useState('rf');
  const [formData, setFormData] = useState({
    age: 48, bp: 80, sg: 1.020, al: 1, su: 0, bgr: 121, bu: 36, sc: 1.2,
    sod: 135, pot: 4.5, hemo: 15.4, pcv: 44, wc: 7800, rc: 5.2,
    rbc: 'normal', pc: 'normal', pcc: 'notpresent', ba: 'notpresent'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNumericChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value === '' ? '' : Number(value) }));
  };

  const handleCategoricalChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientName: patientName.trim() || 'Anonymous',
          modelKey,
          features: formData
        })
      });

      const data = await res.json();
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/', { replace: true });
        return;
      }
      if (!res.ok) {
        throw new Error(data.message || 'Prediction request failed');
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to prediction service');
    } finally {
      setLoading(false);
    }
  };

  const topShapFeatures = useMemo(() => {
    if (!result?.featureNames || !result?.shapValues) return [];
    return result.featureNames
      .map((name, i) => ({ name, impact: Number(result.shapValues[i] ?? 0) }))
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 8);
  }, [result]);

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8 px-4 rounded-3xl relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto"
      >
        {/* Form Section */}
        <div className="bg-white/60 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-white/50">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Patient Data Input
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Enter the 18 clinical parameters for an explainable CKD assessment.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                className="block w-full rounded-xl border-gray-200 bg-white/70 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm border p-2.5 transition-all outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                ML Model
              </label>
              <select
                value={modelKey}
                onChange={(e) => setModelKey(e.target.value)}
                className="block w-full rounded-xl border-gray-200 bg-white/70 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm border p-2.5 transition-all outline-none"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>

            {NUMERIC_FIELDS.map(({ key, label, step }) => (
              <div key={key} className="relative group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 transition-colors group-focus-within:text-indigo-600">
                  {label}
                </label>
                <input
                  type="number"
                  step={step}
                  required
                  name={key}
                  value={formData[key]}
                  onChange={(e) => handleNumericChange(key, e.target.value)}
                  className="block w-full rounded-xl border-gray-200 bg-white/50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm border p-2.5 transition-all outline-none"
                />
              </div>
            ))}

            {CATEGORICAL_FIELDS.map(({ key, label, options }) => (
              <div key={key} className="relative group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 transition-colors group-focus-within:text-indigo-600">
                  {label}
                </label>
                <select
                  name={key}
                  value={formData[key]}
                  onChange={(e) => handleCategoricalChange(key, e.target.value)}
                  className="block w-full rounded-xl border-gray-200 bg-white/50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm border p-2.5 transition-all outline-none"
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="col-span-2 sm:col-span-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-200 text-md font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? 'Analyzing with AI...' : 'Predict CKD Status'}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div>
          {result ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className={`p-8 rounded-3xl shadow-xl border border-white/40 backdrop-blur-md text-white overflow-hidden relative ${result.prediction === 1 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-emerald-400 to-green-600'}`}>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
                <h2 className="text-3xl font-extrabold relative z-10">
                  {result.prediction === 1 ? 'High Risk of CKD' : 'Healthy / Low Risk'}
                </h2>
                <p className="mt-2 text-xl font-medium relative z-10">
                  CKD Probability: {(result.probability * 100).toFixed(1)}%
                </p>
                <p className="text-sm opacity-90 mt-4 bg-black/10 inline-block px-3 py-1 rounded-full relative z-10">
                  Model: {result.modelUsed?.toUpperCase()}
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-white/50">
                <h3 className="text-xl font-extrabold mb-6 text-gray-800">AI Explainability (SHAP)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topShapFeatures} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {topShapFeatures.map((entry, index) => (
                          <Cell key={`cell-${entry.name}-${index}`} fill={entry.impact > 0 ? '#ef4444' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs font-semibold text-gray-600">Pushes towards CKD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-semibold text-gray-600">Protective / Healthy</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white/40 backdrop-blur-md p-10 rounded-3xl shadow-lg border border-white/50 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700">Awaiting Data</h3>
              <p className="text-gray-500 mt-2">Fill the form and click predict to see AI results and SHAP explainability charts.</p>
            </div>
          )}
        </div>
      </motion.div>

      <Chatbot patientContext={result} />
    </div>
  );
}
