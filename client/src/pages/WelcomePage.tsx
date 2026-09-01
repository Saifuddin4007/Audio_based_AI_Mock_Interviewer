import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createSession } from "../services/sessionService";
import { useNavigate } from "react-router-dom";

const WelcomePage: React.FC = () => {

  const [sessionMsg, setSessionMsg] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  const { user } = useAuth();

  const handleSession = async (): Promise<void> => {
    try {

      setSessionMsg("");
      setIsCreating(true);
      
      const res = await createSession();
      setSessionMsg(res.message);
      navigate("/interview");
    } catch {
      setSessionMsg("Something went wrong");
    } finally {
      setIsCreating(false);
    }

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
          disabled={isCreating}
          className="cursor-pointer w-full py-2 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
        >
          {isCreating ? "Creating..." : "Start Interview"}
        </button>

        {sessionMsg && <p className="mt-6 text-green-400 text-center">{sessionMsg}</p>}
      </div>
    </div>
  );
};

export default WelcomePage;
