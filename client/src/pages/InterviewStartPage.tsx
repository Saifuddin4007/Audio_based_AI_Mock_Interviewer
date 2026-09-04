import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { abandonInterview, submitAnswerAndNext } from "../services/interviewService";

const InterviewStartPage: React.FC = () => {
  const location = useLocation();

  const questionAsked = location.state?.question;
  const quesNum= location.state?.questionNumber;

  const [question, setQuestion] = useState<string>(questionAsked ?? "");
  const [candidateAnswer, setCandidateAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [questionNumber, setQuestionNumber]= useState<number>(quesNum ?? 0);
  const [seconds, setSeconds]= useState<number>(0);
  const [isEnding, setIsEnding]= useState<boolean>(false);


  const { sessionId } = useParams<{ sessionId: string }>();

  const navigate= useNavigate();


  const handleSubmitAnswer = async (): Promise<void> => {

    if (!candidateAnswer.trim()) {
      alert("Please enter your answer");
      return;
    }

    if (!sessionId) {
      alert("Invalid Interview session");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await submitAnswerAndNext(sessionId, candidateAnswer);

      if ("question" in response) {
        setQuestion(response.question);
        setQuestionNumber(response.questionNumber);
        setCandidateAnswer("");
      }else{
        navigate(`/result/${sessionId}`);
      }

    } catch {
      console.log("Error submitting answer");
    } finally {
      setIsSubmitting(false);
    }
  }


  const handleEndInterview= async ()=>{
    try{
      setIsEnding(true);
      if(sessionId){
        const abandonRes= await abandonInterview(sessionId);
        
        if(abandonRes){
          navigate(`/result/${sessionId}`);
        }
      }
    }catch{
      console.log("Error abandoning interview");
    }finally{
      setIsEnding(false);
    }
  }

  useEffect(()=>{
    // Start timer when component mounts
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Stop timer when component unmounts
    return () => clearInterval(interval);
  }, []);

  // Format as mm:ss
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-10 space-y-8">
        {/* Top Section */}
        <div className="bg-white shadow-md rounded-lg p-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-indigo-600">Question</h2>
              <p className="text-gray-600">Qn No. {questionNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-gray-700">Internal Time: {formatTime(seconds)}</div>
            <button 
              className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              onClick={handleEndInterview}
              disabled={isEnding}
              >
              End Interview
            </button>
          </div>
        </div>

        {/* Question Display */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Question</h3>
          <div className="border border-gray-300 rounded-lg p-6 text-center text-gray-600">
            {question}
          </div>
        </div>

        {/* AI Model Section */}
        <div className="bg-white shadow-md rounded-lg p-10 flex flex-col items-center space-y-4">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl">🎤</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">AI Model Name</h3>
        </div>

        {/* Answer Section */}
        <div className="bg-white shadow-md rounded-lg p-8 space-y-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type your Answer
          </label>
          <textarea
            placeholder="Write your answer here..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            value={candidateAnswer}
            onChange={(e) => setCandidateAnswer(e.target.value)}
            rows={4}
          ></textarea>

          {/* Recorder + Submit */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow hover:bg-indigo-600 transition">
                🎤
              </button>
            </div>
            <button
              className="py-3 px-8 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting}
            >
              Submit Answer
            </button>
          </div>
        </div>
      </main>

      {/* Sidebar on Right */}
      <Sidebar />
    </div>
  );
};

export default InterviewStartPage;
