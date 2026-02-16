import {
  AggregatedTurnArray, AllIndices, Lexicons, PruneContext, PrunedSession, PruneMetadata,
  RawTurn, ScoredTurn, Session, SignalIndices, SignalRegexSet, SignalScores, TurnIndices
} from "../types/pruner.types.js";

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
      const { scoredTurns, metadata, turnIndices, allIndices } = this.scoreTurns(context);
      const keptIndices = this.computeKeptIndices(scoredTurns, transcript.length);
      // const finalScript = transcript.filter((_, index) => keptIndices.has(index));

      // const finalScript = transcript.filter((_, index) => turnIndices.keptIndices.has(index));

      const finalScript = this.buildFinalTranscript(transcript,allIndices.finalIndices)

      console.log("final script", finalScript, transcript.length)

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

    const regexSet: SignalRegexSet = this.initializeScoringRegex(lexicons);
    const turnIndices: TurnIndices = {
      fellowIndices: new Set<number>(),
      memberIndices: new Set<number>(),
      keptIndices: new Set<number>()
    }

    const signalIndices:SignalIndices = {
      safetyIndices: new Set<number>(),
      pedagogyIndices: new Set<number>(),
      reflectionIndices: new Set<number>(),
      empathyIndices: new Set<number>(),
      understandingIndices: new Set<number>(),
      fillerIndices: new Set<number>(),
    }

    const detailedTurn:any[] = []

    const scoredTurns: ScoredTurn[] = [];
    transcript.forEach(
      (turn, index) => {

        const isFellow = turn.speaker === "Fellow";
        const isMember = turn.speaker.startsWith("Member")
        const wordCount = turn.text.trim().split(/\s+/).length;
        metadata.originalWordCount += wordCount;

        if (isFellow) {
          turnIndices.fellowIndices.add(index);
        }

        if (isMember) {
          turnIndices.memberIndices.add(index);
        }

        const score = this.calculateScoreTurn(index,turn, signalsScores, regexSet,detailedTurn,signalIndices)
        if (!isFellow && wordCount > 3) metadata.participationScore++;

        // Only track turns that meet minimum threshold
        if (score >= this.minimumSignalScore || !this.keepOnlySignalTurns) {

          turnIndices.keptIndices.add(index)
          scoredTurns.push({ ...turn, index, score });
        }

        regexSet.safetyRegex.lastIndex = 0;
        regexSet.pedagogyRegex.lastIndex = 0;

      }
    )

    console.log("turn indicess", turnIndices);
    console.log("signal indices", signalIndices)

    const computedIndices = this.computeFinalIndices(transcript, turnIndices, signalIndices)

    const sortedIndices = Array.from(computedIndices).sort((a, b) => a - b);
    const finalIndices = new Set(sortedIndices);
    // console.log("sorted indices", finalIndices)

    const allIndices: AllIndices = {
      signalIndices,
      turnIndices,
      finalIndices
    }


    console.log("our indices", allIndices)

    metadata.finalTurns = scoredTurns.length;
    return { scoredTurns, metadata, turnIndices, allIndices };
  }

  private addRange(
    baseIndex: number,
    padding: number,
    transcriptLength: number,
    finalIndices: Set<number>
  ) {
    for (let offset = -padding; offset <= padding; offset++) {
      const i = baseIndex + offset;
      if (i >= 0 && i < transcriptLength) {
        finalIndices.add(i);
      }
    }
  }

  private addForward(
    baseIndex: number,
    padding: number,
    transcriptLength: number,
    finalIndices: Set<number>
  ) {
    for (let offset = 0; offset <= padding; offset++) {
      const i = baseIndex + offset;
      if (i >= 0 && i < transcriptLength) {
        finalIndices.add(i);
      }
    }
  }

  private findNearestOpposite(
    index: number,
    transcript: RawTurn[],
    isFellow: boolean
  ): number | null {

    const target = isFellow ? "Member" : "Fellow";

    // Prefer right side conversationally
    for (let i = index + 1; i < transcript.length; i++) {
      if (transcript[i].speaker.startsWith(target)) return i;
    }

    for (let i = index - 1; i >= 0; i--) {
      if (transcript[i].speaker.startsWith(target)) return i;
    }

    return null;
  }

  private computeFinalIndices(
    transcript: RawTurn[],
    turnIndices: TurnIndices,
    signalIndices: SignalIndices,
    facilitationMode: "RIGHT_ONLY" | "BOTH" = "RIGHT_ONLY"
  ): Set<number> {

    const finalIndices = new Set<number>();
    const transcriptLength = transcript.length;

    const padding = Math.max(1, this.windowPadding);

    signalIndices.safetyIndices.forEach(index => {

      const isFellow = turnIndices.fellowIndices.has(index);
      const opposite = this.findNearestOpposite(index, transcript, isFellow);

      this.addRange(index, padding, transcriptLength, finalIndices);

      if (opposite !== null) {
        this.addRange(opposite, padding, transcriptLength, finalIndices);
      }

    });

    signalIndices.pedagogyIndices.forEach(index => {
      this.addForward(index, padding, transcriptLength, finalIndices);
    });


    const facilitationSets = [
      signalIndices.reflectionIndices,
      signalIndices.empathyIndices,
      signalIndices.understandingIndices
    ];

    facilitationSets.forEach(set => {
      set.forEach(index => {

        const isFellow = turnIndices.fellowIndices.has(index);
        const opposite = this.findNearestOpposite(index, transcript, isFellow);

        finalIndices.add(index);

        if (opposite !== null) {

          if (facilitationMode === "RIGHT_ONLY") {
            if (opposite > index) {
              this.addForward(opposite, padding, transcriptLength, finalIndices);
            }
          }

          if (facilitationMode === "BOTH") {
            this.addRange(opposite, padding, transcriptLength, finalIndices);
          }
        }

      });

    });

    return finalIndices;
  }


  private calculateScoreTurn(index:number,turn:RawTurn,signals:SignalScores,regex:SignalRegexSet,detailed:any[],signalIndices:SignalIndices) {

    const isFellow = turn.speaker === "Fellow";

    if (regex.safetyRegex.test(turn.text)) signalIndices.safetyIndices.add(index);

    if (isFellow) {
      if (regex.pedagogyRegex.test(turn.text)) signalIndices.pedagogyIndices.add(index);
      if (regex.reflectionRegex.test(turn.text)) signalIndices.reflectionIndices.add(index);
      if (regex.empathyRegex.test(turn.text)) signalIndices.empathyIndices.add(index);
      if(regex. understandingRegex.test(turn.text)) signalIndices.empathyIndices.add(index);
    }

    return signalIndices;
  }

  private buildFinalTranscript(
    transcript: RawTurn[],
    finalIndices: Set<number>
  ): RawTurn[] {

    const finalScript: RawTurn[] = [];
    const transcriptLength = transcript.length;

    if (finalIndices.size === 0) {
      finalScript.push({
        speaker: "SYSTEM",
        text: `[${transcriptLength} turn(s) omitted]`
      });
      return finalScript;
    }

    const sortedIndices = Array.from(finalIndices).sort((a, b) => a - b);
    const firstIncluded = sortedIndices[0];

    if (firstIncluded > 0) {
      finalScript.push({
        speaker: "SYSTEM",
        text: `[${firstIncluded} turn(s) omitted]`
      });
    }

    let previousIndex: number | null = null;

    for (const currentIndex of sortedIndices) {

      if (previousIndex !== null) {
        const gapSize = currentIndex - previousIndex - 1;
        if (gapSize > 0) {
          finalScript.push({
            speaker: "SYSTEM",
            text: `[${gapSize} turn(s) omitted]`
          });
        }
      }

      finalScript.push(transcript[currentIndex]);
      previousIndex = currentIndex;
    }

    const lastIncluded = sortedIndices[sortedIndices.length - 1];
    if (lastIncluded < transcriptLength - 1) {
      const trailingGap = transcriptLength - lastIncluded - 1;
      finalScript.push({
        speaker: "SYSTEM",
        text: `[${trailingGap} turn(s) omitted]`
      });
    }

    return finalScript;
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





}
