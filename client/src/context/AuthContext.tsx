import { createContext, useContext, useEffect, useState } from "react";
import { findme, login as LoginUser, logout as LogoutUser} from "../services/authService";
import { setApiAccessToken } from "../services/api";


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



    // ----------------------------------------------------------
    // INITIAL AUTHENTICATION CHECK
    // ----------------------------------------------------------
    //
    // This runs when AuthProvider is mounted.
    //
    // Why do we need it?
    //
    // Imagine the user logged in yesterday.
    //
    // Today they open:
    //
    //     /dashboard
    //
    // React starts from scratch.
    //
    // The access token is stored only in memory,
    // so it is gone after a full page reload.
    //
    // But the refreshToken cookie still exists in the browser.
    //
    // We call findMe().
    //
    // findMe() → GET /auth/me
    //
    // The request interceptor notices that there is currently
    // no access token and therefore sends /me without Authorization.
    //
    // Backend responds:
    //
    //     401
    //
    // Response interceptor catches that 401.
    //
    // It automatically calls:
    //
    //     POST /auth/refresh
    //
    // Browser automatically sends the httpOnly refreshToken cookie.
    //
    // Backend returns a NEW access token.
    //
    // Response interceptor stores that token in api.ts and retries
    // the original /me request.
    //
    // /me now succeeds.
    //
    // findMe() receives the user.
    //
    // setUser(user)
    //
    // Therefore the React application knows:
    //
    // "Yes, this user still has a valid session."
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


 // ----------------------------------------------------------
    // LOGIN
    // ----------------------------------------------------------
    //
    // A React component calls:
    //
    //     login(email, password)
    //
    // This function:
    //
    //     1. Sends credentials to backend.
    //     2. Backend verifies credentials.
    //     3. Backend returns accessToken.
    //     4. Backend also sets refreshToken cookie.
    //     5. We save user in React state.
    //     6. We give accessToken to api.ts.
    async function login(email: string, password: string): Promise<void>{
        const response= await LoginUser(email, password);
        // React now knows who is logged in.
        setUser(response.user);

         // Give the access token to Axios.
        //
        // This is VERY important.
        //
        // The Axios request interceptor lives in api.ts.
        // It reads the module-level `accessToken` variable there.
        //
        // Therefore this connects:
        //
        //     login response
        //          ↓
        //     AuthContext
        //          ↓
        //     setApiAccessToken()
        //          ↓
        //     api.ts
        //          ↓
        //     request interceptor
        //          ↓
        //     Authorization: Bearer <token>
        setApiAccessToken(response.accessToken);
    }


// ----------------------------------------------------------
    // LOGOUT
    // ----------------------------------------------------------
    //
    // React component calls:
    //
    //     logout()
    //
    // Backend logout:
    //
    //     1. Reads refreshToken cookie.
    //     2. Revokes the refresh token in MongoDB.
    //     3. Clears the refreshToken cookie.
    //
    // Frontend then:
    //
    //     1. Removes user from React state.
    //     2. Removes access token from api.ts.
    async function logout(): Promise<void>{
        try{
            await LogoutUser();
        }finally{
            // Even if the server request fails,
            // remove the user from the frontend.   
            setUser(null);

            // IMPORTANT:
            //
            // Otherwise api.ts could continue sending the old
            // access token in Authorization headers.
            //
            // After this:
            //
            //     accessToken = null
            //
            // so the request interceptor stops attaching it.
            setApiAccessToken(null);
        }
    }


    
    // ----------------------------------------------------------
    // FIND CURRENT USER
    // ----------------------------------------------------------
    //
    // Calls:
    //
    //     GET /auth/me
    //
    // The Axios request interceptor automatically attaches the
    // current access token if one exists.
    //
    // If that access token is expired:
    //
    //     /me → 401
    //          ↓
    //     response interceptor
    //          ↓
    //     /refresh
    //          ↓
    //     new access token
    //          ↓
    //     retry /me
    //
    // We don't need to manually implement that logic here.
    //
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




// --------------------------------------------------------------
// useAuth CUSTOM HOOK
// --------------------------------------------------------------
//
// Components should NOT repeatedly write:
//
//     useContext(AuthContext)
//
// Instead they simply write:
//
//     const { user, login, logout } = useAuth();
//
// This custom hook is just a convenient wrapper around
// useContext(AuthContext).
//
// It also gives us a safety check:
// //
// If someone uses useAuth() outside AuthProvider:
//
//     useAuth()
//         ↓
//     AuthContext = null
//
// We throw a clear error instead of allowing confusing behavior.
//
export function useAuth(): AuthContextValue{
    const contxt= useContext(AuthContext);
    if (!contxt) throw new Error('useAuth must be used inside <AuthProvider>');
    return contxt;
}

