import Result from "../models/Result.js";


export const getAllResults= async (req,res)=>{
    try{
    
        const userResults= await Result.find().populate({
            path: "session",
            match: {user: req.userId}
        });
        const results= userResults.filter(result=> result.session !== null);
        if(results.length===0){
            return res.status(404).json({message: "No results found"});
        }
        return res.status(200).json({message:"User results are found", results});
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

        return res.status(200).json({message:"Result is Found", result});
    }catch(err){
        return res.status(500).json({message: err.message})
    }
}