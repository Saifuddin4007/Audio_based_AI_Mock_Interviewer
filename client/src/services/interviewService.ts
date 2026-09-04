import api from './api';
import axios from 'axios';


interface StartInterview {
    question: string;
    questionNumber: number;
    message?: string;
}

interface NextQuestionResponse {
    question: string;
    questionNumber: number;
}

interface FinalResultResponse {
    message: string;
    result: Result;
}

type SubmitAnswerAndNext = NextQuestionResponse | FinalResultResponse;

interface AbandonInterview {
    message: string;
    result: Result;
}

interface Result {
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

interface Session {
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

type Difficulty = "Beginner" | "Early-Intermediate" |"Intermediate" | "Early-Advanced" | "Advanced"  |"Masters" ;

type InterviewType = "Technical" | "Behavioral"| "System-Design" | "Coding" | "DSA" | "HR" ;

type Status=  "in_progress" | "abandoned" | "completed" ;

interface ApiError {
    message: string;
}


export async function startInterview(sessionId: string): Promise<StartInterview> {
    try {
        const response = await api.post<StartInterview>('/api/v1/interview/start', { sessionId });
        return response.data;
    } catch (err: unknown) {
        if (axios.isAxiosError<ApiError>(err)) {
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", { cause: err });
    }
}


export async function submitAnswerAndNext(sessionId: string, candidateAnswer: string): Promise<SubmitAnswerAndNext> {
    try {
        const response = await api.post<SubmitAnswerAndNext>('/api/v1/interview/submit', { sessionId, candidateAnswer });
        return response.data;
    } catch (err: unknown) {
        if (axios.isAxiosError<ApiError>(err)) {
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", { cause: err });
    }
}


export async function abandonInterview(sessionId: string): Promise<AbandonInterview> {
    try {
        const response = await api.post<AbandonInterview>('/api/v1/interview/abandon', { sessionId });
        return response.data;
    } catch (err: unknown) {
        if (axios.isAxiosError<ApiError>(err)) {
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", { cause: err });
    }
}