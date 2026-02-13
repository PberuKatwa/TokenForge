export class TranscriptPrunner{

  private readonly windowPadding: number;
  private readonly maximumCharactersPerTurn: number;
  private readonly minimumCharactersPerTurn: number;
  private readonly keepOnlySignalTurns: boolean;
  private safetyLexicon: RegExp | null;
  private pedagogyLexicon: RegExp | null;

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

    } catch (error) {
      throw error;
    }

  }

  public pruneTranscript(safetyWords:string[]) {
    try {

      this.safetyLexicon = this.convertStringArrayToRegExp(safetyWords)

      return this.safetyLexicon;
    } catch (error) {
      throw error;
    }
  }


}
