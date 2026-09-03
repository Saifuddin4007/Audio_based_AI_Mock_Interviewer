import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // import the new component
import { startInterview } from "../services/interviewService";
import { createSession } from "../services/sessionService";

const InterviewPage: React.FC = () => {
  const [role, setRole] = useState<string>("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [focusSkills, setFocusSkills] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [interviewType, setInterviewType] = useState<InterviewType | "">("");
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const navigate = useNavigate();

  type Difficulty = "Beginner" | "Early-Intermediate" | "Intermediate" | "Early-Advanced" | "Advanced" | "Masters";

  type InterviewType = "Technical" | "Behavioral" | "System-Design" | "Coding" | "DSA" | "HR";


  // placeholder for your logic later
  const handleInterview = async (): Promise<void> => {

    const cleanedSkills= focusSkills.split(",").map((skill) => skill.trim()).filter((skill)=> skill !== "");

    try {

      setIsStarting(true);

      if (!difficulty) {
        alert("Please select a difficulty level");
        return;
      }
      if (!interviewType) {
        alert("Please select an interview type");
        return;
      }
      if (!role) {
        alert("Please enter a role");
        return;
      }
      if (experienceYears<0) {
        alert("Please enter your experience years");
        return;
      }
      if (cleanedSkills.length === 0) {
        alert("Please select at least one focus skill");
        return;
      }


      const res = await createSession({ role, experienceYears, focusSkills: cleanedSkills, difficulty, interviewType });

      const sessionId = res.sessionId;

      if (sessionId) {
        const interviewRes = await startInterview(sessionId);
        if (interviewRes?.question) {
          navigate(`/interview/start/${sessionId}`, {
            state: {
              question: interviewRes.question
            }
          });
        }
      }
    } catch {
      alert("Something went wrong, please try again later");
    }finally{
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start p-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Mock Interview
        </h1>
        <p className="text-gray-600 mb-6 italic text-center">
          Take a deep breath, it's just a conversation
        </p>

        <button
          className="mb-10 py-3 px-8 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition"
          onClick={handleInterview}
          disabled={isStarting}
        >
          Start Interview
        </button>

        {/* Form Section */}
        <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-8 space-y-6">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Backend Developer"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience
            </label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              placeholder="0"
              min={0}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          {/* Focus Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Focus Skills
            </label>
            <textarea
              placeholder="JS, CSS, C++, TS"
              value={focusSkills}
              onChange={(e) => setFocusSkills(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              rows={3}
            ></textarea>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="" >Select difficulty</option>
              <option value="Beginner">Beginner</option>
              <option value="Early-Intermediate">Early-Intermediate</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Early-Advanced">Early-Advanced</option>
              <option value="Advanced">Advanced</option>
              <option value="Masters">Masters</option>
            </select>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Type
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value as InterviewType)}
            >
              <option value="">Select interview type</option>
              <option value="Technical">Technical</option>
              <option value="HR">HR</option>
              <option value="Behavioral">Behavioral</option>
              <option value="System-Design">System-Design</option>
              <option value="Coding">Coding</option>
              <option value="DSA">DSA</option>
            </select>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewPage;
