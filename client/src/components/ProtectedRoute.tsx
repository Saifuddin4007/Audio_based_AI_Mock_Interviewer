import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"


const ProtectedRoute = () => {

    const { user, isLoading } = useAuth();


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )

    }

    if(!user){
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

export default ProtectedRoute