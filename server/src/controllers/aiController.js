
import { waitForAIService } from "../services/aiServiceHealth";

export const checkAIReadiness = async (req, res) => {
   

    console.log("=================================");
    console.log("AI readiness request received");
    console.log("Time:", new Date().toISOString());
    try {
        const startTime= Date.now();
        console.log("Node is calling fastAPI health endpoint now");
        await waitForAIService({
            timeout: 120000,
            retryDelay: 5000
        });

        console.log(
            "AI Health Request completed in:", 
            `${Date.now() - startTime} ms`
        );

        console.log("AI readiness confirmed");

        return res.status(200).json({
            ready: true
        });
    } catch (error) {
        console.log("AI readiness check FAILED");
        console.log("Error code:", error.code);
        console.log("Error message:", error.message);
        
        return res.status(503).json({
            ready: false
        });
    }
};