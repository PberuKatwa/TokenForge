import { Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';
import { safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords, fillerWords } from '../tokenOptimizer/config.pruner.js';
import { SessionSchema } from '../validators/session.schema.js';


export async function tokenService(jsonData:string) {
  try {

    const parsedJson: Session = JSON.parse(jsonData);
    const result = SessionSchema.safeParse(parsedJson);

    if (!result.success) {
      console.error(result.error.format());
      process.exit(1);
    }

    const sessionData = result.data;

    const answer = await initializePruner(0, 100, 20, true, safetyWords, pedagogyWords, reflectionWords, empathyWords,
      understandingWords, fillerWords, sessionData)

  } catch (error) {
    throw error;
  }
}
