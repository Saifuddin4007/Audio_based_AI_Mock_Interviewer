import Result from "../models/Result.js";


export const getAllResults= async (req,res)=>{
    try{
    
        const results= await Result.find().populate({
            path: "session",
            match: {user: req.userId}
        });
        const userResults= results.filter(result=> result.session !== null);
        if(userResults.length===0){
            return res.status(404).json({message: "No results found"});
        }
        return res.status(200).json(userResults);
    }catch(err){
        return res.status(500).json({message: err.message})
    }
}


export const getOneResult= async(req,res)=>{
    try{
        const { sessionId }= req.params;

        const result= await Result.findOne({
            session: sessionId
        }).populate("session");
        if(!result){
            return res.status(404).json({message: "No result found"});
        }

        if(result.session.user.toString() !== req.userId){
            return res.status(403).json({message: "Unauthorized"})
        }

        return res.status(200).json(result);
    }catch(err){
        return res.status(500).json({message: err.message})
    }
}