import { Lexicons, PrunedSession, Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';

export async function getPrunedSession(lexicons: Lexicons, session: Session):Promise<PrunedSession>{
  try {

    const pruner = initializePruner(0, 20);
    const prunedSession = pruner.pruneTranscript(lexicons, session);
    return prunedSession;
  } catch (error) {
    throw error;
  }
}
