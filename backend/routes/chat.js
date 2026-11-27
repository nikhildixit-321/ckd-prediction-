const express = require('express');
const Groq = require('groq-sdk');

const router = express.Router();

// POST /api/chat — Strictly CKD & Kidney Health Q&A powered by Groq (llama-3.3-70b-versatile)
router.post('/', async (req, res) => {
    try {
        const { message, patientContext, lang } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Please type a message.' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.json({
                response: 'Add your GROQ_API_KEY in backend/.env to enable the AI Assistant.'
            });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const replyLang = lang === 'hi' ? 'Hindi (simple, easy to understand)' : 'English';

        // Strict system prompt: ONLY answer CKD / kidney health / lab values / diet questions
        const systemPrompt = `You are Dr. AI, a specialized Nephrology (Chronic Kidney Disease) Assistant.
STRICT RULE: You ONLY answer questions related to:
1. Chronic Kidney Disease (CKD), symptoms, stages, and prevention.
2. Kidney lab values (Serum Creatinine, Blood Urea, Hemoglobin, Blood Pressure, Albumin, Sugar, Sodium, Potassium, Specific Gravity, RBC/WBC, Pus cells).
3. Kidney-friendly diet, hydration, and lifestyle tips.
4. Explaining the user's CKD prediction report and SHAP risk factors.

If the user asks ANYTHING outside these topics (such as coding, jokes, movies, sports, politics, math, general chat, or other unrelated subjects), DO NOT answer it. Politely refuse and tell them:
"I can only answer questions about Chronic Kidney Disease (CKD), kidney lab reports, symptoms, and kidney-friendly diet."

Reply in ${replyLang}. Keep answers short, clear, and friendly.`;

        // User message — include CKD result if available
        let userMessage = message.trim();
        if (patientContext) {
            userMessage += `\n\n[Patient CKD result for context: Prediction=${patientContext.prediction === 1 ? 'CKD' : 'Healthy'}, Probability=${(patientContext.probability * 100).toFixed(1)}%, Model=${patientContext.modelUsed}]`;
        }

        const chatCompletion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.5,
            max_tokens: 1024
        });

        const reply = chatCompletion.choices[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({ error: 'AI returned an empty response. Please try again.' });
        }

        res.json({ response: reply });

    } catch (error) {
        console.error('Groq API Error:', error.message);
        res.status(500).json({ error: 'AI service failed: ' + error.message });
    }
});

module.exports = router;
