import refreshClient from "./refreshClient";

interface RefreshResponse {
    accessToken: string;
}

export async function refreshAccessToken (): Promise<string> {
    const response= await refreshClient.post<RefreshResponse>('/api/v1/auth/refresh');

    const accessToken = response.data.accessToken;

    if(!accessToken) {
        throw new Error('No access token returned from refresh');
    }

    return accessToken;
}
