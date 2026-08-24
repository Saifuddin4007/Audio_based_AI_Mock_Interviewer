import axios from 'axios';
import { refresh } from './authService';


// This is the Axios instance used for your API requests.
//
// withCredentials: true is IMPORTANT because your refresh token
// is stored inside an httpOnly cookie.
//
// JavaScript cannot read the cookie, but the browser can automatically
// attach it to requests to your backend.
//
// Therefore:
//   React/JS  ---> cannot see refreshToken
//   Browser   ---> automatically sends refreshToken cookie
//   Backend   ---> reads req.cookies.refreshToken


const api= axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
})

export default api;



// ------------------------------------------------------------
// ACCESS TOKEN STORAGE
// ------------------------------------------------------------
//
// We intentionally keep the access token only in memory.
//
// We are NOT putting it into:
//   - localStorage
//   - sessionStorage
//   - a cookie
//
// The variable below belongs to this JavaScript module.
//
// Think of it as:
//
//     api.ts
//       |
//       └── accessToken = "eyJ...."
//
// Axios interceptors can read this variable before making requests.

let accessToken: string | null= null;



// AuthContext calls this function after login.
//
// Example:
//
//     login response
//          ↓
//     accessToken received
//          ↓
//     setApiAccessToken(accessToken)
//          ↓
//     api.ts remembers the token
//
// We need this because the Axios interceptor lives in api.ts,
// not inside AuthContext.
//
// AuthContext knows about React state.
// api.ts knows about HTTP requests.
//
// This function connects those two worlds.

export const setApiAccessToken= (token: string | null)=> {
    accessToken= token;
}





// ------------------------------------------------------------
// REQUEST INTERCEPTOR
// ------------------------------------------------------------
//
// This runs BEFORE every request made through `api`.
//
// Example:
//
//     api.get('/api/v1/auth/me')
//
// Before Axios actually sends that request, this interceptor runs.
//
// If an access token exists:
//
//     Authorization: Bearer <accessToken>
//
// is automatically added.
//
// Therefore your React components do NOT have to repeatedly write:
//
//     headers: {
//         Authorization: `Bearer ${token}`
//     }
//
// for every protected request.
api.interceptors.request.use(
    (config)=> {
        if(accessToken){
            config.headers.Authorization= `Bearer ${accessToken}`;
        }
        return config;
    },
    (error)=> {
        return Promise.reject(error);
    }
);





// ------------------------------------------------------------
// RESPONSE INTERCEPTOR
// ------------------------------------------------------------
//
// This runs when the backend responds to a request.
//
// Normally:
//
//     request → backend → 200 → return response
//
// But suppose the access token has expired:
//
//     request
//        ↓
//     Authorization: Bearer OLD_TOKEN
//        ↓
//     backend
//        ↓
//     401 Unauthorized
//
// The interceptor catches that 401.
//
// It then:
//
//     1. Calls /auth/refresh
//     2. Browser automatically sends refreshToken cookie
//     3. Backend verifies the refresh token
//     4. Backend rotates it and sends a new access token
//     5. We save the new access token in api.ts
//     6. We put the new token on the failed request
//     7. We send that request again
//
// The component that originally called the API does not need to
// manually understand this whole process.
api.interceptors.response.use(
    (response)=> {
        // Return the response if it's successful
        return response;
    },
    async (error)=> {
        // Axios normally gives us the configuration of the request
        // that failed.
        //
        // Example:
        //
        // originalRequest = {
        //     url: "/api/v1/auth/me",
        //     method: "get",
        //     headers: {...}
        // }
        const originalRequest= error.config;

        if(!originalRequest){
            return Promise.reject(error);
        }

         // --------------------------------------------------------
        // AUTH ENDPOINT CHECK
        // --------------------------------------------------------
        //
        // We DON'T want the automatic refresh mechanism to react
        // to authentication endpoints themselves.
        //
        // Especially /auth/refresh.
        //
        // Imagine:
        //
        //     /me
        //       ↓
        //      401
        //       ↓
        //     interceptor
        //       ↓
        //     /refresh
        //       ↓
        //      401
        //
        // If we tried to refresh again because /refresh itself
        // returned 401, we could create a refresh loop.
        //
        // Therefore login, logout and refresh are excluded.
        const isAuthEndpoint= 
            originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/logout');

        
        // --------------------------------------------------------
        // SHOULD WE ATTEMPT REFRESH?
        // --------------------------------------------------------
        //
        // All of these conditions must be true:
        //
        // 1. Backend returned 401
        //    → access token may be expired
        //
        // 2. originalRequest exists
        //    → we have a request to retry
        //
        // 3. !_retry
        //    → don't retry the same request infinitely
        //
        // 4. !isAuthEndpoint
        //    → don't automatically refresh login/refresh/logout

        // Check if the error is due to an unauthorized request
        if(error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint
        ){
             // Mark this request as already retried.
            //
            // Without this, imagine the new access token also fails:
            //
            // request
            //    ↓
            // 401
            //    ↓
            // refresh
            //    ↓
            // retry
            //    ↓
            // 401 again
            //    ↓
            // refresh again
            //    ↓
            // ...
            //
            // _retry prevents that infinite cycle for this request.

            originalRequest._retry= true; // Prevent infinite loop
            
            try{
                // ------------------------------------------------
                // GET A NEW ACCESS TOKEN
                // ------------------------------------------------
                //
                // We do NOT send the refresh token manually.
                //
                // `withCredentials: true` makes the browser send
                // the httpOnly refreshToken cookie automatically.
                //
                // Backend:
                //
                //     req.cookies.refreshToken
                //
                // receives it.

                // Attempt to refresh the access token
                const res= await refresh();
                const newAccessToken= res.accessToken;

                // Save the new access token in the module-level
                // variable.
                //
                // From this point onward, future Axios requests
                // will use the new token.
                setApiAccessToken(newAccessToken);


                // ------------------------------------------------
                // UPDATE THE FAILED REQUEST
                // ------------------------------------------------
                //
                // The failed request still contains the OLD token.
                //
                // Example:
                //
                //     Authorization: Bearer OLD_TOKEN
                //
                // We replace it with:
                //
                //     Authorization: Bearer NEW_TOKEN
                //
                // Otherwise retrying the request would simply send
                // the expired token again.

                // Update the original request's Authorization header
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;


                // ------------------------------------------------
                // RETRY THE ORIGINAL REQUEST
                // ------------------------------------------------
                //
                // Now we send the original request again.
                //
                // Example:
                //
                //     GET /api/v1/auth/me
                //          ↓
                //     OLD token → 401
                //          ↓
                //     refresh()
                //          ↓
                //     NEW token
                //          ↓
                //     GET /api/v1/auth/me
                //          ↓
                //     NEW token → 200

                // Retry the original request with the new token
                return api(originalRequest);
            }catch(err){
                // Refresh itself failed.
                //
                // This normally means:
                //
                // - refresh token expired
                // - refresh token was revoked
                // - refresh token was reused
                // - user is no longer valid
                //
                // At that point the frontend cannot silently
                // restore the session.
                console.error('Token refresh failed', err);
                 return Promise.reject(err);
            }
        }

         // If this wasn't a refreshable 401,
        // just pass the error back to the caller.
        //
        // For example:
        //
        // 400 → validation error
        // 403 → forbidden
        // 404 → not found
        // 500 → server error

         // Handle other errors
        return Promise.reject(error);
    }
);

