import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Result } from "../types/result";
import { getOneResult } from "../services/resultService";
import DisplayError from "../components/DisplayError";

const QuestionAndAnswer: React.FC = () => {
  
  const [result, setResult]= useState<Result | null>(null);
  const [isLoading, setIsLoading]= useState<boolean>(true);
  const [error, setError]= useState<string | null>(null);

  const { sessionId }= useParams<{sessionId: string}>();

  const navigate= useNavigate();

  useEffect(()=>{
    const fetchResultForQandA= async ()=> {
      if(!sessionId){
          setError("Session ID is required");
          setIsLoading(false);
          return;
        }

      try{
        const res= await getOneResult(sessionId);
        setResult(res.result);
      }catch(err){
        setError(err instanceof Error ? err.message : "An error occurred");
      }finally{
        setIsLoading(false);
      }
    }
    fetchResultForQandA();
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
    return <DisplayError error={error} isResultPage={false}/>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white">Questions & Answers</h1>
              </div>
              <p className="text-indigo-100 ml-11">Complete assessment responses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button 
            className="hover:text-indigo-600 cursor-pointer transition-colors"
            onClick={()=> navigate("/welcome")}
            >Welcome</button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <button 
            className="hover:text-indigo-600 cursor-pointer transition-colors"
            onClick={()=> navigate(`/result/${sessionId}`)}
            >Results</button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-indigo-600 font-semibold">Questions & Answers</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pb-12">

        {/* Questions List */}
        <div className="space-y-6">
          {result?.session.questions.map((question) => (
            <div
              key={question._id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Question Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md">
                      {question.questionNumber}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Question {question.questionNumber} of {result?.session.totalQuestions}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {question.answer ? (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Answered
                    </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                        Not Answered
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="bg-indigo-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Question</h3>
                      <p className="text-gray-800 font-medium text-base leading-relaxed">
                        {question.questionText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 my-4"></div>

                {/* Answer Content */}
                <div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed text-base bg-green-50/50 rounded-lg p-4 border border-green-100">
                        {question.answer?.transcript ?? "No Answer Provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                onClick={()=>navigate(`/result/${sessionId}`)}
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Result</span>
              </button>
              <button 
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
                onClick={()=> window.scrollTo({top: 0, behavior: "smooth"})}
                >
                <span>Back to Top</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAndAnswer;