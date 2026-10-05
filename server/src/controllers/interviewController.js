import Result from '../models/Result.js';
import Session from '../models/Session.js';
import { evaluateSession } from '../services/evaluationService.js';
import { generateNextQuestion } from '../services/interviewService.js';
import { clearHistory, getHistory, saveTurn } from '../services/memoryService.js';



export const startInterview = async (req, res) => {
    try {
        const { sessionId } = req.body;

        const session = await Session.findById(sessionId);
        //!Session Authorize
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        if (session.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        if (session.status !== "in_progress") {
            deleteTempFile(filePath);
            return res.status(400).json({ message: "Interview is not active" });
        }


        if (session.questions.length > 0) {
            return res.status(400).json({ message: "Interview already started..." });
        }

        const history = await getHistory(sessionId);
        session.currentQuestion++;
        const response = await generateNextQuestion(session, "", history);

        session.questions.push({ questionNumber: session.currentQuestion, questionText: response.content });
        await session.save();

        await saveTurn(sessionId, null, response.content);

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
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}


export const submitAnswerAndNext = async (req, res) => {
    try {

        const { sessionId, candidateAnswer } = req.body;

        const session = await Session.findById(sessionId);
        if (!candidateAnswer?.trim()) {
            return res.status(400).json({ message: "Answer cannot be empty" });
        }
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

        //!Modify or insert the candidateAnswer into the questions.answers array
        if (session.questions.length > 0) {
            const lastQuestion = session.questions[session.questions.length - 1];
            lastQuestion.answer = {
                transcript: candidateAnswer,
                answeredAt: new Date(),
                audioURL: null
            }
        }


        const history = await getHistory(sessionId);
        session.currentQuestion++;
        await session.save();

        if (session.currentQuestion > session.totalQuestions) {
            const result = await evaluateSession(session);
            session.status = "completed";
            session.completedAt = new Date();
            await session.save();

            await clearHistory(sessionId);

            return res.status(200).json({ message: "Result", result });
        }

        const response = await generateNextQuestion(session, candidateAnswer, history);

        session.questions.push({ questionNumber: session.currentQuestion, questionText: response.content });
        await session.save();

        await saveTurn(sessionId, candidateAnswer, response.content);

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


    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}



export const abandonInterview = async (req, res) => {
    try {
        const { sessionId } = req.body;

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        if (session.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        if (session.status !== "in_progress") {
            return res.status(400).json({ message: "Interview already ended" });
        }

        if (session.questions.length === 0) {
            return res.status(400).json({ message: "Interview not started" });
        }

        session.status = "abandoned";
        session.completedAt = new Date();
        await session.save();
        const result = await evaluateSession(session);

        await clearHistory(sessionId);

        return res.status(200).json({ message: "After abandon, the result is", result });


    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}