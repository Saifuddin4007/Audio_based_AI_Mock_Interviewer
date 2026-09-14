import api from "./api";

type ExportFormat= 'pdf' | 'docx';

export async function downloadInterviewResult(sessionId: string, format: ExportFormat= 'pdf'): Promise<Blob>{
    try{
        const res= await api.get(`/api/v1/export/${sessionId}/download`, {
            params: { format },
            responseType: 'blob'
        });

        return res.data;

    }catch{
        throw new Error('Error exporting interview result');
    }
}