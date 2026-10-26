import interviewChain from './interviewChain.js';


export const generateNextQuestion = async (session, candidateAnswer, history, previousQuestions, questionNumber) => {


    const response = await interviewChain.invoke({
        role: session.role,
        interviewType: session.interviewType,
        experienceYears: session.experienceYears,
        difficulty: session.difficulty,
        focusSkills: session.focusSkills.join(','),
        currentQuestion: questionNumber,
        totalQuestions: session.totalQuestions,
        history,
        previousQuestions: (previousQuestions ?? []).join('\n'),
        input: candidateAnswer
    });

    return response;

} 

