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

    const matches = txtTest.match(regexTest)
    if (txtTest.match(regexTest)) {
      console.log("these are the matches", matches)
    }

  } catch (error) {
    throw error;
  }
}
