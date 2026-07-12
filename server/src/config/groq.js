import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
dotenv.config();

const llm= new ChatGroq({
   apiKey: process.env.GROQ_API_KEY,
   model: "llama-3.3-70b-versatile",
   temperature: 0.6,
   maxRetries: 2,
   maxTokens: 200 
});

export default llm;