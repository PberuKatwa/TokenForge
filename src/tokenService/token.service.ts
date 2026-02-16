import { PrunedSession, Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';
import { allLexicons } from '../tokenOptimizer/config.pruner.js';
import { SessionSchema } from '../validators/session.schema.js';
import { evaluateWithGemini } from '../tokenOptimizer/gemini.js';
import { evaluateFullTranscript } from '../tokenOptimizer/geminiFull.js';


export async function tokenService(jsonData:string) {
  try {

    const parsedJson: Session = JSON.parse(jsonData);
    const result = SessionSchema.safeParse(parsedJson);

    if (!result.success) {
      console.error("validation error",result.error.format());
      throw new Error(`Invalid session data format`);
    }

    const sessionData = result.data;

    console.log("===============================================BEGINNING================================================")
    console.log("========================================================================================================");

    const pruner = initializePruner(0, 100, 20, true);
    const prunedSession = pruner.pruneTranscript(allLexicons, sessionData)

    console.log("PrunedSession", prunedSession)

    // console.time("Unoptimized Gemini Response Time");
    // const unoptimizedGemini = await evaluateFullTranscript(sessionData)
    // console.timeEnd("Unoptimized Gemini Response Time");

    console.log("========================================================================================================");
    console.log("========================================================================================================");


    // console.time("Gemini Response Time");
    // const finalEvaluation = await evaluateWithGemini(prunedSession);
    // console.timeEnd("Gemini Response Time");

    console.log("===============================================ENDDDDDDD================================================")
    console.log("========================================================================================================");

    const unoptimizedGemini = null;
    const finalEvaluation = null;

    return { prunedSession, unoptimizedGemini, finalEvaluation };
  } catch (error) {
    throw error;
  }
}
