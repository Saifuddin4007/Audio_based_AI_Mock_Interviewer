import api from './api';
import axios from 'axios';


interface Signup {
    message: string;
}

interface Login {
    message: string;
    accessToken: string;
    user: LoginUser;
}

interface LoginUser {
    id: string;
    email: string;
}

interface CurrentUser{
    _id: string;
    email: string;
    createdAt: string;
    lastLoginAt: string;
}


interface Refresh {
    accessToken: string;
}

interface Logout {
    message: string;
}

interface Findme {
    user: CurrentUser;
    message: string;
}

interface ApiError {
    message: string;
    error?: string;
}

export async function signup(email:string, password:string): Promise<Signup>{
    try{
        const response= await api.post<Signup>('/api/v1/auth/signup', {email, password});
        return response.data;
    }catch(err:unknown){
        if (axios.isAxiosError<ApiError>(err)) {
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", { cause: err });
    }
}

export async function login(email:string, password:string): Promise<Login>{
    try{
        const response= await api.post<Login>('/api/v1/auth/login', {email, password});
        return response.data;
    }catch(err:unknown){
        if (axios.isAxiosError<ApiError>(err)) {
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", { cause: err });
    }
}


export async function refresh(): Promise<Refresh>{
    try{
        const response= await api.post<Refresh>('/api/v1/auth/refresh');
        return response.data;
    }catch(err:unknown){
      if (axios.isAxiosError<ApiError>(err)) {
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", { cause: err });  
    }
}


export async function logout(): Promise<Logout>{
    try{
        const response= await api.post<Logout>('/api/v1/auth/logout');
        return response.data;
    }catch(err:unknown){
        if (axios.isAxiosError<ApiError>(err)) {
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
        }
        throw new Error("Unknown Error", { cause: err });    
    }
}


export async function findme(): Promise<Findme>{
    try{
        const response= await api.get<Findme>('/api/v1/auth/findme');
        return response.data;
    }catch(err:unknown){
        if (axios.isAxiosError<ApiError>(err)) {
            throw new Error(err.response?.data?.message ?? "Request Failed", { cause: err });
    
        }
        throw new Error("Unknown Error", { cause: err });   
    }
}