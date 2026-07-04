import {verifyAccessToken} from '../controllers/authControllers.js';
import User from '../models/User.js';

export const auth= async (req,res,next)=>{
    const authHeader= req.headers.authorization; //Format-->"Bearer <token>"
    const token= authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if(!token) return res.status(401).json({error: "No token provided"});

    try{
        const payload= verifyAccessToken(token);
        req.userId= payload.sub;    // attach the user's ID to the request
        req.tokenPayload= payload;  // logout will need this
        req.user= await User.findById(payload.sub).select('-passwordHash');
        if(!req.user){
            return res.status(401).json({message:'Not authorized, user not found'});
        }
        next();

    }catch(err){
        res.status(401).json({ error: "Invalid or expired token" });
    }
} 