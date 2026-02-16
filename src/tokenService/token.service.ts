import { Lexicons, PrunedSession, Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';
import { allLexicons } from './token.config.js';
import { SessionSchema } from '../validators/session.schema.js';
import { evaluateWithGemini } from '../gemini/gemini.js';
import { evaluateFullTranscript } from '../gemini/gemini.full.js';


export async function tokenService(lexicons: Lexicons, session: Session):PrunedSession{
  try {

    const pruner = initializePruner(0, 20);
    const prunedSession = pruner.pruneTranscript(lexicons, session);

    return prunedSession;
  } catch (error) {
    throw error;
  }
}
