import { TranscriptPrunner } from "./transcript.pruner.js";

export async function initializePruner(
  windowPadding: number,
  maximumCharactersPerTurn: number,
  minimumCharactersPerTurn: number,
  keepOnlySignalTurns: boolean,
  safetyWords:string[]
) {
  try {

    const pruner = new TranscriptPrunner(
      windowPadding,
      maximumCharactersPerTurn,
      minimumCharactersPerTurn,
      keepOnlySignalTurns
    )

    const regexTest = pruner.pruneTranscript(safetyWords)

    const txtTest = "She is struggling with depression and self harm.";

    if (regexTest.test(txtTest)) {
      console.log("Safety term detected");
    }

  } catch (error) {
    throw error;
  }
}
