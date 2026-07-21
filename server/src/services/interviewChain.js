import { questionTemplate } from "./prompt.js";
import llm from '../config/groq.js';


const interviewChain= questionTemplate.pipe(llm);

export default interviewChain;