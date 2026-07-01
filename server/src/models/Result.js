import mongoose from "mongoose";


const resultSchema= new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    overallScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    technicalScore: {
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
    strengths:[String],
    weaknesses: [String],
    recommendations: [String],
    modelUsed: String,
    createdAt: {
        type: Date,
        default: Date.now
    }

});

resultSchema.index({session:1});

const Result= mongoose.model("Result", resultSchema);

export default Result;