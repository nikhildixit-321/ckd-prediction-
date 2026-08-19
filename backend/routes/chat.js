const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/', async (req, res) => {
    try {
        const { message, patientContext } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy_key') {
            return res.status(200).json({
                response: "Developer Mode: Please add your GEMINI_API_KEY to the .env file in the backend to enable the AI Chatbot."
            });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        });

        let prompt = "You are an expert Nephrologist (Kidney Doctor) AI assistant.\nBe highly empathetic, clear, and professional.\nCRITICAL RULE: You must ONLY answer questions related to health, medicine, hospitals, kidney disease, diet, and fitness. If the user asks anything unrelated to medical, health, or hospital topics (e.g., coding, politics, jokes, general knowledge), politely refuse to answer and remind them that you are a medical assistant only.\nKeep the response concise (2-3 paragraphs max) and format it nicely for a chat interface.";

        if (patientContext) {
            prompt += "\nHere is their recent Chronic Kidney Disease prediction data for context (use this to give personalized advice): " + JSON.stringify(patientContext);
        }

        prompt += `\n\nThe user is asking: "${message.trim()}"\n`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ response: text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to generate AI response. Make sure your API key is valid." });
    }
});

module.exports = router;
