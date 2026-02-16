import { PrunedSession, Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';
import { getPrunedSession } from './token.service.js';
import { allLexicons } from './token.config.js';
import { SessionSchema } from '../validators/session.schema.js';
import { evaluateWithGemini } from '../gemini/gemini.js';
import { evaluateFullTranscript } from '../gemini/gemini.full.js';
import { LLMEvaluation } from '../types/evaluation.types.js';


export async function tokenService(jsonData:string):LLMEvaluation {
  try {

    const parsedJson: Session = JSON.parse(jsonData);
    const result = SessionSchema.safeParse(parsedJson);

    if (!result.success) {
      console.error("validation error",result.error.format());
      throw new Error(`Invalid session data format`);
    }
    const sessionData = result.data;

    const prunedSession = await getPrunedSession(allLexicons,sessionData)

    const finalEvaluation = await evaluateWithGemini(prunedSession);

    // const unoptimizedGemini = null;
    // const finalEvaluation = null;

    return { prunedSession, unoptimizedGemini, finalEvaluation };
  } catch (error) {
    throw error;
  }
}
