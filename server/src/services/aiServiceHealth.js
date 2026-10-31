import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

export const checkAIServiceHealth = async ({
    timeout = 10000
} = {}) => {
    if (!AI_SERVICE_URL) {
        throw new Error("AI_SERVICE_URL is not configured");
    }

    const healthUrl = `${AI_SERVICE_URL}/health`;

    try {
        const response = await axios.get(healthUrl, {
            timeout
        });

        if (
            response.status === 200 &&
            response.data?.status === "ok"
        ) {
            return true;
        }

        return false;

    } catch (error) {
        console.log(
            `AI service health check failed: ${
                error.response?.status ||
                error.code ||
                error.message
            }`
        );

        return false;
    }
};