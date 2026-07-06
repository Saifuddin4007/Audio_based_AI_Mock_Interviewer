import { verifyAccessToken } from '../controllers/authControllers.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization; //Format-->"Bearer <token>"
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
        const payload = verifyAccessToken(token);
        req.userId = payload.sub;    // attach the user's ID to the request
        req.tokenPayload = payload;  // logout will need this

        req.user = await User.findById(payload.sub).select('-passwordHash');
        //This is a genuinely important extra check beyond "is the JWT valid" — it catches the case where the JWT is cryptographically perfect (correctly signed, not expired) but the account it points to was deleted or banned after the token was issued. Without this DB re-check, a deleted user's still-unexpired access token would keep working for up to 15 more minutes. This is the actual reason this middleware hits Mongo at all instead of just trusting the JWT payload — pure JWT verification alone can't know about database-side state changes.

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        next();

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                error: "Token expired"
            });
        }

        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
                error: "Invalid token"
            });
        }

        return res.status(500).json({
            error: "Internal server error"
        });
    }
} 