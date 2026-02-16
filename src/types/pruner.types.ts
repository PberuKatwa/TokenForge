export type Speaker = "Fellow" | string;

export interface RawTurn {
  speaker: Speaker;
  text: string;
}

export interface Session {
  session_topic: string;
  duration_minutes: number;
  transcript: RawTurn[];
}

export interface ScoredTurn extends RawTurn {
  index: number;
  score: number;
}

export interface Lexicons {
  safetyWords: string[];
  pedagogyWords: string[];
  reflectionWords: string[];
  empathyWords: string[];
  understandingWords: string[];
  fillerWords: string[];
}

export interface PruneMetadata {
  originalWordCount: number;
  originalTurns: number;
  finalTurns: number;
  finalWordCount: number;
  reductionRatioPercentage: number;
}

export interface TurnIndices {
  fellowIndices: Set<number>;
  memberIndices: Set<number>;
  keptIndices:Set<number>;
}

export interface SignalIndices{
  safetyIndices: Set<number>;
  pedagogyIndices: Set<number>;
  reflectionIndices: Set<number>;
  empathyIndices: Set<number>;
  understandingIndices: Set<number>;
  fillerIndices: Set<number>;
}

export interface CompleteIndices{
  signalIndices: SignalIndices;
  turnIndices: TurnIndices;
  finalIndices:Set<number>;
}

export interface PruneContext {
  sessionTranscript: Session;
  metadata: PruneMetadata;
  lexicons: Lexicons;
  completeIndices: CompleteIndices;
}

export type SignalRegexSet = {
  safetyRegex: RegExp;
  pedagogyRegex: RegExp;
  reflectionRegex: RegExp;
  empathyRegex: RegExp;
  understandingRegex: RegExp;
  fillerRegex: RegExp;
};

export interface PrunedSession {
  metadata: PruneMetadata;
  finalTranscript: Session;
};
