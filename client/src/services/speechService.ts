
import api from "./api"


export interface UploadAudioResponse {
  message: string;
  filename: string;
  mimetype: string;
  size: number;
}

export const uploadAudio = async (formData: FormData): Promise<UploadAudioResponse> => {
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