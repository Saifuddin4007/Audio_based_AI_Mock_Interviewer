import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import crypto from 'crypto';


//!JWT Token Generation
const signAccessToken = (user)=>{
    // jwti = "JWT ID" - a unique random ID for THIS specific token.
    // We need this later so we can blocklist one exact token during logout,
    // without needing to store the whole token string to find it again.
    const jwti= crypto.randomUUID();

    const accessToken= jwt.sign(
        {sub: user._id.toString(), jwti},    // "sub" = subject = whose token this is
        process.env.ACCESS_TOKEN_SECRET,    // a long random string only your server knows
        {expiresIn: "15m"}                  // token stops being valid after 15 minutes
    
    );
    
    return {accessToken, jwti};
}


//!Register/Signup User
export const userSignup= async (req,res)=>{
    try{
        const {email, password}= req.body;
        if(!email || !password){
            return res.status(400).json({message:"Please provide both Email and Password"});
        }

        const userExist= await User.findOne({email});
        if(userExist){
            return res.status(400).json({Error: 'User already exists'});

        }

        const salt= bcrypt.genSalt(10);
        const hashedPassword= await bcrypt.hash(password, salt);
        await User.create({
            email,
            passwordHash: hashedPassword
        });

        return res.status(201).json({messgae:"User is Registered"});
    }catch(err){
        return res.status(500).json({error: err.message});
    }
}



//!Login User
export const userLogin= async (req,res)=>{
    try{
       const {email, password}= req.body;
        if(!email || !password){
            return res.status(400).json({message:"Please provide both Email and Password"});
        }
        
        const user= user.findOne({email});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        const isMatch= await bcrypt.compare(password, user.passwordHash);

        if(!isMatch){
            return res.status(404).json({message:"Invalid password"});
        }

        return res.status(200).json({
            message:"Login successful",
            _id: user._id,
            email: user.email,
            token: jwtTokenGenerate(user._id)
        
        });

    }catch(err){
        return res.status(500).json({error: err.message});
    }
}