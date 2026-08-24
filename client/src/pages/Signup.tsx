import React from "react";

const Signup: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-pink-600 mb-6">Sign Up</h2>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="Create a password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-pink-600 hover:text-pink-700 font-medium">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
