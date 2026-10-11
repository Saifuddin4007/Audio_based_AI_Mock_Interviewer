import fs from 'fs';
import axios from 'axios';
import path from 'path';
import Session from '../models/Session.js';
import { clearHistory, getHistory, saveTurn } from '../services/memoryService.js';
import { evaluateSession } from '../services/evaluationService.js';
import { generateNextQuestion } from '../services/interviewService.js';
import { generateSpeech } from '../services/speechService.js';
import mongoose from 'mongoose';
import { uploadAnswerAudio, deleteAnswerAudio } from '../services/cloudinaryService.js';

// src/controllers/speechController.js
export const uploadAudio = async (req, res) => {
  let cloudinaryPublicId = null;
  let answerSaved= false;

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
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
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

    if (!lastQuestion) {
      deleteTempFile(filePath);
      return res.status(400).json({ message: "No interview question found for this answer" });
    }

    //Cloudinary upload
    const cloudinaryAudio = await uploadAnswerAudio(
      filePath,
      sessionId
    );

    cloudinaryPublicId = cloudinaryAudio.public_id;

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

    if (typeof transcribedText !== "string" || !transcribedText.trim()) {
      deleteTempFile(filePath);

      if (cloudinaryPublicId) {
        try{
          await deleteAnswerAudio(cloudinaryPublicId);
        cloudinaryPublicId = null;
        }catch(cleanupError){
          console.error("Failed to cleanup empty-answer audio", cleanupError.message);
        }
      }

      return res.status(400).json({ message: "No speech detected. Please record your answer again." });
    }

    transcribedText = transcribedText.trim();

    //!Modify or insert the transcribedText into the questions.answers array
    if (session.questions.length > 0) {
      const lastQuestion = session.questions[session.questions.length - 1];
      lastQuestion.answer = {
        transcript: transcribedText,
        answeredAt: new Date(),
        audioURL: cloudinaryAudio.secure_url,
        audioPublicId: cloudinaryPublicId
      }
    }


    const history = await getHistory(sessionId);
    session.currentQuestion++;
    await session.save();

    answerSaved = true;

    // 4. Delete the .webm file from disk to save space (since we have the text now)
    deleteTempFile(filePath);
    console.log("Temporary audio file deleted.");

    if (session.currentQuestion > session.totalQuestions) {
      const result = await evaluateSession(session);
      session.status = "completed";
      session.completedAt = new Date();
      await session.save();

      //Delete all audio recordings associated with this session
      const audioPublicIds = session.questions.map(question => question.answer?.audioPublicId).filter(Boolean);

      const deletionResults = await Promise.allSettled(
        audioPublicIds.map(deleteAnswerAudio)
      );

      const failedDeletions = deletionResults.filter(
        item => item.status === "rejected"
      );

      if (failedDeletions.length > 0) {
        console.error(
          "Failed to delete some cloudinary audio files:", failedDeletions.map(item => item.reason?.message)
        );
      }

      //Delete publicId from question.answers.audioPublicId and audioURL from question.answers.audioURL in MongoDB's Session
      for (let i = 0; i < deletionResults.length; i++) {
        if (deletionResults[i].status === "fulfilled") {
          const publicId = audioPublicIds[i];

          const answer = session.questions.find(
            question => question.answer?.audioPublicId === publicId
          )?.answer;

          if (answer) {
            answer.audioURL = undefined;
            answer.audioPublicId = undefined;
          }
        }
      }

      await session.save();

      await clearHistory(sessionId);

      return res.status(200).json({ message: "Result", result });
    }


    const response = await generateNextQuestion(session, transcribedText, history);

    session.questions.push({ questionNumber: session.currentQuestion, questionText: response.content });
    await session.save();

    await saveTurn(sessionId, transcribedText, response.content);

    const questionSpeech = await generateSpeech(response.content);
    if (!Buffer.isBuffer(questionSpeech) || questionSpeech.length === 0) {
      return res.status(500).json({ message: "Failed to generate speech for the question." });
    }
    const audioBase64 = questionSpeech.toString("base64");

    return res.status(200).json({
      question: response.content,
      questionNumber: session.currentQuestion,
      audio: audioBase64,
      audioMimeType: "audio/wav"
    });


  } catch (error) {
    if (cloudinaryPublicId && !answerSaved) {
      try {
        await deleteAnswerAudio(cloudinaryPublicId);
      } catch (cleanupError) {
        console.error("Failed to delete cloudinary audio file:", cleanupError.message);
      }
    }
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