// SVG arc gauge — shows CKD probability as a colour-coded speedometer
// Uses strokeDasharray on a semicircle path (no extra packages needed)

export default function RiskGauge({ probability = 0, label }) {
    const pct = Math.min(100, Math.max(0, Math.round(probability * 100)));
    const r = 70;
    const circumference = Math.PI * r; // ≈ 219.9

    // Green < 30%, Yellow 30-60%, Red > 60%
    const color = pct < 30 ? '#22c55e' : pct < 60 ? '#f59e0b' : '#ef4444';
    const riskLabel = pct < 30 ? 'Low Risk' : pct < 60 ? 'Moderate Risk' : 'High Risk';

    const filled = ((pct / 100) * circumference).toFixed(1);

    return (
        <div className="flex flex-col items-center">
            {label && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {label}
                </p>
            )}
            <svg viewBox="0 0 200 112" className="w-44">
                {/* Gray background arc */}
                <path
                    d={`M 30 100 A ${r} ${r} 0 0 1 170 100`}
                    stroke="#e5e7eb" fill="none"
                    strokeWidth="16" strokeLinecap="round"
                />
                {/* Coloured progress arc */}
                {pct > 0 && (
                    <path
                        d={`M 30 100 A ${r} ${r} 0 0 1 170 100`}
                        stroke={color} fill="none"
                        strokeWidth="16" strokeLinecap="round"
                        strokeDasharray={`${filled} ${circumference.toFixed(1)}`}
                    />
                )}
                {/* Percentage */}
                <text x="100" y="88" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>
                    {pct}%
                </text>
                {/* Scale labels */}
                <text x="30"  y="110" textAnchor="middle" fontSize="9" fill="#9ca3af">0%</text>
                <text x="100" y="22"  textAnchor="middle" fontSize="9" fill="#9ca3af">50%</text>
                <text x="170" y="110" textAnchor="middle" fontSize="9" fill="#9ca3af">100%</text>
            </svg>
            <span className="text-sm font-semibold mt-1" style={{ color }}>{riskLabel}</span>
        </div>
    );
}
