import api from "./api";

export const checkAIReadiness = async (): Promise<boolean> => {
  try {
    const response = await api.get("/api/v1/ai/ready");

    return response.data?.ready === true;
  } catch {
    return false;
  }
};