import { ScoredTurn, Session } from "../types/pruner.types.js";

export class TranscriptPrunner{

  private readonly windowPadding: number;
  private readonly maximumCharactersPerTurn: number;
  private readonly minimumCharactersPerTurn: number;
  private readonly keepOnlySignalTurns: boolean;

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
        this.initializeScoringRegex(safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords,
          fillerWords);

      const { transcript } = sessionTranscript;
      const signals = { safety: 0, pedagogy: 0, facilitation: 0 };
      let participationScore = 0;
      let originalWordCount = 0;

      // PASS 1: Score and identify signal turns ONLY
      const scoredTurns: ScoredTurn[] = [];

      for (let i = 0; i < transcript.length; i++) {

        const turn = transcript[i];
        const wordCount = turn.text.trim().split(/\s+/).length;
        originalWordCount += wordCount;

        const isFellow = turn.speaker === "Fellow";
        let score = 0;

        if (safetyRegex.test(turn.text)) {
          score += 100;
          signals.safety++;
        }
        if (isFellow && pedagogyRegex.test(turn.text)) {
          score += 50;
          signals.pedagogy++;
        }
        if (isFellow) {
          if (reflectionRegex.test(turn.text)) {
            score += 40;
            signals.facilitation++;
          }
          if (empathyRegex.test(turn.text) || understandingRegex.test(turn.text)) {
            score += 30;
            signals.facilitation++;
          }
        }

        if (!isFellow && wordCount > 3) participationScore++;

        // Only track turns that meet minimum threshold
        if (score >= CONFIG.MIN_SIGNAL_SCORE || !CONFIG.KEEP_ONLY_SIGNAL_TURNS) {
          scoredTurns.push({ ...turn, index: i, score });
        }

        CONFIG.SAFETY_LEXICON.lastIndex = 0;
        CONFIG.PEDAGOGY_LEXICON.lastIndex = 0;
      }

    } catch (error) {
      throw error;
    }
  }


}
