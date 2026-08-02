import { z } from "zod";

export const evaluationSchema= z.object({
    overallScore: z.number(),
    domainScore: z.number(),
    communicationScore: z.number(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendations: z.array(z.string()),
    feedback: z.string()
});

