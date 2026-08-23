import { createContext, useContext, useEffect, useState } from "react";
import { findme, login as LoginUser, logout as LogoutUser, refresh } from "../services/authService";


interface User{
    id?: string;
    _id?: string;
    email: string;
    createdAt?: string;
    lastLoginAt?: string;
}

interface AuthContextValue{
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string)=> Promise<void>;
    logout: ()=> Promise<void>;
    refreshToken: ()=> Promise<string | null>;
    findMe: ()=> Promise<void>;
}

const AuthContext= createContext<AuthContextValue | null>(null);

export function AuthProvider({children}:{children: React.ReactNode}){
    const [user, setUser]= useState<User | null>(null);
    const [accessToken, setAccessToken]= useState<string | null>(null);
    const [isLoading, setIsLoading]= useState<boolean>(true);


    useEffect(()=>{
        const initAuth= async ()=>{
            try{
                const newToken= await refreshToken();

                if(newToken){
                    await findMe();
                   
                }
            }catch{
                //...
            }finally{
                setIsLoading(false);
            }
        };

        initAuth();
    }, [])




    async function login(email: string, password: string): Promise<void>{
        const response= await LoginUser(email, password);
        setUser(response.user);
        setAccessToken(response.accessToken);
    }


    async function refreshToken(): Promise<string | null>{
        try{
            const response= await refresh();
            setAccessToken(response.accessToken);
            return response.accessToken;
        }catch{
            setUser(null);
            setAccessToken(null);
            return null;
        }
    }


    async function logout(): Promise<void>{
        try{
            await LogoutUser();
        }finally{
            setUser(null);
            setAccessToken(null);
        }
    }

    async function findMe(): Promise<void>{
        const res= await findme();
        setUser(res.user);
    }

    return (
        <AuthContext.Provider value={{
            user, accessToken, isLoading, login, logout, refreshToken, findMe
        }}
        >
            {children}
        </AuthContext.Provider>
    )
}


export function useAuth(): AuthContextValue{
    const contxt= useContext(AuthContext);
    if (!contxt) throw new Error('useAuth must be used inside <AuthProvider>');
    return contxt;
}

