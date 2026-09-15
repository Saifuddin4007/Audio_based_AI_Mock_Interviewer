import type { ApiError } from "../types/error";
import type { Difficulty, InterviewType } from "../types/session";
import type { Session } from "../types/session";
import api from "./api";
import axios from "axios";


interface CreateSession {
    sessionId: string;
    message: string;
}
interface CreateSessionData {
    role: string;
    experienceYears: number;
    focusSkills: string[];
    difficulty: Difficulty;
    interviewType: InterviewType;
}

interface GetOneSession{
    message: string;
    session: Session;
}

interface GetAllSessions {
    message: string;
    sessions: Session[];
}

interface DeleteOneSession {
    message: string
}


export async function createSession({role, experienceYears, focusSkills, difficulty, interviewType}:CreateSessionData ): Promise<CreateSession>{
    try{
        const response = await api.post<CreateSession>('/api/v1/session/', {role, experienceYears, focusSkills, difficulty, interviewType});
        return response.data;
    }catch(err: unknown){
        if(axios.isAxiosError<ApiError>(err)){
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", {cause: err});
    }
}


export async function getOneSession(sessionId: string): Promise<GetOneSession>{
    try{
        const response= await api.get<GetOneSession>(`/api/v1/session/sessions/${sessionId}`);
        return response.data;
    }catch(err: unknown){
        if(axios.isAxiosError<ApiError>(err)){
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", {cause: err});
    }
}


export async function getAllSessions(): Promise<GetAllSessions>{
    try{
        const response= await api.get<GetAllSessions>('/api/v1/session/sessions');
        return response.data;
    }catch(err: unknown){
        if(axios.isAxiosError<ApiError>(err)){
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", {cause: err});
    }
}

export async function deleteOneSession(sessionId: string): Promise<DeleteOneSession>{
    try{
        const response= await api.delete<DeleteOneSession>(`/api/v1/session/sessions/${sessionId}`);
        return response.data;
    }catch(err: unknown){
        if(axios.isAxiosError<ApiError>(err)){
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", {cause: err});
    }
}