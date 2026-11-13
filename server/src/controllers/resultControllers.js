import Result from "../models/Result.js";
import mongoose from "mongoose";


export const getAllResults= async (req,res)=>{
    try{

        const page= Number(req.query.page) || 1;
        const limit= Number(req.query.limit) || 10;

        if(page<1 || limit<1){
            return res.status(400).json({
                message: "Page and limit must be positive numbers"
            });
        }

        if(limit > 50){
            return res.status(400).json({
                message: "Limit cannot exceed 50"
            });
        }

        const offset= (page-1)*limit; 

        const results= await Result.aggregate([
            {
                $lookup:{
                    from: "sessions",
                    localField: "session",
                    foreignField: "_id",
                    as: "session"
                }
            },
            {
                $unwind: "$session"
            },
            {
                $match:{
                    "session.user": new mongoose.Types.ObjectId(req.userId) 
                }
            },
            {
                $sort:{
                    createdAt: -1,
                    _id: -1
                }
            },
            {
                $facet:{
                    results: [
                        { $skip: offset },
                        { $limit: limit }
                    ],
                    metadata: [
                        {
                            $count: "total"
                        }
                    ]
                }
            }
        ]);



        const aggregationResult= results[0];
        const total= aggregationResult.metadata[0]?.total ?? 0;

        const totalPages= Math.ceil(total/limit);

        return res.status(200).json({
            message:"User results are found",
            results: aggregationResult.results,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
        
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
        if(!result || !result.session){
            return res.status(404).json({message: "No result or session found"});
        }

        if(result.session.user.toString() !== req.userId){
            return res.status(403).json({message: "Unauthorized"})
        }

        return res.status(200).json({message:"Result is Found", result});
    }catch(err){
        return res.status(500).json({message: err.message})
    }
}