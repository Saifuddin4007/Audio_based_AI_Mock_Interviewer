import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


import { ChatGroq } from '@langchain/groq';

export const MODEL_USED= "llama-3.3-70b-versatile";


const llm= new ChatGroq({
   apiKey: process.env.GROQ_API_KEY,
   model: MODEL_USED,
   temperature: 0.6,
   maxRetries: 2,
   maxTokens: 200 
});

export default llm;