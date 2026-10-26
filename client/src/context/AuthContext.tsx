import { createContext, useContext, useEffect, useState } from "react";
import { findme, login as LoginUser, logout as LogoutUser} from "../services/authService";
import { clearApiAccessToken, startNewAuthSession } from "../services/api";


interface User{
    id?: string;
    _id?: string;
    email: string;
    createdAt?: string;
    lastLoginAt?: string;
}

interface AuthContextValue{
    // Information about the currently logged-in user.
    // null = nobody is currently authenticated.
    user: User | null;

    // Used while AuthProvider is checking whether an existing
    // login session can be restored.
    isLoading: boolean;

    // These functions are exposed to React components.
    login: (email: string, password: string)=> Promise<void>;
    logout: ()=> Promise<void>;
    findMe: ()=> Promise<void>;
}

const AuthContext= createContext<AuthContextValue | null>(null);

export function AuthProvider({children}:{children: React.ReactNode}){
    const [user, setUser]= useState<User | null>(null);
    const [isLoading, setIsLoading]= useState<boolean>(true);


    useEffect(()=>{
        const initAuth= async ()=>{
            try{
                await findMe();
            }catch{
                // No valid session.
                // This is not necessarily an application error.
                // It can simply mean the user isn't logged in.
            }finally{
                // The initial authentication check is finished.
                // ProtectedRoute/components can now decide whether
                // to show the application or redirect to /login.
                setIsLoading(false);
            }
        };

        initAuth();
    }, [])


    async function login(email: string, password: string): Promise<void>{
        const response= await LoginUser(email, password);

        if(!response.accessToken){
            throw new Error("Login succeeded but no access token was returned");
        }
        startNewAuthSession(response.accessToken);
        // React now knows who is logged in.
        setUser(response.user);

    }


    async function logout(): Promise<void>{
        try{
            await LogoutUser();
        }finally{
            // Even if the server request fails,
            // remove the user from the frontend.   
            setUser(null);
            clearApiAccessToken();
            
        }
    }


    async function findMe(): Promise<void>{
        const res= await findme();
        setUser(res.user);
    }

    return (
        <AuthContext.Provider value={{
            user, isLoading, login, logout, findMe
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

