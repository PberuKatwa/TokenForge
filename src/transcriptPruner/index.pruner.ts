import { TranscriptPrunner } from "./transcript.pruner.js";

export function initializePruner(
  windowPadding: number,
  capPercentage: number
) {
  try {

    const pruner = new TranscriptPrunner(
      windowPadding,
      capPercentage
    )

    return pruner;
  } catch (error) {
    throw error;
  }
}
