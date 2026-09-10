import type { Session } from "./session";

export interface Result {
    _id: string;
    session: Session;
    overallScore: number;
    domainScore: number;
    communicationScore: number;
    feedback: string;
    isPartialEvaluation: boolean;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    modelUsed: string;
    createdAt: string;

}

