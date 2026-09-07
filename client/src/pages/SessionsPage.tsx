import React, { useEffect, useState } from "react";
import type { Result } from "../types/result";
import { getAllResults } from "../services/resultService";
import { useNavigate } from "react-router-dom";

const SessionsPage: React.FC = () => {
  
  const [isLoading, setIsLoading]= useState<boolean>(true);
  const [error, setError]= useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  const navigate= useNavigate();

  useEffect(()=>{

    const fetchRes= async ()=>{
      try{
        const res= await getAllResults();
        setResults(res.results);
      }catch(err){
        setError(err instanceof Error ? err.message : "Sessions loading failed");
      }finally{
        setIsLoading(false);
      }
    }
    fetchRes();
  }, []);


  if(isLoading){
    return(
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">
          Loading Sessions...
        </p>
      </div>
    )
  }

  if(error){
    return <div>{error}</div>;
  }



  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Interview Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">View your past interview sessions and results.</p>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {results.length===0 ?(
            <p className="text-gray-600"> You haven't completed any interviews yet.</p>
          ) : results.map((session) => (
            <div
              key={session.session._id}
              className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:shadow-sm transition-shadow"
            >
              {/* Left Side: Session Info */}
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="bg-indigo-50 text-indigo-600 font-semibold rounded-lg w-12 h-12 flex items-center justify-center text-sm">
                  #{session.session._id.slice(-6)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Session ID</p>
                  <p className="text-gray-800 font-medium text-sm">{session.session._id}</p>
                </div>
              </div>

              {/* Right Side: Status, Score & Action */}
              <div className="flex items-center space-x-6">
                <div className="text-center sm:text-right">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    {session.session.status}
                  </span>
                </div>

                <div className="text-center sm:text-right">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Score</p>
                  <p className="text-gray-800 font-bold text-lg mt-0.5">
                    {session.overallScore}<span className="text-sm font-normal text-gray-400">/100</span>
                  </p>
                </div>

                <button 
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
                  onClick={()=> navigate(`/result/${session.session._id}`)}
                  >
                  View Result
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;