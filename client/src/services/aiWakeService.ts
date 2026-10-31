const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL;

export const wakeAIService = async (): Promise<void> => {
    try {
        const response= await fetch(`${AI_SERVICE_URL}/live`, {
            method: "GET",
            cache: "no-store",
        });

        console.log("AI wake request sent", response.status);
    } catch (error) {
        console.log("AI wake request failed:", error);
    }
};