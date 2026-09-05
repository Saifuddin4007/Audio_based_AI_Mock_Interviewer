

export interface Result {
    _id: string;
    session: Session;
    overallScore: number;
    domainScore: number;
    communicationScore: number;
    feedback: string;
    isPartialEvaluation: boolean;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    modelUsed: string;
    createdAt: string;

}

export interface Session {
    _id: string;
    user: string;
    role: string;
    experienceYears: number;
    focusSkills: string[];
    totalQuestions: number;
    currentQuestion: number;
    difficulty: Difficulty;
    interviewType: InterviewType;
    status: Status;
    questions: Question[];
    createdAt: string;
    completedAt?: string;
}

interface Question {
    _id: string;
    questionNumber: number;
    questionText: string;
    answer?: Answer;
}

interface Answer {
    audioURL: string | null;
    transcript: string;
    answeredAt: string;
}

type Difficulty = "Beginner" | "Early-Intermediate" | "Intermediate" | "Early-Advanced" | "Advanced" | "Masters";

type InterviewType = "Technical" | "Behavioral" | "System-Design" | "Coding" | "DSA" | "HR";

type Status = "in_progress" | "abandoned" | "completed";

