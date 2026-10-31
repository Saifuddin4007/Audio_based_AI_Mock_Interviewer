import { checkAIServiceHealth } from "../utils/aiServiceHealth.js";

export const checkAIReadiness = async (req, res) => {
    console.log("=================================");
    console.log("AI readiness request received");
    console.log("Time:", new Date().toISOString());

    const ready = await checkAIServiceHealth({
        timeout: 10000
    });

    console.log("AI readiness result:", ready);

    return res.status(200).json({
        ready
    });
};