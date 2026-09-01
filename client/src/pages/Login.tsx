import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {

  const [email, setEmail] = useState<string>("");
  const [paswd, setPaswd] = useState<string>("");
  const [emailMsg, setEmailMsg] = useState<string>("");
  const [paswdMsg, setPaswdMsg] = useState<string>("");
  const [loginResShow, setLoginResShow] = useState<string>("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    setEmailMsg("");
    setPaswdMsg("");
    setLoginResShow("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    if (email === "") {
      setEmailMsg("Email box can't be empty");
      return;
    }
    if (!isValidEmail) {
      setEmailMsg("Invalid email: must contain '@' and a domain");
      return;
    }

    const customEmail= email.trim().toLowerCase();

    const paswdRegex = /^.{8,}$/;
    const isValidPaswd = paswdRegex.test(paswd);

    if (paswd === "") {
      setPaswdMsg("Password box can't be empty");
      return;
    }
    if (!isValidPaswd) {
      setPaswdMsg("At least 8 characters");
      return;
    }

    try {
      await login(customEmail, paswd);

      navigate("/");

    } catch {
      setLoginResShow("Login Failed")
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">Login</h2>
        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value= {email}
              onChange= {(e)=>{setEmail(e.target.value)}}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter your email"
            />
            {emailMsg &&
              (<p className="mt-1 text-sm text-red-500">
                {emailMsg}
              </p>)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={paswd}
              onChange={(e) => { setPaswd(e.target.value) }}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter your password"
            />
            {paswdMsg &&
              (<p className="mt-1 text-sm text-red-500">
                {paswdMsg}
              </p>)}
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Login
          </button>
        </form>
        {loginResShow &&
          (<p className="mt-1 text-sm text-red-500">
            {loginResShow}
          </p>)}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
