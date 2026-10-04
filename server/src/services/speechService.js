import axios from "axios";


export const generateSpeech = async (questionText) => {
    if (!questionText) {
        throw new Error("No question text provided");
    }
    try {
        const response = await axios.post('http://localhost:8000/speak', 
            {
            text: questionText,
            },

            {
                responseType: 'arraybuffer',
                timeout: 60000
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