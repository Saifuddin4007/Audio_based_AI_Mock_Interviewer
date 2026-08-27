import React, { useState } from "react";
import { signup } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

const Signup: React.FC = () => {

  const [email, setEmail] = useState<string>("");
  const [paswd, setPaswd] = useState<string>("");
  const [emailMsg, setEmailMsg] = useState<string>("");
  const [paswdMsg, setPaswdMsg] = useState<string>("");
  const [signUpResShow, setSignupResShow] = useState<string>("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    setEmailMsg("");
    setPaswdMsg("");
    setSignupResShow("");

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
      const res = await signup(email, paswd);
      if (res) {
        navigate('/login');
      }
    } catch {
      setSignupResShow("Signup Failed")
    }
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-pink-600 mb-6">Sign Up</h2>

        <form className="space-y-5" onSubmit={(e) => handleSubmit(e)}>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
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
              onChange={(e) => setPaswd(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="Create a password"
            />
            {paswdMsg &&
              (<p className="mt-1 text-sm text-red-500">
                {paswdMsg}
              </p>)}
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
          >
            Sign Up
          </button>

        </form>
        {signUpResShow &&
          (<p className="mt-1 text-sm text-red-500">
            {signUpResShow}
          </p>)}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}

          <Link to="/login" className="text-pink-600 hover:text-pink-700 font-medium">
            Login
          </Link>

        </p>

      </div>
    </div>
  );
};

export default Signup;
