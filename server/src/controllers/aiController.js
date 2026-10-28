import axios from "axios";

export const checkAIReadiness = async (req, res) => {
    try {
        const response = await axios.get(
            `${process.env.AI_SERVICE_URL}/health`,
            {
                timeout: 5000
            }
        );

        if (
            response.status === 200 &&
            response.data?.status === "ok"
        ) {
            return res.status(200).json({
                ready: true
            });
        }

        return res.status(503).json({
            ready: false
        });
    } catch (error) {
        return res.status(503).json({
            ready: false
        });
    }
};