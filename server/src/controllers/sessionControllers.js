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



export const getOneSession= async (req,res)=>{
    try{
        const { sessionId }= req.params;
        if(!sessionId){
            return res.status(400).json({message:"Unauthorized"});
        }
        const session= await Session.findById(sessionId);
        if(!session){
            return res.status(404).json({message:"Session not found"});
        }

        if(session.user.toString() !== req.userId){
            return res.status(403).json({message:"Unauthorized User"});
        }

        return res.status(200).json({message:"Session found", session});

    }catch(err){
        return res.status(500).json({error:err.message});
    }
}


export const getALLSessions= async (req,res)=>{
    try{
        const sessions= await Session.find({
            user: req.userId
        });
        if(sessions.length===0){
            return res.status(404).json({message:"No sessions found"});
        }
        return res.status(200).json({message:"All sessions", sessions});

    }catch(err){
        return res.status(500).json({error:err.message});
    }
}


export const deleteOneSession= async (req,res)=>{
    try{
        const { sessionId }= req.params;
        if(!sessionId){
            return res.status(400).json({message:"Unauthorized"});
        }

        const session= await Session.findByIdAndDelete(sessionId);
        if(!session){
            return res.status(404).json({message:"Session not found"});
        }

        if(session.user.toString() !== req.userId){
            return res.status(403).json({message:"Unauthorized User"});
        }

        return res.status(200).json({message:"Session deleted"});

    }catch(err){
        return res.status(500).json({error:err.message});   
    }
}

