import evaluationChain from "./evaluationChain"
import Result from "../models/result";



export const evaluateSession= async (session)=>{
    try{

        const response= await evaluationChain.invoke({
            role: session.role,
            interviewType: session.interviewType,
            difficulty: session.difficulty,
            experienceYears: session.experienceYears,
            focusSkills: session.focusSkills,
            transcript: session.questions,
        });

        const parsedResponse= JSON.parse(response.content);

        await Result.create({
            session: session._id,
            overallScore: parsedResponse.overallScore,
            domainScore: parsedResponse.domainScore,
            communicationScore: parsedResponse.communicationScore,
            feedback: parsedResponse.feedback,
            strengths: parsedResponse.strengths,
            weaknesses: parsedResponse.weaknesses,
            recommendations: parsedResponse.recommendations,
        });

    }catch(err){
        throw new Error(err.message);
    }
}