import api from "./api";
import axios from 'axios';


interface GetOneResult {
    result: Result;
    message: string;
}

interface GetAllResults {
    results: Result[];
    message: string;
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
    difficulty: string;
    interviewType: string;
    status: string;
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

interface ApiError {
    message: string;
}


export async function getOneResult(sessionId:string): Promise<GetOneResult>{
    try{
        const response= await api.get<GetOneResult>(`/api/v1/result/${sessionId}`);
        return response.data;
    }catch(err:unknown){
        if(axios.isAxiosError<ApiError>(err)){
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", {cause: err});
    }
}

export async function getAllResults(): Promise<GetAllResults>{
    try{
        const response= await api.get<GetAllResults>('/api/v1/result/');
        return response.data;
    }catch(err:unknown){
        if(axios.isAxiosError<ApiError>(err)){
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", {cause: err});
    }
}