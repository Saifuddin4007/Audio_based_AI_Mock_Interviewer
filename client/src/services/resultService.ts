import api from "./api";
import axios from 'axios';
import type { Result } from '../types/result'
import type { ApiError } from "../types/error";

interface GetOneResult {
    result: Result;
    message: string;
}

interface GetAllResults {
    results: Result[];
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