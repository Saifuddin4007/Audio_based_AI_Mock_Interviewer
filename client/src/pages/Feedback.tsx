import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Result } from "../types/result";
import { getOneResult } from "../services/resultService";
import DisplayError from "../components/DisplayError";


const Feedback: React.FC = () => {

  const [result, setResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { sessionId } = useParams<{ sessionId: string }>();

  const navigate = useNavigate();

  useEffect(() => {

    const fetchResultForFeedback = async () => {
      if (!sessionId) {
        setError("Session ID is required");
        setIsLoading(false);
        return;
      }

      try {
        const response = await getOneResult(sessionId);
        if (response) {
          setResult(response.result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    fetchResultForFeedback();
  }, [sessionId]);


  if(isLoading){
    return(
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">
          Loading Result...
        </p>
      </div>
    )
  }

  if(error){
    return <DisplayError error={error} isResultPage={false} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white">Feedback Report</h1>
              </div>
              <p className="text-purple-100 ml-11">Detailed assessment analysis and recommendations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button 
            className="hover:text-purple-600 cursor-pointer transition-colors"
            onClick={()=> navigate("/welcome")}
            >Welcome</button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <button 
            className="hover:text-purple-600 cursor-pointer transition-colors"
            onClick={()=> navigate(`/result/${sessionId}`)}
            >Result</button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-purple-600 font-semibold">Feedback</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pb-12 space-y-8">

        {/* General Feedback Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              General Feedback
            </h2>
          </div>
          <div className="p-6">
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-5 bg-gray-50 custom-scrollbar">
              <p className="text-gray-700 leading-relaxed text-base">
                {result?.feedback}
              </p>
            </div>
          </div>
        </div>

        {/* Strengths and Weaknesses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Strengths
              </h2>
            </div>
            <div className="p-6">
              <div className="max-h-64 overflow-y-auto border border-green-100 rounded-xl p-5 bg-green-50 custom-scrollbar">
                <ul className="space-y-3">
                  {result?.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-700 leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Weaknesses Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Weaknesses
              </h2>
            </div>
            <div className="p-6">
              <div className="max-h-64 overflow-y-auto border border-red-100 rounded-xl p-5 bg-red-50 custom-scrollbar">
                <ul className="space-y-3">
                  {result?.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-700 leading-relaxed">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Recommendations
            </h2>
          </div>
          <div className="p-6">
            <div className="max-h-64 overflow-y-auto border border-blue-100 rounded-xl p-5 bg-blue-50 custom-scrollbar">
              <ul className="space-y-3">
                {result?.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-3 mt-1 flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-gray-700 leading-relaxed">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer / Meta Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              onClick={() => navigate(`/result/${sessionId}`)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Result</span>
            </button>
            <button 
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all font-medium"
              onClick= {()=> window.scrollTo({top:0, behavior: "smooth"})}
            >
              <span>Back to Top</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default Feedback;