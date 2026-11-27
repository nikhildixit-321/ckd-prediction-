const express = require('express');
const requireLogin = require('../middleware/auth');

const router = express.Router();

// POST /api/compare — Runs all 5 ML models on the same patient data and returns a comparison
router.post('/', requireLogin, async (req, res) => {
    try {
        const { features } = req.body;
        if (!features) return res.status(400).json({ message: 'Patient features are required' });

        const mlBase = process.env.ML_API_URL || 'http://localhost:8000';
        const response = await fetch(`${mlBase}/predict-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(features)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'ML API comparison failed');
        }

        res.json(await response.json());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
