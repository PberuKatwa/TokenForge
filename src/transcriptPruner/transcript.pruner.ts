import {
  Lexicons, PruneContext, PrunedSession, PruneMetadata,
  RawTurn, Session, SignalIndices, SignalRegexSet, TurnIndices,
  CompleteIndices
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

    const indices: CompleteIndices = {
      turnIndices,
      signalIndices,
      finalIndices: new Set<number>()
    }

    return{
      sessionTranscript,
      metadata: {
        originalWordCount: 0,
        originalTurns: sessionTranscript.transcript.length,
        finalTurns: 0,
        finalWordCount: 0,
        reductionRatioPercentage:0
      },
      lexicons: {
        ...lexicons
      },
      completeIndices:indices
    }
  }

  public pruneTranscript(
    lexicons:Lexicons,
    sessionTranscript:Session
  ):PrunedSession {
    try {

      const context: PruneContext = this.initializeContext(
        lexicons,
        sessionTranscript,
      )

      const { transcript } = sessionTranscript;
      const { metadata, completeIndices } = this.scoreTurns(context);
      const finalScript = this.buildFinalTranscript(transcript, completeIndices.finalIndices);

      console.log("final script", finalScript, transcript.length)

      const finalSession: Session = {
        session_topic: sessionTranscript.session_topic,
        duration_minutes: sessionTranscript.duration_minutes,
        transcript:finalScript
      }

      const finalPayload = this.buildPrunedSession(metadata, finalSession);

      return finalPayload;
    } catch (error) {
      throw error;
    }
  }

  private scoreTurns(context: PruneContext):PruneContext {

    const { sessionTranscript, metadata, lexicons, completeIndices } = context;
    const { transcript } = sessionTranscript;
    const { turnIndices, signalIndices } = completeIndices;

    const regexSet: SignalRegexSet = this.initializeScoringRegex(lexicons);

    transcript.forEach(
      (turn, index) => {
        const wordCount = turn.text.trim().split(/\s+/).length;
        metadata.originalWordCount += wordCount;

        if ( turn.speaker === "Fellow" ) {
          turnIndices.fellowIndices.add(index);
        } else {
          turnIndices.memberIndices.add(index);
        }

        if (regexSet.safetyRegex.test(turn.text)) signalIndices.safetyIndices.add(index);
        if (regexSet.pedagogyRegex.test(turn.text)) signalIndices.pedagogyIndices.add(index);
        if (regexSet.reflectionRegex.test(turn.text)) signalIndices.reflectionIndices.add(index);
        if (regexSet.empathyRegex.test(turn.text)) signalIndices.empathyIndices.add(index);
        if(regexSet. understandingRegex.test(turn.text)) signalIndices.empathyIndices.add(index);

        regexSet.safetyRegex.lastIndex = 0;
        regexSet.pedagogyRegex.lastIndex = 0;
      }
    )

    const computedIndices = this.computeFinalIndices(transcript, turnIndices, signalIndices)
    const sortedIndices = Array.from(computedIndices).sort((a, b) => a - b);
    const allIndices = new Set(sortedIndices);

    completeIndices.finalIndices = allIndices;
    context.metadata = metadata;
    context.completeIndices = { turnIndices, signalIndices, finalIndices:allIndices };
    return context;
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

  private buildPrunedSession(
    metadata: PruneMetadata,
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
      finalTranscript:prunedTranscript
    }

    return finalPayload;
  }

}
