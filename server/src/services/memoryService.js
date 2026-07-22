import redisClient from "../config/redis.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const TTL_SECONDS = 3600;

export const getHistory = async (sessionId) => {
    try {
        const raw = await redisClient.get(`interview:${sessionId}`);
        const plainHistory = raw ? JSON.parse(raw) : [];

        return plainHistory.map((msg) => (
            msg.role === "human" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        ))
    } catch (err) {
        throw new Error(err.message);
    }
}


export const saveTurn = async (sessionId, humanContent, aiContent) => {
    try {
        const raw = await redisClient.get(`interview:${sessionId}`);
        const plainHistory = raw ? JSON.parse(raw) : [];
        if (humanContent!==undefined && humanContent!==null) {
            plainHistory.push({ role: "human", content: humanContent });
            plainHistory.push({ role: "ai", content: aiContent });
        } else {
            plainHistory.push({ role: "ai", content: aiContent });
        }


        await redisClient.set(
            `interview:${sessionId}`,
            JSON.stringify(plainHistory),
            "EX",
            TTL_SECONDS
        )
    } catch (err) {
        throw new Error(err.message);
    }
}