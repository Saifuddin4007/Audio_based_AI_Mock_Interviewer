import mongoose from 'mongoose';

const refreshTokenSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tokenHash:{          // hashed, never the raw token
        type: String,
        required: true,
        unique: true
    },
    expiresAt:{
        type: Date,
        required: true
    },
    revoked:{
        type: Boolean,
        default: false          // logout flips this to true
    },
}, {timestamps: true});


//* TTL index = "time to live" index. MongoDB will automatically delete a document once its expiresAt time has passed.
//* expireAfterSeconds: 0 means "delete exactly at expiresAt, don't wait any extra time." This means you never need a manual cleanup job for old expired tokens.

refreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

export default mongoose.model("RefreshToken", refreshTokenSchema);