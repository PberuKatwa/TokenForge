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

export interface ProcessedTurn extends RawTurn {
  _compressed?: boolean;
}

export interface EvalMetadata {
  session_topic: string;
  original_turns: number;
  original_word_count: number;
  extracted_signals: {
    safety: number;
    pedagogy: number;
    facilitation: number;
  };
  participation_score: number;
  final_payload_turns: number;
  final_word_count: number;
  word_reduction_ratio: string;
}

export interface EvalPayload {
  metadata: EvalMetadata;
  evaluation_ready_transcript: ProcessedTurn[];
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

export interface SignalScores {
  safety: number;
  pedagogy: number;
  facilitation: number;
}

export interface PruneMetadata {
  participationScore: number;
  originalWordCount: number;
  originalTurns: number;
  finalTurns: number;
  finalWordCount: number;
}

export interface PruneContext {
  sessionTranscript: Session;
  signalsScores: SignalScores;
  metadata: PruneMetadata;
  lexicons: Lexicons;
}
