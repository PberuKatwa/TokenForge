export class TranscriptPrunner{

  private readonly windowPadding: number;
  private readonly maximumCharactersPerTurn: number;
  private readonly minimumCharactersPerTurn: number;
  private readonly keepOnlySignalTurns: boolean;
  private readonly safetyLexicon: string[];

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
  }

  private convertStringArrayToRegExp(lexicon:string[]) {
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


}
