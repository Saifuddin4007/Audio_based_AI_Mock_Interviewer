import Groq from "groq-sdk";
import { toFile } from "groq-sdk/uploads";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const transcribeAudio = async ({
    audioBuffer,
    filename,
    contentType,
    focusSkills
}) => {
    
    if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("Audio buffer is empty");
    }

const prompt= focusSkills?.length ? focusSkills.join(", ") : undefined ;

    try {
        const transcription = await groq.audio.transcriptions.create({
            file: await toFile(
                audioBuffer,
                filename,
                {
                    type: contentType
                }
            ),
            model: "whisper-large-v3-turbo",
            language: "en",
            ...(prompt ? {prompt} : {}),
            response_format: "json",
            temperature: 0
        });

        return transcription.text;
    } catch (error) {
        console.error(
            "Groq STT error:",
            error.response?.data || error.message
        );

        throw new Error("Speech transcription failed");
    }
};