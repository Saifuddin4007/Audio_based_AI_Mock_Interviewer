import Session from '../models/Session.js';
import { evaluateSession } from '../services/evaluationService.js';
import { generateNextQuestion } from '../services/interviewService.js';
import { clearHistory, getRecentHistory, getQuestionHistory, saveTurn } from '../services/memoryService.js';
import { generateSpeech } from '../services/speechService.js';
import { deleteAnswerAudio } from '../services/cloudinaryService.js';


const MAX_NORMAL_ANSWER_CHARS_FOR_AI = 6000;
const NORMAL_HEAD_CHARS = 4000;
const NORMAL_TAIL_CHARS = 2000;

const MAX_CODE_ANSWER_CHARS_FOR_AI = 12000;

const getAnswerForAI = (answer, interviewType) => {
    const isCodeInterview = interviewType === "Coding" || interviewType === "DSA";

    if (isCodeInterview) {
        if (answer.length > MAX_CODE_ANSWER_CHARS_FOR_AI) {
            return {
                valid: false,
                reason: "Code too large"
            };
        }
        return {
                valid: true,
                answer
        };
    }

    if (answer.length <= MAX_NORMAL_ANSWER_CHARS_FOR_AI) {
            return {
                valid: true,
                answer
            };
        }

        const boundedAnswer= `${answer.slice(0, NORMAL_HEAD_CHARS)}
        [...middle of answer omitted...]
        ${answer.slice(-NORMAL_TAIL_CHARS)}` ;

        return {
            valid: true,
            answer: boundedAnswer
        };
};


const getAIErrorResponse = (err) => {
    const status = err?.status ?? err?.response?.status;
    const message = err?.message ?? "";

    if (
        status === 413 ||
        message.includes("Request too large") ||
        message.includes("TPM Limit")
    ) {
        return {
            status: 413,
            message:
                "The AI request was too large. Please shorten your answer and try again."
        };
    }

    if (
        status === 429 ||
        message.includes("rate limit")
    ) {
        return {
            status: 429,
            message:
                "The AI service is temporarily rate-limited. Please try again shortly."
        };
    }

    if (status >= 500 && status < 600) {
        return {
            status: 502,
            message:
                "The AI service is temporarily unavailable. Please try again."
        };
    }

    return null;
};


const validateGeneratedQuestion = (content) => {
    const question = content?.trim();

    if (!question) {
        return {
            valid: false,
            message: "AI generated an empty question."
        };
    }

    if (question.length < 20) {
        return {
            valid: false,
            message: "AI generated an invalid question."
        };
    }

    return {
        valid: true,
        question
    };
};

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
            return res.status(400).json({ message: "Interview is not active" });
        }


        if (session.questions.length > 0) {
            return res.status(400).json({ message: "Interview already started..." });
        }

        // const history = await getHistory(sessionId);
        const history = await getRecentHistory(sessionId, 4);
        const previousQuestions = await getQuestionHistory(sessionId);
        const nextQuestionNumber = session.currentQuestion + 1;
        const response = await generateNextQuestion(session, "", history, previousQuestions, nextQuestionNumber);

        const questionResult = validateGeneratedQuestion(response?.content);

        if (!questionResult.valid) {
            console.error(
                "Invalid AI generated question",
                response?.content
            );

            return res.status(502).json({
                message: "AI generated an invalid question. Please try again."
            });
        }

        const nextQuestion = questionResult.question;
        session.currentQuestion = nextQuestionNumber;

        session.questions.push({ questionNumber: nextQuestionNumber, questionText: nextQuestion });
        await session.save();

        await saveTurn(sessionId, null, nextQuestion);

        const questionSpeech = await generateSpeech(nextQuestion);
        if (!Buffer.isBuffer(questionSpeech) || questionSpeech.length === 0) {
            return res.status(500).json({ message: "Failed to generate speech for the question." });
        }
        const audioBase64 = questionSpeech.toString("base64");

        return res.status(200).json({
            question: nextQuestion,
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

        const aiAnswerResult= getAnswerForAI(candidateAnswer, session.interviewType);

        if(!aiAnswerResult.valid){
            return res.status(413).json({
                message: "Code answer is too large. Please keep the answer within 12000 characters"
            });
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


        // const history = await getHistory(sessionId);
        const history = await getRecentHistory(sessionId, 4);
        const previousQuestions = await getQuestionHistory(sessionId);
        const nextQuestionNumber = session.currentQuestion + 1;

        await session.save();

        if (nextQuestionNumber > session.totalQuestions) {

            const result = await evaluateSession(session);

            session.status = "completed";
            session.completedAt = new Date();

            await session.save();

            await clearHistory(sessionId);

            return res.status(200).json({ message: "Result", result });
        }

        const response = await generateNextQuestion(session, aiAnswerResult.answer, history, previousQuestions, nextQuestionNumber);

        const questionResult = validateGeneratedQuestion(response?.content);
        if (!questionResult.valid) {
            console.error(
                "invalid AI generated question",
                response?.content
            );

            return res.status(502).json({
                message: "AI generated an invalid question. Please try again."
            });
        }

        const nextQuestion = questionResult.question;

        session.currentQuestion = nextQuestionNumber;

        session.questions.push({ questionNumber: nextQuestionNumber, questionText: nextQuestion });

        await session.save();

        await saveTurn(sessionId, candidateAnswer, nextQuestion);

        const questionSpeech = await generateSpeech(nextQuestion);
        if (!Buffer.isBuffer(questionSpeech) || questionSpeech.length === 0) {
            return res.status(500).json({ message: "Failed to generate speech for the question." });
        }
        const audioBase64 = questionSpeech.toString("base64");

        return res.status(200).json({
            question: nextQuestion,
            questionNumber: session.currentQuestion,
            audio: audioBase64,
            audioMimeType: "audio/wav"
        });


    } catch (err) {

        console.error("submitAnswerAnd Next error", err.message);

        const aiError= getAIErrorResponse(err);

        if(aiError){
            return res.status(aiError.status).json({
                message: aiError.message
            });
        }

        return res.stats(500).json({
            message: "Failed to process interview answer ."
        });
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

        const result = await evaluateSession(session);

        session.status = "abandoned";
        session.completedAt = new Date();
        await session.save();

        // Delete temporary audio recordings from Cloudinary
        const audioPublicIds = session.questions
            .map(question => question.answer?.audioPublicId)
            .filter(Boolean);

        const deletionResults = await Promise.allSettled(
            audioPublicIds.map(deleteAnswerAudio)
        );

        const failedDeletions = deletionResults.filter(
            item => item.status === "rejected"
        );

        if (failedDeletions.length > 0) {
            console.error(
                "Failed to delete some Cloudinary audio files:",
                failedDeletions.map(
                    item => item.reason?.message
                )
            );
        }

        // Remove Cloudinary references from MongoDB
        for (let i = 0; i < deletionResults.length; i++) {
            if (deletionResults[i].status === "fulfilled") {
                const publicId = audioPublicIds[i];

                const answer = session.questions.find(
                    question =>
                        question.answer?.audioPublicId === publicId
                )?.answer;

                if (answer) {
                    answer.audioURL = undefined;
                    answer.audioPublicId = undefined;
                }
            }
        }

        await session.save();


        await clearHistory(sessionId);

        return res.status(200).json({ message: "Interview abandoned", result });


    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}