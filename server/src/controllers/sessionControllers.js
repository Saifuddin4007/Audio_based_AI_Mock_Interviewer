import Session from "../models/Session.js";


export const createSession = async (req, res)=>{

    try{
        const { role, experienceYears, focusSkills, difficulty, interviewType } = req.body;
        const userId= req.userId;

        if(!role || !difficulty || !interviewType || !Array.isArray(focusSkills) || focusSkills.length===0){
            return res.status(400).json({message:"Give all the required fields"});
        }
        
        const session = await Session.create({
            user: userId,
            role,
            experienceYears,
            focusSkills,
            difficulty,
            interviewType
        });

        return res.status(201).json({message:"Session created", sessionId: session._id});
    }catch(err){
        return res.status(500).json({error:err.message});
    }
}