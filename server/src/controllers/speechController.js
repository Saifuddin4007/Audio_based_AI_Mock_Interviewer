import axios from 'axios';
import FormData from 'form-data';
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
  let answerSaved = false;

  try {

    // 1. Multer has already loaded the audio into memory.
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }


    const { sessionId } = req.body;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const session = await Session.findById(sessionId);

    //!Authorize session
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.user.toString() !== req.userId) {
  
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (session.status !== "in_progress") {
      return res.status(400).json({ message: "Interview is not active" });
    }

    const audioInterviewTypes= [
      "Technical",
      "HR",
      "Behavioral"
    ];

    if(!audioInterviewTypes.includes(session.interviewType)){
      return res.status(400).json({
        message: `audio answers are not supported for ${session.interviewType} interviews.`
      });
    }


    const lastQuestion = session.questions[session.questions.length - 1];

    if (!lastQuestion) {
      return res.status(400).json({ message: "No interview question found for this answer" });
    }

    //Cloudinary upload
    const cloudinaryAudio = await uploadAnswerAudio(
      req.file.buffer,
      sessionId
    );

    cloudinaryPublicId = cloudinaryAudio.public_id;

    // 2. Send the audio buffer to the Python Whisper service
    console.log("Sending to Python for transcription...");

    const form = new FormData();

    form.append('audio', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    form.append(
      'interview_type',
      session.interviewType
    );

    form.append(
      'role',
      session.role
    );

    form.append(
      'focus_skills',
      JSON.stringify(session.focusSkills ?? [])
    );

    form.append(
      'question',
      lastQuestion.questionText
    );

    const pythonResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/transcribe`,
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        timeout: 120000
      }
    );

    // 3. Extract the transcribed text from Python's response
    let transcribedText = pythonResponse.data.text;
    console.log(`Transcription successful: "${transcribedText}"`);

    if (typeof transcribedText !== "string" || !transcribedText.trim()) {

      if (cloudinaryPublicId) {
        try {
          await deleteAnswerAudio(cloudinaryPublicId);
          cloudinaryPublicId = null;
        } catch (cleanupError) {
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

    // Check if Python server is down
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: "AI Service is currently unavailable. Please try again." });
    }

    res.status(500).json({
      error: "Failed to process audio. Please try again."
    });
  }
};