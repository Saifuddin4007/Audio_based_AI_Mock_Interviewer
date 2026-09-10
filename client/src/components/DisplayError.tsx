import { useNavigate, useParams } from "react-router-dom";


interface ErrorProps {
    error: string;
    isResultPage: boolean;
    goBackPath?: string;
}

const DisplayError = ({error, isResultPage, goBackPath}: ErrorProps) => {

  const { sessionId }= useParams<{sessionId: string}>();

  const navigate= useNavigate();

  const handleGoBack= () =>{
    if(goBackPath){
      navigate(goBackPath);
      return;
    }

    if(sessionId){
      navigate(`/result/${sessionId}`);
      return;
    }

    navigate("/welcome");
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-red-100">
        
        {/* Error Icon */}
        <div className="bg-red-100 p-4 rounded-full inline-flex mb-6">
          <svg 
            className="w-12 h-12 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {error}
        </h1>

        

        {/* Action Buttons (No logic attached) */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          {
            isResultPage ? (
              <button 
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all font-medium"
                onClick={()=> window.location.reload()}
                >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </button>
            ) : (
              <button 
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                onClick={handleGoBack}
                >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Go Back</span>
          </button>
            )
          }
          

          
        </div>

      </div>
    </div>
  );
};

export default DisplayError;