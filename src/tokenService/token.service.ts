import { Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';
import { safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords, fillerWords } from '../tokenOptimizer/config.pruner.js';
import { SessionSchema } from '../validators/session.schema.js';


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
    // const answer = await initializePruner(0, 100, 20, true, safetyWords, pedagogyWords, reflectionWords, empathyWords,
    //   understandingWords, fillerWords, sessionData)

    // const answer = await initializePruner(0, 100, 20, true, safetyWords, pedagogyWords, reflectionWords, empathyWords,
    //   understandingWords, fillerWords, sessionData)

    const answer = await initializePruner(1, 100, 20, true, safetyWords, pedagogyWords, reflectionWords, empathyWords,
      understandingWords, fillerWords, sessionData)

    console.log("===============================================ENDDDDDDD================================================")
    console.log("========================================================================================================");
  } catch (error) {
    throw error;
  }
}
