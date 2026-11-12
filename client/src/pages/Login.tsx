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

      navigate("/welcome", {replace: true});

    } catch {
      setLoginResShow("Login Failed")
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-8">
      <div className="relative flex min-h-[560px] w-full max-w-5xl items-center justify-center overflow-hidden bg-gray-50 shadow-xl">

        {/* Decorative shapes */}
        <div className="absolute -left-16 -bottom-10 h-80 w-80 rounded-[60%_40%_55%_45%/55%_45%_60%_40%] bg-gradient-to-b from-blue-200 to-cyan-300" />
        <div className="absolute -right-24 top-24 h-60 w-96 rounded-[50%_50%_45%_55%/60%_45%_55%_40%] bg-gradient-to-br from-blue-200 to-blue-400" />
        <div className="absolute left-6 top-12 h-14 w-14 rotate-[25deg] rounded-md bg-sky-200/70" />
        <div className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full border-[10px] border-indigo-100/70" />
        <div className="absolute right-[18%] top-14 h-5 w-5 rounded-full bg-indigo-300" />
        <div className="absolute left-[22%] top-10 h-3 w-3 rounded-full bg-gray-300" />
        <div className="absolute bottom-6 left-[28%] h-10 w-10 rounded-full border-4 border-sky-200" />
        <div className="absolute bottom-8 right-[32%] h-3 w-3 rounded-full bg-gray-300" />
        <div className="absolute bottom-6 right-[12%] h-10 w-10 rotate-45 rounded-sm bg-indigo-200/70" />

        {/* Card */}
        <div className="relative z-10 w-full max-w-xs rounded-lg bg-white px-9 py-10 shadow-lg">
          <h2 className="mb-8 text-center text-3xl font-extrabold leading-tight text-gray-700">
            Welcome Back
          </h2>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-gray-600">Email</label>
              <input
                type="email"
                value= {email}
                onChange= {(e)=>{setEmail(e.target.value)}}
                className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-200"
                placeholder="Enter your email"
              />
              {emailMsg &&
                (<p className="mt-1 text-xs text-red-500">
                  {emailMsg}
                </p>)}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Password</label>
              <input
                type="password"
                value={paswd}
                onChange={(e) => { setPaswd(e.target.value) }}
                className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-200"
                placeholder="Enter your password"
              />
              {paswdMsg &&
                (<p className="mt-1 text-xs text-red-500">
                  {paswdMsg}
                </p>)}
            </div>
            <button
              type="submit"
              className="mt-3 w-full rounded-full bg-gradient-to-r from-blue-400 to-sky-300 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:opacity-90"
            >
              Login
            </button>
          </form>
          {loginResShow &&
            (<p className="mt-2 text-center text-xs text-red-500">
              {loginResShow}
            </p>)}
          <p className="mt-6 text-center text-xs text-gray-500">
            Don’t have an account?{" "}
            <Link to="/signup" className="font-medium text-blue-500 hover:text-blue-600">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;