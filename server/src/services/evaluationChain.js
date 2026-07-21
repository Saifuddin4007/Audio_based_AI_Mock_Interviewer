import { evaluationTemplate } from "./prompt";
import llm from '../config/groq.js';


const evaluationChain= evaluationTemplate.pipe(llm);

export default evaluationChain;