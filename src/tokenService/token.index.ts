import { PrunedSession, Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';
import { getPrunedSession } from './token.service.js';
import { allLexicons } from './token.config.js';
import { SessionSchema } from '../validators/session.schema.js';
import { evaluateWithGemini } from '../gemini/gemini.js';
import { evaluateFullTranscript } from '../gemini/gemini.full.js';


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

    const pruner = initializePruner(0, 20);
    const prunedSession = pruner.pruneTranscript(allLexicons, sessionData)


    console.time("Gemini Response Time");
    const finalEvaluation = await evaluateWithGemini(prunedSession);
    console.timeEnd("Gemini Response Time");

    // console.log("Optimized Evaluation", finalEvaluation)

    // console.log("PrunedSession", prunedSession)
    // console.log(JSON.stringify(prunedSession.finalTranscript, null, 2));

    console.log("========================================================================================================");
    console.log("\n========================================================================================================");


    console.time("Unoptimized Gemini Response Time");
    const unoptimizedGemini = await evaluateFullTranscript(sessionData)
    console.timeEnd("Unoptimized Gemini Response Time");

    // console.log("Unoptimized Evaluation", unoptimizedGemini)

    console.log("===============================================ENDDDDDDD================================================")
    console.log("========================================================================================================");

    // const unoptimizedGemini = null;
    // const finalEvaluation = null;
    //
    // com

    return { prunedSession, unoptimizedGemini, finalEvaluation };
  } catch (error) {
    throw error;
  }
}
