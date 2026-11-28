const express = require('express');
const Prediction = require('../models/Prediction');
const requireLogin = require('../middleware/auth');
const sendCKDAlert = require('../utils/emailAlert');

const router = express.Router();

// GET /api/predictions/wakeup — Wake up Render ML API in background when user opens Dashboard
router.get('/wakeup', async (req, res) => {
    const baseUrl = (process.env.ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    fetch(baseUrl).catch(() => {});
    res.json({ ok: true });
});

async function callMlPredict(baseUrl, payload) {
    const url = `${baseUrl}/predict`;
    const opts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };

    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            const response = await fetch(url, opts);
            if (response.status < 502) return response;
        } catch {
            // Network/cold-start error — wait and retry
        }
        await new Promise((r) => setTimeout(r, 5000));
    }
    return fetch(url, opts);
}

// POST /api/predictions — Send patient data to ML API and save result
router.post('/', requireLogin, async (req, res) => {
    try {
        const { patientName, features, modelKey } = req.body;
        if (!features) {
            return res.status(400).json({ message: 'Patient features are required' });
        }

        const baseUrl = (process.env.ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
        const mlResponse = await callMlPredict(baseUrl, { ...features, model_key: modelKey || 'rf' });

        if (!mlResponse.ok) {
            const err = await mlResponse.json().catch(() => ({}));
            throw new Error(err.detail || 'ML API failed');
        }

        const mlResult = await mlResponse.json();

        const saved = await Prediction.create({
            userId: req.user._id,
            patientName: (patientName || 'Anonymous').trim(),
            features,
            prediction: mlResult.prediction,
            probability: mlResult.probability,
            modelUsed: mlResult.model,
            shapValues: mlResult.shap_values,
            featureNames: mlResult.feature_names,
            baseValue: mlResult.base_value
        });

        // Send email alert if patient is high risk (non-blocking)
        if (mlResult.prediction === 1) {
            sendCKDAlert(patientName || 'Anonymous', mlResult.probability).catch(() => {});
        }

        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/predictions/history — Get saved predictions
router.get('/history', requireLogin, async (req, res) => {
    try {
        const filter = req.user.role === 'doctor' ? {} : { userId: req.user._id };
        const history = await Prediction.find(filter).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
