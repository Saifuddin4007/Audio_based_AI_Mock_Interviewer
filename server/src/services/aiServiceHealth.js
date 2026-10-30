import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

export const waitForAIService = async ({
    timeout = 120000,
    retryDelay = 5000
} = {}) => {
    if (!AI_SERVICE_URL) {
        throw new Error("AI_SERVICE_URL is not configured");
    }

    const healthUrl = `${AI_SERVICE_URL}/health`;
    const startTime = Date.now();

    console.log("Waiting for AI service to become ready...");

    while (Date.now() - startTime < timeout) {
        try {
            const response = await axios.get(healthUrl, {
                timeout: 20000
            });

            console.log("AI health response:", response.status, response.data);
            if (response.status === 200 && response.data?.status === "ok") {
                console.log("AI service is ready");
                return true;
            }

            console.log(
                `AI service not ready yet: ${response.status}`
            );
        } catch (error) {
            console.log(
                `AI service not ready: ${error.response?.status || error.code || error.message
                }`
            );
        }

        await new Promise((resolve) => {
            setTimeout(resolve, retryDelay);
        });
    }

    throw new Error(
        `AI service did not become ready within ${timeout / 1000} seconds`
    );

};

