import evaluationChain from "./evaluationChain.js"
import Result from "../models/Result.js";
import { MODEL_USED } from "../config/groq.js";


export const evaluateSession= async (session)=>{
    try{

        const transcript= session.questions.map((item)=>`
            Question: ${item.questionText}
            Answer: ${item.answer?.transcript || "No Answer"}
        `).join("\n");


        const response= await evaluationChain.invoke({
            role: session.role,
            interviewType: session.interviewType,
            difficulty: session.difficulty,
            experienceYears: session.experienceYears,
            focusSkills: session.focusSkills.join(", "),
            transcript,
        });


        const result= await Result.create({
            session: session._id,
            overallScore: response.overallScore,
            domainScore: response.domainScore,
            communicationScore: response.communicationScore,
            feedback: response.feedback,
            strengths: response.strengths,
            weaknesses: response.weaknesses,
            recommendations: response.recommendations,
            modelUsed: MODEL_USED,
            isPartialEvaluation: session.status==="abandoned",
        });

        await result.populate("session");

        return result;

    }catch(err){
        throw new Error(err.message);
    }
}