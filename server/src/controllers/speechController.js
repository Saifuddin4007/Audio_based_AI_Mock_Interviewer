import fs from 'fs';
import axios from 'axios';
import path from 'path';
import Session from '../models/Session.js';
import { clearHistory, getHistory, saveTurn } from '../services/memoryService.js';
import { evaluateSession } from '../services/evaluationService.js';
import { generateNextQuestion } from '../services/interviewService.js';

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



    // 2. Send the file path to the Python Whisper service
    console.log("Sending to Python for transcription...");

    const pythonResponse = await axios.post('http://localhost:8000/transcribe', {
      file_path: filePath
    });

    // 3. Extract the transcribed text from Python's response
    const transcribedText = pythonResponse.data.text;
    console.log(`Transcription successful: "${transcribedText}"`);


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

    return res.status(200).json({ question: response.content, questionNumber: session.currentQuestion });


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