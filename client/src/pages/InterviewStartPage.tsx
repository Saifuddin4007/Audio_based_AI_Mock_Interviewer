import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { abandonInterview, submitAnswerAndNext } from "../services/interviewService";
import { getOneSession } from "../services/sessionService";
import AIInterviewRecorder from "../components/AIInterviewRecorder";
import { uploadAudio } from "../services/speechService";
import DisplayError from "../components/DisplayError";
import QuestionAudio from "../components/QuestionAudio";

const AUDIO_INTERVIEW_TYPES = ["Technical", "HR", "Behavioral"] as const;
const MAX_CODE_ANSWER_CHARS = 12000;

const InterviewStartPage: React.FC = () => {
  const location = useLocation();

  const questionAsked = location.state?.question;
  const quesNum = location.state?.questionNumber;
  const questionAudioAsked = location.state?.audio;
  const questionAudioMimeTypeAsked = location.state?.audioMimeType;


  const [question, setQuestion] = useState<string>(questionAsked ?? "");
  const [candidateAnswer, setCandidateAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [questionNumber, setQuestionNumber] = useState<number>(quesNum ?? 1);
  const [seconds, setSeconds] = useState<number>(0);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("");
  const [recorderKey, setRecorderKey] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questionAudio, setQuestionAudio] = useState<string>(questionAudioAsked ?? "");
  const [questionAudioMimeType, setQuestionAudioMimeType] = useState<string>(questionAudioMimeTypeAsked ?? "");
  const [interviewType, setInterviewType] = useState<string>("");

  const canUseAudio = AUDIO_INTERVIEW_TYPES.includes(
    interviewType as (typeof AUDIO_INTERVIEW_TYPES)[number]
  );


  const { sessionId } = useParams<{ sessionId: string }>();

  const navigate = useNavigate();


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

      setHasAnswered(true);

      if ("question" in response) {
        setQuestion(response.question);
        setQuestionNumber(response.questionNumber);
        setQuestionAudio(response.audio);
        setQuestionAudioMimeType(response.audioMimeType);
        setCandidateAnswer("");
      } else {
        navigate(`/result/${sessionId}`, { replace: true });
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to submit answer.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleRecordingComplete = (blob: Blob, fileName: string) => {
    setAudioBlob(blob);
    setAudioFileName(fileName);
    console.log("Parent received audio:", fileName, blob.size, "bytes");
  };

  const handleRecordingStart = () => {
    setCandidateAnswer("");
  }

  const handleAudioAnswer = async () => {

    if (!canUseAudio) {
      setError("Audio answers aren't supported for this interview type");
      return;
    }

    if (!audioBlob || !audioFileName) {
      alert("Please record first.");
      return;
    }

    if (!sessionId) {
      alert("Invalid Interview session");
      return;
    }

    try {
      setIsSubmitting(true);

      // This calls the speechService we fixed earlier
      const uploadResponse = await uploadAudio(sessionId, audioBlob, audioFileName);
      console.log("Upload successful:", uploadResponse);

      setHasAnswered(true);

      if ("question" in uploadResponse) {
        setQuestion(uploadResponse.question);
        setQuestionNumber(uploadResponse.questionNumber);

        setQuestionAudio(uploadResponse.audio);
        setQuestionAudioMimeType(uploadResponse.audioMimeType);

        setAudioBlob(null);
        setAudioFileName("");
        setRecorderKey((prevKey) => prevKey + 1);
      } else {
        navigate(`/result/${sessionId}`, { replace: true });
      }



    } catch (err) {
      console.error("Error submitting answer: ", err);
      alert("Failed to submit answer.");
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasAudioAnswer = audioBlob !== null;


  const handleRecordingDiscard = () => {
    setAudioBlob(null);
    setAudioFileName("");
  }

  const handleEndInterview = async () => {

    if (!hasAnswered) {
      alert("Please answer at least one question before ending the interview");
      return;
    }

    try {
      setIsEnding(true);
      if (sessionId) {
        const abandonRes = await abandonInterview(sessionId);

        if (abandonRes) {
          navigate(`/result/${sessionId}`, { replace: true });
        }
      }
    } catch {
      console.log("Error abandoning interview");
    } finally {
      setIsEnding(false);
    }
  }

  useEffect(() => {
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

  useEffect(() => {
    const checkSessionStatus = async () => {
      if (!sessionId) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const res = await getOneSession(sessionId);
        setInterviewType(res.session.interviewType);

        if (res.session.status === "completed") {
          navigate(`/result/${sessionId}`, { replace: true });
          return;
        }

        if (res.session.status === "abandoned") {
          navigate(`/result/${sessionId}`, { replace: true });
          return;
        }
      } catch (err) {
        console.error(err);
        setSessionError(true);
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSessionStatus();
  }, [sessionId, navigate]);


  if (sessionError) {
    return <DisplayError error={error ? error : 'Invalid session'} isResultPage={false} goBackPath="/welcome" />
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking interview session...</p>
      </div>
    );
  }

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
              className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer"
              onClick={handleEndInterview}
              disabled={isEnding || isSubmitting || isRecording}
            >
              End Interview
            </button>
          </div>
        </div>

        {/* Question Display */}
        {/* <div className="bg-white shadow-md rounded-lg p-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Question</h3>
          <div className="border border-gray-300 rounded-lg p-6 text-center text-gray-600">
            {question}
          </div>
        </div> */}

        <div className="bg-white shadow-md rounded-lg p-8">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Question</h3>

            <QuestionAudio
              audio={questionAudio}
              audioMimeType={questionAudioMimeType}
              autoPlay={true}
            />

          </div>

          <div className="border border-gray-300 rounded-lg p-6 text-center text-gray-600">
            {question}
          </div>
        </div>

        {/* AI Model Section */}
        <div className="bg-white shadow-md rounded-lg p-10 flex flex-col items-center space-y-4">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/robo.png" className="w-full h-full object-cover" alt="AI Robo" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">AI Interviewer</h3>
        </div>

        {/* Answer Section */}
        <div className="bg-white shadow-md rounded-lg p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type your Answer
          </label>
          <textarea
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            disabled={isRecording || hasAudioAnswer}
            value={candidateAnswer}
            onChange={(e) => {
              setCandidateAnswer(e.target.value);
              setError(null);
            }}
            placeholder={
              hasAudioAnswer ? "Audio mode selected. Discard the recording to type an answer." : "Type your answer here..."
            }
            rows={4}
          ></textarea>
          {(interviewType === "Coding" || interviewType === "DSA") && (
            <p className="text-sm text-gray-500 text-right">
              {candidateAnswer.length} / {MAX_CODE_ANSWER_CHARS} characters
            </p>
          )}

          {/* Recorder + Submit */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-2">
              {
                canUseAudio ? (


                  <AIInterviewRecorder key={recorderKey}
                    onRecordingStateChange={setIsRecording}
                    onRecordingStart={handleRecordingStart}
                    onRecordingComplete={handleRecordingComplete}
                    onRecordingDiscard={handleRecordingDiscard}
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    Text answers only for {interviewType} interviews.
                  </p>
                )
              }
            </div>
            <button
              className="py-3 px-8 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition cursor-pointer"
              onClick={canUseAudio && hasAudioAnswer ? handleAudioAnswer : handleSubmitAnswer}
              disabled={isSubmitting || isRecording}
            >
              {canUseAudio && hasAudioAnswer ? "Submit Audio" : "Submit Text"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewStartPage;
