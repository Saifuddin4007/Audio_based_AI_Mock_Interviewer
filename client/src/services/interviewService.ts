import type { ApiError } from '../types/error';
import type { Result } from '../types/result';
import api from './api';
import axios from 'axios';


interface QuestionResponse {
    question: string;
    questionNumber: number;
    audio: string;
    audioMimeType: string;
    message?: string;
}

interface FinalResultResponse {
    message: string;
    result: Result;
}

type SubmitAnswerAndNext = QuestionResponse | FinalResultResponse;

interface AbandonInterview {
    message: string;
    result: Result;
}




export async function startInterview(sessionId: string): Promise<QuestionResponse> {
    try {
        const response = await api.post<QuestionResponse>('/api/v1/interview/start', { sessionId });
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