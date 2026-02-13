import { PruneContext, ScoredTurn, Session } from "../types/pruner.types.js";

export class TranscriptPrunner{

  private readonly windowPadding: number;
  private readonly maximumCharactersPerTurn: number;
  private readonly minimumSignalScore: number;
  private readonly keepOnlySignalTurns: boolean;

  constructor(
    windowPadding: number,
    maximumCharactersPerTurn: number,
    minimumSignalScore: number,
    keepOnlySignalTurns: boolean
  ) {
    this.windowPadding = windowPadding;
    this.maximumCharactersPerTurn = maximumCharactersPerTurn;
    this.minimumSignalScore = minimumSignalScore;
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
      const { transcript } = sessionTranscript;

      const context = {
        transcript,
        signalsScores: {
          safety: 0,
          pedagogy: 0,
          facilitation: 0
        },
        metadata: {
          participationScore: 0,
          originalWordCount: 0,
          originalTurns: transcript.length,
          finalTurns: 0,
          finalWordCount:0
        }
      }

      const { safetyRegex, pedagogyRegex, reflectionRegex, empathyRegex, understandingRegex, fillerRegex } =
        this.initializeScoringRegex(safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords,
          fillerWords);


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
        if (score >= this.minimumSignalScore || !this.keepOnlySignalTurns) {
          scoredTurns.push({ ...turn, index: i, score });
        }

        safetyRegex.lastIndex = 0;
        pedagogyRegex.lastIndex = 0;
      }

      // PASS 2: Cluster Identification (Sliding Window)
      const keepIndices = new Set<number>();
      scoredTurns.forEach(turn => {
          for (let i = turn.index - this.windowPadding; i <= turn.index + this.windowPadding; i++) {
            if (i >= 0 && i < transcript.length) keepIndices.add(i);
          }
      });

      const prunedTranscript22 = transcript.filter((_, index) =>
        keepIndices.has(index)
      );

      console.log("pruned", prunedTranscript22)
      console.log("kept indices", keepIndices, "totall", transcript.length)
      console.log("windowPadding", this.windowPadding)
      console.log("signallls", signals)
      console.log("participation score", participationScore)
      console.log("word count", originalWordCount)
      // console.log("this are the turnss",scoredTurns)

    } catch (error) {
      throw error;
    }
  }

  private initializeContext(
    safetyWords: string[],
    pedagogyWords: string[],
    reflectionWords: string[],
    empathyWords: string[],
    understandingWords: string[],
    fillerWords: string[],
    sessionTranscript: Session
  ): PruneContext{
    return{
      sessionTranscript,
      signalsScores: {
        safety: 0,
        pedagogy: 0,
        facilitation: 0
      },
      metadata: {
        participationScore: 0,
        originalWordCount: 0,
        originalTurns: sessionTranscript.transcript.length,
        finalTurns: 0,
        finalWordCount:0
      },
      lexicons: {
        safetyWords,
        pedagogyWords,
        reflectionWords,
        empathyWords,
        understandingWords,
        fillerWords
      }
    }
  }

  public prune(
    safetyWords: string[],
    pedagogyWords: string[],
    reflectionWords: string[],
    empathyWords: string[],
    understandingWords: string[],
    fillerWords: string[],
    sessionTranscript:Session
  ) {
    try {

      const context: PruneContext = this.initializeContext(
        safetyWords,
        pedagogyWords,
        reflectionWords,
        empathyWords,
        understandingWords,
        fillerWords,
        sessionTranscript
      )

      const turns = this.scoreTurns(context)

      console.log("turnsss", turns)

    } catch (error) {
      throw error;
    }
  }

  private scoreTurns(context: PruneContext) {

    const { sessionTranscript, signalsScores, metadata, lexicons } = context;
    const { safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords, fillerWords } = lexicons;
    const { transcript } = sessionTranscript;
    let { originalWordCount,participationScore } = metadata;

    const { safetyRegex, pedagogyRegex, reflectionRegex, empathyRegex, understandingRegex, fillerRegex } =
      this.initializeScoringRegex(safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords,
        fillerWords);

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
        signalsScores.safety++;
      }

      if (isFellow && pedagogyRegex.test(turn.text)) {
        score += 50;
        signalsScores.pedagogy++;
      }

      if (isFellow) {

        if (reflectionRegex.test(turn.text)) {
          score += 40;
          signalsScores.facilitation++;
        }

        if (empathyRegex.test(turn.text) || understandingRegex.test(turn.text)) {
          score += 30;
          signalsScores.facilitation++;
        }

      }

      if (!isFellow && wordCount > 3) participationScore++;

      // Only track turns that meet minimum threshold
      if (score >= this.minimumSignalScore || !this.keepOnlySignalTurns) {
        scoredTurns.push({ ...turn, index: i, score });
      }

      safetyRegex.lastIndex = 0;
      pedagogyRegex.lastIndex = 0;
    }

    return scoredTurns;
  }


}
