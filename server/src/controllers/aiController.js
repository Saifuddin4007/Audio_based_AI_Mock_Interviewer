import { waitForAIService } from "../services/aiServiceHealth.js";

export const checkAIReadiness = async (req, res) => {
    try {
        await waitForAIService();

        return res.status(200).json({
            ready: true
        });
    } catch (error) {
        console.error("AI readiness check failed:", error.message);

        return res.status(503).json({
            ready: false,
            message: "AI service is not ready"
        });
    }
};