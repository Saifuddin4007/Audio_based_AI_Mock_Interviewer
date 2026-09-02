
import { useAuth } from "../context/AuthContext";

import { useNavigate } from "react-router-dom";

const WelcomePage: React.FC = () => {

  const navigate = useNavigate();

  const { user } = useAuth();

  const handleSession = ()=> {
    navigate("/interview");

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 text-center">
        {/* Greetings */}
        {user && <h1 className="text-3xl font-bold text-indigo-700 mb-7">Welcome {user.email.split("@")[0]}</h1>}

        {/* Button */}
        <button
          type="button"
          onClick={handleSession}
          className="cursor-pointer w-full py-2 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
        >
          Go To Interview Configuration
        </button>

      </div>
    </div>
  );
};

export default WelcomePage;
