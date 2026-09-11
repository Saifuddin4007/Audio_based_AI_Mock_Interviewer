
import Result from '../models/Result.js';

export async function transformData(sessionId) {
    try {
        const result = await Result.findOne({session:sessionId}).populate({
            path: 'session',
            populate: {
                path: 'user'
            }
        });

        if(!result){
            throw new Error("No result found for this session");
        }

        if(!result.session){
            throw new Error("No session found");
        }
            
    

        const date = result.createdAt.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        return {
            userId: result.session.user._id.toString(),
            sessionId: result.session._id.toString(),
            date: date,
            status: result.session.status,
            difficulty: result.session.difficulty,
            interviewType: result.session.interviewType,
            role: result.session.role,
            totalQuestions: result.session.totalQuestions,
            questionsAndAnswers: result.session.questions.map((question)=> {
                return {
                    questionNumber: question.questionNumber,
                    question: question.questionText,
                    answer: question.answer?.transcript ?? "Not answered"

                }
            }),
            overallScore: result.overallScore,
            domainScore: result.domainScore,
            communicationScore: result.communicationScore,
            feedback: result.feedback,
            experience: result.session.experienceYears,
            skills: result.session.focusSkills,
            isPartialEvaluation: result.isPartialEvaluation,
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            recommendations: result.recommendations,
            modelUsed: result.modelUsed,
            completedAt: result.session.completedAt ? result.session.completedAt.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }) : null,
        }
    } catch(err) {
        throw new Error(`Failed to transform reult data: ${err.message}`);
    }
}
