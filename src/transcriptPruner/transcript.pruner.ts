import { Sign } from "crypto";
import { Lexicons, PruneContext, PrunedSession, PruneMetadata, RawTurn, ScoredTurn, Session, SignalRegexSet, SignalScores } from "../types/pruner.types.js";

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

  private initializeScoringRegex(lexiconSet:Lexicons ):SignalRegexSet {
    try {

      const safetyRegex = this.convertStringArrayToRegExp(lexiconSet.safetyWords);
      const pedagogyRegex = this.convertStringArrayToRegExp(lexiconSet.pedagogyWords);
      const reflectionRegex = this.convertStringArrayToRegExp(lexiconSet.reflectionWords);
      const empathyRegex = this.convertStringArrayToRegExp(lexiconSet.empathyWords);
      const understandingRegex = this.convertStringArrayToRegExp(lexiconSet.understandingWords);
      const fillerRegex = this.convertStringArrayToRegExp(lexiconSet.fillerWords);


      return { safetyRegex, pedagogyRegex, reflectionRegex, empathyRegex, understandingRegex, fillerRegex };
    } catch (error) {
      throw error;
    }
  }

  private initializeContext(
    lexicons:Lexicons,
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
        finalWordCount: 0,
        reductionRatioPercentage:0
      },
      lexicons: {
        ...lexicons
      }
    }
  }

  public pruneTranscript(
    lexicons:Lexicons,
    sessionTranscript:Session
  ):PrunedSession {
    try {

      const context: PruneContext = this.initializeContext(
        lexicons,
        sessionTranscript
      )
      const { transcript } = sessionTranscript;
      const { scoredTurns, metadata } = this.scoreTurns(context);
      const keptIndices = this.computeKeptIndices(scoredTurns, transcript.length);
      const finalScript = transcript.filter((_, index) => keptIndices.has(index));

      const finalSession: Session = {
        session_topic: sessionTranscript.session_topic,
        duration_minutes: sessionTranscript.duration_minutes,
        transcript:finalScript
      }

      const finalPayload = this.buildPrunedSession(metadata, context.signalsScores, finalSession);

      return finalPayload;
    } catch (error) {
      throw error;
    }
  }

  private scoreTurns(context: PruneContext) {

    const { sessionTranscript, signalsScores, metadata, lexicons } = context;
    const { transcript } = sessionTranscript;

    const regexSet:SignalRegexSet = this.initializeScoringRegex(lexicons);

    const scoredTurns: ScoredTurn[] = [];
    transcript.forEach(
      (turn, index) => {

        const isFellow = turn.speaker === "Fellow";
        const wordCount = turn.text.trim().split(/\s+/).length;
        metadata.originalWordCount += wordCount;

        const score = this.calculateScoreTurn(turn, signalsScores, regexSet)
        if (!isFellow && wordCount > 3) metadata.participationScore++;

        // Only track turns that meet minimum threshold
        if (score >= this.minimumSignalScore || !this.keepOnlySignalTurns) {
          scoredTurns.push({ ...turn, index, score });
        }

        regexSet.safetyRegex.lastIndex = 0;
        regexSet.pedagogyRegex.lastIndex = 0;

      }
    )

    metadata.finalTurns = scoredTurns.length;
    return { scoredTurns, metadata };
  }

  private calculateScoreTurn(turn:RawTurn,signals:SignalScores,regex:SignalRegexSet) {

    const isFellow = turn.speaker === "Fellow";
    let score = 0;

    if (regex.safetyRegex.test(turn.text)) {
      score += 100;
      signals.safety++;
    }

    if (isFellow) {

      if (regex.pedagogyRegex.test(turn.text)) {
        score += 50;
        signals.pedagogy++;
      }

      if (regex.reflectionRegex.test(turn.text)) {
        score += 40;
        signals.facilitation++;
      }

      if (regex.empathyRegex.test(turn.text)) {
        score += 20;
        signals.facilitation++;
      }

      if(regex. understandingRegex.test(turn.text)){
        score += 200;
        signals.facilitation++;
      }

    }

    return score;
  }

  private computeKeptIndices(
    scoredTurns: ScoredTurn[],
    transcriptLength: number
  ): Set<number> {
    const keptIndices = new Set<number>();

    scoredTurns.forEach(turn => {
      for (
        let i = turn.index - this.windowPadding;
        i <= turn.index + this.windowPadding;
        i++
      ) {
        if (i >= 0 && i < transcriptLength) {
          keptIndices.add(i);
        }
      }
    });

    // scoredTurns.forEach(turn => {
    //   for (
    //     let i = turn.index;
    //     i <= turn.index + this.windowPadding;
    //     i++
    //   ) {
    //     if (i < transcriptLength) {
    //       keptIndices.add(i);
    //     }
    //   }
    // });


    return keptIndices;
  }

  private buildPrunedSession(
    metadata: PruneMetadata,
    signals:SignalScores,
    prunedTranscript: Session
  ): PrunedSession {

    const { transcript } = prunedTranscript;
    const prunedWordCount = transcript.reduce(
      (sum, turn) => sum + (turn.text.trim().split(/\s+/).length),
      0
    );

    metadata.reductionRatioPercentage = Math.floor(( 1 - ( (prunedWordCount) / (metadata.originalWordCount))) * 100 ) ;

    metadata.finalWordCount = prunedWordCount;
    const finalPayload: PrunedSession= {
      metadata,
      signalScores: signals,
      finalTranscript:prunedTranscript
    }

    return finalPayload;
  }

  private stripFiller(text: string, regexSet:SignalRegexSet): string {
    return text
      .replace(regexSet.fillerRegex, '')
      .replace(/\s+/g, ' ')
      .trim();
  }


  private extractEssence(turn: ScoredTurn, regexSet: SignalRegexSet): string {

    const { text, score } = turn;
    const cleaned = this.stripFiller(text, regexSet);

    const sentences = cleaned.match(/[^.!?]+[.!?]?/g) ?? [cleaned];

    let chosen = cleaned;

    if (score >= 100) {
      chosen =
        sentences.find(s => regexSet.safetyRegex.test(s)) ?? cleaned;
    } else if (score >= 50) {
      chosen =
        sentences.find(s => regexSet.pedagogyRegex.test(s)) ?? cleaned;
    }

    if (chosen.length > this.maximumCharactersPerTurn) {
      chosen = chosen.slice(0, this.maximumCharactersPerTurn) + "...";
    }

    return chosen.trim();
  }




}
