import interviewChain from './interviewChain.js';


export const generateNextQuestion = async (session, candidateAnswer, history) => {
    try {

        const response= await interviewChain.invoke({
            role: session.role,
            interviewType: session.interviewType,
            experienceYears: session.experienceYears,
            difficulty: session.difficulty,
            focusSkills: session.focusSkills.join(','),
            currentQuestion: session.currentQuestion,
            totalQuestions:session.totalQuestions,
            history,
            input: candidateAnswer
        });

        return response;

    } catch (err) {
        throw new Error(err.message);
    }


} 