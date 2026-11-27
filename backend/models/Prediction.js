const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String },
    features: {
        age: Number, bp: Number, sg: Number, al: Number, su: Number,
        bgr: Number, bu: Number, sc: Number, sod: Number, pot: Number,
        hemo: Number, pcv: Number, wc: Number, rc: Number,
        rbc: String, pc: String, pcc: String, ba: String
    },
    prediction: { type: Number, required: true }, // 1 or 0
    probability: { type: Number, required: true },
    modelUsed: { type: String, required: true },
    shapValues: [Number], // Storing SHAP values for visualization
    featureNames: [String],
    baseValue: Number,
    dietPlan: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);
