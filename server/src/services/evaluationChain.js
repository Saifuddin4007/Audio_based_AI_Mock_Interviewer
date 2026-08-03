import { evaluationTemplate } from "./prompt.js";
import llm from '../config/groq.js';
import { evaluationSchema } from "../schema/evaluationSchema.js";

const structuredLLM= llm.withStructuredOutput(evaluationSchema);

const evaluationChain= evaluationTemplate.pipe(structuredLLM);

export default evaluationChain;