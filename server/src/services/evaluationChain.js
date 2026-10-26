import { evaluationTemplate } from "./prompt.js";
import {evaluationLLM} from '../config/groq.js';
import { evaluationSchema } from "../schema/evaluationSchema.js";

const structuredLLM= evaluationLLM.withStructuredOutput(evaluationSchema);

const evaluationChain= evaluationTemplate.pipe(structuredLLM);

export default evaluationChain;