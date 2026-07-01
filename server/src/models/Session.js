import mongoose from "mongoose";


const sessionSchema= new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        required: true,
    },
    experienceYears: {
        type: Number,
        default: 0
    },
    focusSkills: {
        type: [String],
        required: true
    },
    difficulty: {
        type: String,
        enum:[
            "Beginner",
            "Early-Intermediate",
            "Intermediate",
            "Early-Advanced",
            "Advanced",
            "Masters"
        ],
        required: true
    },
    interviewType: {
        type: String,
        enum: [
            "Technical",
            "Behavioral",
            "System-Design",
            "Coding",
            "DSA",
            "HR"
        ],
        required: true
    },
    status: {
        type: String,
        enum: [
            "in_progress",
            "abandoned",
            "completed"
        ],
        default: "in_progress"
    },
    questions: [
        {
            questionText: {
                type: String,
                required: true
            },
            answer: {
                audioURL: String,
                transcript: String,
                answeredAt: {
                    type: Date
                }
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }

});

sessionSchema.index({
    user:1,
    createdAt:-1
});

const Session= mongoose.model("Session", sessionSchema);

export default Session;