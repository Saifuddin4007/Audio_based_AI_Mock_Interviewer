import mongoose from "mongoose";


const resultSchema= new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
        unique: true
    },
    overallScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    domainScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    communicationScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    feedback: {
        type: String,
        required: true
    },
    isPartialEvaluation: {
        type: Boolean,
        default: false
    },
    strengths:[String],
    weaknesses: [String],
    recommendations: [String],
    modelUsed: String,
    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Result= mongoose.model("Result", resultSchema);

export default Result;