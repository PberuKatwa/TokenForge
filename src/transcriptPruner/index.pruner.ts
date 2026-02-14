import { Lexicons, PrunedSession, Session } from "../types/pruner.types.js";
import { TranscriptPrunner } from "./transcript.pruner.js";

export function initializePruner(
  windowPadding: number,
  maximumCharactersPerTurn: number,
  minimumSignalScore: number,
  keepOnlySignalTurns: boolean,
) {
  try {

    const pruner = new TranscriptPrunner(
      windowPadding,
      maximumCharactersPerTurn,
      minimumSignalScore,
      keepOnlySignalTurns
    )

    return pruner;
  } catch (error) {
    throw error;
  }
}
