

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

export type Difficulty = "Beginner" | "Early-Intermediate" | "Intermediate" | "Early-Advanced" | "Advanced" | "Masters";

export type InterviewType = "Technical" | "Behavioral" | "System-Design" | "Coding" | "DSA" | "HR";

export type Status = "in_progress" | "abandoned" | "completed";