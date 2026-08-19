const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const chatRoutes = require('./routes/chat');

app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictRoutes);
app.use('/api/chat', chatRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'CKD Backend is running.' });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        dbConnected: mongoose.connection.readyState === 1
    });
});

// Start Server Independent of MongoDB
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ckd_db')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
