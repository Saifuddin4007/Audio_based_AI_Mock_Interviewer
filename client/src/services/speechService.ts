
import type { Result } from "../types/result";
import api from "./api"

interface NextQuestionResponse {
    question: string;
    questionNumber: number;
    audio: string;
    audioMimeType: string;
    error?: string;
}

interface FinalResultResponse {
    message: string;
    result: Result;
    error?: string;
}

type UploadAudioResponse = NextQuestionResponse | FinalResultResponse;

export const uploadAudio = async (sessionId: string, audioBlob: Blob, audioFileName: string): Promise<UploadAudioResponse> => {
    const formData= new FormData();
    formData.append("audio", audioBlob, audioFileName);
    formData.append("sessionId", sessionId);
    
    try {
        const res = await api.post<UploadAudioResponse>(
            '/api/v1/speech/audio/upload',
            formData,
            
        );

        return res.data;
    } catch(err: unknown){
        console.error("Upload failed:", err);
        throw err;
    }
}