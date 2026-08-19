const express = require('express');
const router = express.Router();
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        return next();
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Make prediction
router.post('/', protect, async (req, res) => {
    try {
        const { patientName, features, modelKey } = req.body;
        if (!features || typeof features !== 'object') {
            return res.status(400).json({ message: 'Patient clinical features are required' });
        }

        const fastApiUrl = process.env.ML_API_URL || 'http://localhost:8000/predict';
        const mlPayload = {
            ...features,
            ...(modelKey ? { model_key: modelKey } : {})
        };

        const response = await fetch(fastApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mlPayload)
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.detail || `ML API responded with status ${response.status}`);
        }

        const mlResult = await response.json();

        const prediction = await Prediction.create({
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

        res.status(201).json(prediction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get history for logged in user (or all if doctor)
router.get('/history', protect, async (req, res) => {
    try {
        let history;
        if (req.user.role === 'doctor') {
            history = await Prediction.find().populate('userId', 'name email').sort({ createdAt: -1 });
        } else {
            history = await Prediction.find({ userId: req.user._id }).sort({ createdAt: -1 });
        }
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
