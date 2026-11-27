const express = require('express');
const Groq = require('groq-sdk');
const requireLogin = require('../middleware/auth');

const router = express.Router();

// POST /api/diet — Personalized diet and lifestyle plan from Groq AI based on CKD result
router.post('/', requireLogin, async (req, res) => {
    try {
        const { prediction, probability, features } = req.body;

        if (!process.env.GROQ_API_KEY) {
            return res.json({ diet: 'Please add GROQ_API_KEY in backend/.env to get diet recommendations.' });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const condition = prediction === 1 ? 'CKD (Chronic Kidney Disease)' : 'healthy kidneys (low CKD risk)';
        const risk = ((probability || 0) * 100).toFixed(1);

        const prompt = `A patient has been diagnosed with ${condition}, CKD probability: ${risk}%.

Key lab values:
- Hemoglobin: ${features?.hemo} g/dL | Serum Creatinine: ${features?.sc} mg/dL
- Blood Urea: ${features?.bu} mg/dL   | Albumin (0–5): ${features?.al}
- Blood Glucose: ${features?.bgr} mg/dL | Specific Gravity: ${features?.sg}

Please provide a practical, personalized diet and lifestyle plan in these 5 sections:
1. ✅ Foods to Eat
2. ❌ Foods to Avoid
3. 💧 Fluid Intake
4. 🏃 Exercise & Lifestyle
5. 💡 Key Tips

Keep it short, specific, easy to follow, and tailored for Indian patients.`;

        const result = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [
                { role: 'system', content: 'You are an expert clinical nutritionist specializing in kidney disease management.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1024
        });

        const diet = result.choices[0]?.message?.content;
        if (!diet) return res.status(500).json({ error: 'AI returned an empty response. Please try again.' });

        res.json({ diet });
    } catch (error) {
        console.error('Diet API Error:', error.message);
        res.status(500).json({ error: 'Failed to generate diet plan. ' + error.message });
    }
});

module.exports = router;
