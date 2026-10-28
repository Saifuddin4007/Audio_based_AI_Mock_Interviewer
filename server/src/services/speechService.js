import axios from "axios";
import { waitForAIService } from "./aiServiceHealth.js";


export const generateSpeech = async (questionText) => {
    if (!questionText) {
        throw new Error("No question text provided");
    }

    await waitForAIService();

    console.log(
        "Calling AI service:",
        `${process.env.AI_SERVICE_URL}/speak`
    );
    try {
        const response = await axios.post(`${process.env.AI_SERVICE_URL}/speak`,
            {
                text: questionText,
            },

            {
                responseType: 'arraybuffer',
                timeout: 120000
            }
        )

        const speech = response.data;
        return Buffer.from(speech);
    } catch (err) {
        console.error("TTS service error:", err.message);
        throw new Error("Error generating speech: " +

            (err.response?.status
                ? `FastAPI returned status ${err.response.status}`
                : err.message)
        );

    }
}