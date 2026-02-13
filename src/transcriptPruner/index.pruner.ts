import { Session } from "../types/pruner.types.js";
import { TranscriptPrunner } from "./transcript.pruner.js";

export async function initializePruner(
  windowPadding: number,
  maximumCharactersPerTurn: number,
  minimumSignalScore: number,
  keepOnlySignalTurns: boolean,
  safetyWords: string[],
  pedagogyWords: string[],
  reflectionWords: string[],
  empathyWords: string[],
  understandingWords: string[],
  fillerWords: string[],
  session:Session
) {
  try {

    const pruner = new TranscriptPrunner(
      windowPadding,
      maximumCharactersPerTurn,
      minimumSignalScore,
      keepOnlySignalTurns
    )

    // const regexTest = pruner.pruneTranscript(safetyWords, pedagogyWords, reflectionWords, empathyWords,
    //   understandingWords, fillerWords, session)

    const regexTest = pruner.prune(safetyWords, pedagogyWords, reflectionWords, empathyWords,
      understandingWords, fillerWords, session)

    const txtTest = "She is struggling with depression and self harm.";


  } catch (error) {
    throw error;
  }
}
