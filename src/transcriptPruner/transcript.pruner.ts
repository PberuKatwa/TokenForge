import { Session } from "../types/pruner.types.js";

export class TranscriptPrunner{

  private readonly windowPadding: number;
  private readonly maximumCharactersPerTurn: number;
  private readonly minimumCharactersPerTurn: number;
  private readonly keepOnlySignalTurns: boolean;
  private safetyLexicon: RegExp | null;

  constructor(
    windowPadding: number,
    maximumCharactersPerTurn: number,
    minimumCharactersPerTurn: number,
    keepOnlySignalTurns: boolean
  ) {
    this.windowPadding = windowPadding;
    this.maximumCharactersPerTurn = maximumCharactersPerTurn;
    this.minimumCharactersPerTurn = minimumCharactersPerTurn;
    this.keepOnlySignalTurns = keepOnlySignalTurns;
    this.safetyLexicon = null;
  }

  private convertStringArrayToRegExp(lexicon:string[]):RegExp {
    try {

      const escaped = lexicon.map(word => {
        let safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        safe = safe.replace(/[-\s]+/g, '[-\\s]+');
        if (!word.includes(' ') && !word.includes('-')) {
          safe = `${safe}(?:ed|ing|ion|ions|s)?`;
        }
        return safe;
      });

      const pattern = `\\b(?:${escaped.join('|')})\\b`;

      return new RegExp(pattern, 'gi');
    } catch (error) {
      throw error;
    }
  }

  private initializeScoringRegex(
    safetyWords: string[],
    pedagogyWords: string[],
    reflectionWords: string[],
    empathyWords: string[],
    understandingWords: string[],
    fillerWords:string[]
  ) {
    try {

      const safetyRegex = this.convertStringArrayToRegExp(safetyWords);
      const pedagogyRegex = this.convertStringArrayToRegExp(pedagogyWords);
      const reflectionRegex = this.convertStringArrayToRegExp(reflectionWords);
      const empathyRegex = this.convertStringArrayToRegExp(empathyWords);
      const understandingRegex = this.convertStringArrayToRegExp(understandingWords);
      const fillerRegex = this.convertStringArrayToRegExp(fillerWords);


      return { safetyRegex, pedagogyRegex, reflectionRegex, empathyRegex, understandingRegex, fillerRegex };
    } catch (error) {
      throw error;
    }

  }

  public pruneTranscript(
    safetyWords: string[],
    pedagogyWords: string[],
    reflectionWords: string[],
    empathyWords: string[],
    understandingWords: string[],
    fillerWords: string[],
    sessionTranscript:Session
  ) {
    try {

      const { safetyRegex, pedagogyRegex, reflectionRegex, empathyRegex, understandingRegex, fillerRegex } =
        this.initializeScoringRegex(safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords, fillerWords);



      return this.safetyLexicon;
    } catch (error) {
      throw error;
    }
  }


}
