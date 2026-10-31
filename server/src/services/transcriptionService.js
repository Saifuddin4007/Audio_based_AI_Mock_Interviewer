import Groq from "groq-sdk";
import { toFile } from "groq-sdk/uploads";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const transcribeAudio = async ({
    audioBuffer,
    filename,
    contentType,
    interviewType,
    role,
    focusSkills,
    question
}) => {
    if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("Audio buffer is empty");
    }

    const prompt = `
This is an English-language ${interviewType} job interview.
The role is ${role || "unspecified"}.
Relevant skills include: ${focusSkills?.length
            ? focusSkills.join(", ")
            : "unspecified"
        }.

The interview question is:
${question || "unspecified"}

Transcribe the candidate's actual speech accurately.
Preserve spoken names, abbreviations, technical terms,
and domain-specific terminology.
Do not rewrite, improve, or correct the candidate's grammar.
`.trim();

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
            prompt,
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