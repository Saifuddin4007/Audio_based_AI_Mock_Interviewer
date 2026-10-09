import fs from 'fs';
import axios from 'axios';
import path from 'path';
import Session from '../models/Session.js';
import { clearHistory, getHistory, saveTurn } from '../services/memoryService.js';
import { evaluateSession } from '../services/evaluationService.js';
import { generateNextQuestion } from '../services/interviewService.js';
import { generateSpeech } from '../services/speechService.js';
import mongoose from 'mongoose';

// src/controllers/speechController.js
export const uploadAudio = async (req, res) => {
  try {

    const deleteTempFile = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    // 1. Multer has already saved the file. If it failed, the error handler catches it.
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received and saved:", req.file.filename);

    const filePath = path.resolve(req.file.path);
    console.log(`Node.js received file: ${filePath}`);

    const { sessionId } = req.body;
    if(!sessionId || !mongoose.isValidObjectId(sessionId)) {
      deleteTempFile(filePath);
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await Session.findById(sessionId);

    //!Authorize session
    if (!session) {
      deleteTempFile(filePath);
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.user.toString() !== req.userId) {
      deleteTempFile(filePath);
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (session.status !== "in_progress") {
      deleteTempFile(filePath);
      return res.status(400).json({ message: "Interview is not active" });
    }


    const lastQuestion = session.questions[session.questions.length - 1];

    if(!lastQuestion){
      deleteTempFile(filePath);
      return res.status(400).json({ message: "No interview question found for this answer" });
    }


    // 2. Send the file path to the Python Whisper service
    console.log("Sending to Python for transcription...");

    const pythonResponse = await axios.post('http://localhost:8000/transcribe', {
      file_path: filePath,
      interview_type: session.interviewType,
      role: session.role,
      focus_skills: session.focusSkills,
      question: lastQuestion.questionText
    });

    // 3. Extract the transcribed text from Python's response
    let transcribedText = pythonResponse.data.text;
    console.log(`Transcription successful: "${transcribedText}"`);

    if(typeof transcribedText !== "string" || !transcribedText.trim()) {
      deleteTempFile(filePath);
      return res.status(400).json({ message: "No speech detected. Please record your answer again." });
    }

    transcribedText= transcribedText.trim();

    //!Modify or insert the transcribedText into the questions.answers array
    if (session.questions.length > 0) {
      const lastQuestion = session.questions[session.questions.length - 1];
      lastQuestion.answer = {
        transcript: transcribedText,
        answeredAt: new Date(),
        audioURL: null
      }
    }


    const history = await getHistory(sessionId);
    session.currentQuestion++;
    await session.save();

    // 4. Delete the .webm file from disk to save space (since we have the text now)
    fs.unlinkSync(filePath);
    console.log("Temporary audio file deleted.");

    if (session.currentQuestion > session.totalQuestions) {
      const result = await evaluateSession(session);
      session.status = "completed";
      session.completedAt = new Date();
      await session.save();

      await clearHistory(sessionId);

      return res.status(200).json({ message: "Result", result });
    }


    const response = await generateNextQuestion(session, transcribedText, history);

    session.questions.push({ questionNumber: session.currentQuestion, questionText: response.content });
    await session.save();

    await saveTurn(sessionId, transcribedText, response.content);

    const questionSpeech= await generateSpeech(response.content);
    if(!Buffer.isBuffer(questionSpeech) || questionSpeech.length === 0) {
      return res.status(500).json({ message: "Failed to generate speech for the question." });
    }
    const audioBase64= questionSpeech.toString("base64");

    return res.status(200).json({ 
      question: response.content, 
      questionNumber: session.currentQuestion, 
      audio: audioBase64,
      audioMimeType: "audio/wav" 
    });


  } catch (error) {
    console.error("Transcription pipeline error:", error.message);

    // Clean up the file even if the Python server fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Check if Python server is down
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: "AI Service is currently unavailable. Please try again." });
    }

    res.status(500).json({
      error: "Failed to process audio. Please try again."
    });
  }
};