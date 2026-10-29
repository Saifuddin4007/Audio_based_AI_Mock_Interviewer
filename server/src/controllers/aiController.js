import axios from "axios";

export const checkAIReadiness = async (req, res) => {
    const healthUrl= `${process.env.AI_SERVICE_URL}/health`;

    console.log("=================================");
    console.log("AI readiness request received");
    console.log("AI health URL:", healthUrl);
    console.log("Time:", new Date().toISOString());
    try {
        console.log("Node is calling fastAPI health endpoint now");
        const response = await axios.get( healthUrl,
            {
                timeout: 30000
            }
        );

        console.log("AI health request completed");
        console.log("Status:", response.status);
        console.log("Data:", response.data);

        if (
            response.status === 200 &&
            response.data?.status === "ok"
        ) {
            console.log("AI ready");
            return res.status(200).json({
                ready: true
            });
        }
        console.log("fastAPI respond but not ready");

        return res.status(503).json({
            ready: false
        });
    } catch (error) {
        console.log("AI health request FAILED");
        console.log("Error code:", error.code);
        console.log("Error message:", error.message);
        console.log("Error status:", error.response?.status);
        console.log("Error data received:", !!error.response?.data);
        return res.status(503).json({
            ready: false
        });
    }
};