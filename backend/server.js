const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Use Google/Cloudflare DNS so MongoDB Atlas SRV lookup does not time out on local Wi-Fi
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/predictions', require('./routes/predict'));
app.use('/api/chat',        require('./routes/chat'));
app.use('/api/diet',        require('./routes/diet'));

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'CKD Backend is running.' });
});

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ckd_db')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err.message));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
