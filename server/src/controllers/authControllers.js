import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';


//!JWT Token Generation
const signAccessToken = (user) => {
    // jwti = "JWT ID" - a unique random ID for THIS specific token.
    // We need this later so we can blocklist one exact token during logout,
    // without needing to store the whole token string to find it again.
    const jwti = crypto.randomUUID();

    const accessToken = jwt.sign(
        { sub: user._id.toString(), jwti },    // "sub" = subject = whose token this is
        process.env.ACCESS_TOKEN_SECRET,    // a long random string only your server knows
        { expiresIn: "15m" }                  // token stops being valid after 15 minutes

    );

    return { accessToken, jwti };
}

//!Verifu Access-Token
export const verifyAccessToken = (token) => {
    // jwt.verify checks the signature AND the expiry in one call.
    // If either is invalid, it throws an error automatically.
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

//!Generate Refresh-Token
const generateRefreshToken = () => {
    // 40 random bytes turned into a hex string = 80 characters of pure randomness. This is NOT a JWT - it doesn't need to be "readable," it's just a long random secret we'll look up in MongoDB.
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // days from now
    return { token, expiresAt };

}

//!Hash Refresh-Token before storing into MongoDB
const hashToken = (token) => {
    // SHA-256 is a fast, one-way hash. We store this hash in MongoDB, never the raw token. If someone dumps your database, they get hashes they can't turn back into usable tokens.
    return crypto.createHash('sha256').update(token).digest('hex');

}


//!Register/Signup User
export const userSignup = async (req, res) => {

    try {
        const {email, password} = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide both Email and Password" });
        }

        if(!email.includes('@') ||!email.endsWith('.com')){
            return res.status(400).json({error:"Email format is wrong, provide proper email"});
        }
        if(password.length<=8){
            return res.status(400).json({error:"Password is less than 8 characters, password must be 8 characters or more"});
        }

        
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ Error: 'User already exists' });

        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.create({
            email,
            passwordHash: hashedPassword
        });

        return res.status(201).json({ message: "User is Registered" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}



//!Login User
export const userLogin = async (req, res) => {
    try {

        const { email, password } = req.body || {};
        
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide both Email and Password" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        //Update lastLogin
        user.lastLoginAt= new Date();
        await user.save();

        const { accessToken } = signAccessToken(user);
        const { token: refreshToken, expiresAt } = generateRefreshToken();

        // Save the refresh token (hashed) to MongoDB so we can revoke it later.
        await RefreshToken.create({
            userId: user._id,
            tokenHash: hashToken(refreshToken),
            expiresAt: expiresAt
        })


        //Sending tokens to the client
        // The refresh token goes in an httpOnly cookie - the browser stores it and sends it automatically, but JavaScript on your page can't read it (protects against XSS token theft).
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,     // JS on the page can't read this cookie
            secure: process.env.NODE_ENV === "production",        // only sent over HTTPS in prod
            sameSite: "strict",     // not sent on cross-site requests (CSRF protection)
            maxAge: 7 * 24 * 60 * 60 * 1000     // 7 days, matches expiresAt above
        })

        return res.status(200).json({
            message: "Login successful",
            accessToken,     // access token goes in the body, refresh token does NOT
            user: {
                id: user._id,
                email: user.email
            }

        });

        // The access token goes in the response body. The frontend keeps it in memory (a JS variable) and attaches it manually to each request's Authorization header - NOT in a cookie, and NOT in localStorage (localStorage is readable by any script on the page, which is an XSS risk).



    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}


//!Refresh token when access-token will be expired after 15m
export const refresh = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

    const tokenHash = hashToken(refreshToken);

    //Clear refrsh-token cookie
    const clearRefreshTokenCookie= (res)=>{
        res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            });
    }
    

    // findOne with revoked:false and expiresAt in the future - this is the actual "is this refresh token still good?" check
    try {

        const record = await RefreshToken.findOne({tokenHash});

        if (!record || record.expiresAt < new Date()) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }
        

        if (record.revoked) {
            clearRefreshTokenCookie(res);
            await RefreshToken.updateMany({ userId: record.userId }, { revoked: true }); // kill every session
            return res.status(401).json({ error: "Session invalid, please log in again" });
        }

        const user = await User.findById(record.userId);
        if (!user) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({ error: "User no longer exists" });
        }

        //* Rotation: revoke the old refresh token before issuing a new pair

        // ROTATION: kill the old refresh token, issue a brand new one.This means each refresh token can only be used ONCE. If a stolen refresh token ever gets used after the real user already refreshed, it'll already be revoked - a strong signal of theft.

        record.revoked = true;
        await record.save();

        const { accessToken } = signAccessToken(user);
        const { token: newRefreshToken, expiresAt } = generateRefreshToken();

        await RefreshToken.create({
            userId: user._id,
            tokenHash: hashToken(newRefreshToken),
            expiresAt
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken });
    }

    //!Note:
    //When a refresh token gets used, two things happen in the same request:

    //* The old refresh token is revoked (dies).
    //* A brand new refresh token is issued and sent back to the client, replacing the old one.

    //TODO: So the client is never left without a refresh token — it just keeps trading in the old one for a fresh one, every single time.
    //TODO: The browser automatically replaces the cookie's value when the server sends a new Set-Cookie header in the /refresh response. Your frontend code never manually juggles refresh tokens — it just always sends "whatever's currently in the cookie," and that happens to be a different token each time.

    catch (err) {
        return res.status(500).json({ error: err.message }); // fixed: whole function now wrapped
    }

}



//!Logout
export const userLogout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            await RefreshToken.updateOne(
                { tokenHash: hashToken(refreshToken) },
                { revoked: true }
            );
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        return res.status(200).json({ message: "Logout successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

//!findMe
export const findMe= async (req,res)=>{
    try{
        const user= await User.findById(req.userId).select("-passwordHash");
        // req.userId comes from your `auth` middleware, set from the verified JWT's `sub` claim - it can't be spoofed by the client, because it was extracted AFTER jwt.verify() confirmed the token's signature is valid.
        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        return res.status(200).json(user);

    }catch(err){
        return res.status(500).json({error: err.message});
    }
}