/**
 * TOKENCUT: Ultra-Aggressive Pruner for Minimum Latency
 * Only sends turns with detected signals - removes ALL filler
 */

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

interface ScoredTurn extends RawTurn {
  index: number;
  score: number;
}

// ULTRA-AGGRESSIVE CONFIG
const CONFIG = {
  SAFETY_LEXICON: /\b(medication|pill|doctor|diagnose|depressed|suicide|self-harm|break up|therapy|legal|clinic|prescription)\b/gi,
  PEDAGOGY_LEXICON: /\b(growth mindset|fixed mindset|neuroplasticity|effort|yet|challenge|muscle|neural|persistence|strategy)\b/gi,
  REFLECTION_PROMPTS: /\b(think quietly|reflect|imagine|what if|how would you|take a moment)\b/i,
  EMPATHY_MARKERS: /^(i hear you|that makes sense|thank you for sharing|great point)/i,
  CHECK_FOR_UNDERSTANDING: /\b(does that make sense|how do you feel|do you agree|has anyone heard)\b/i,
  FILLER_WORDS: /\b(um|uh|like|you know|i mean|actually|basically|literally|sort of|kind of|well|so|just|really|very|right|okay|yeah)\b/gi,

  // EXTREME settings
  WINDOW_PADDING: 0,  // NO context padding
  MAX_CHARS_PER_TURN: 100,  // Hyper-aggressive truncation
  MIN_SIGNAL_SCORE: 20,  // Only keep high-signal turns
  KEEP_ONLY_SIGNAL_TURNS: true  // Skip all non-signal turns
};

const countWords = (str: string): number => str.trim().split(/\s+/).length;

const stripFiller = (text: string): string => {
  return text
    .replace(CONFIG.FILLER_WORDS, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractEssence = (text: string, score: number): string => {
  let essence = stripFiller(text);

  // For safety turns, keep the critical sentence
  if (score >= 100) {
    const match = essence.match(/[^.!?]*(?:medication|pill|doctor|diagnose|depressed|suicide|self-harm|therapy|legal)[^.!?]*[.!?]/i);
    if (match) essence = match[0];
  }

  // For pedagogy turns, extract the concept mention
  else if (score >= 50) {
    const match = essence.match(/[^.!?]*(?:growth mindset|fixed mindset|neuroplasticity|effort|challenge|muscle|neural)[^.!?]*[.!?]/i);
    if (match) essence = match[0];
  }

  // Truncate aggressively
  if (essence.length > CONFIG.MAX_CHARS_PER_TURN) {
    essence = essence.slice(0, CONFIG.MAX_CHARS_PER_TURN) + "...";
  }

  return essence;
};

export function optimizeTranscriptForLLM(session: Session): EvalPayload {
  const { transcript } = session;
  const signals = { safety: 0, pedagogy: 0, facilitation: 0 };
  let participationScore = 0;
  let originalWordCount = 0;

  // PASS 1: Score and identify signal turns ONLY
  const scoredTurns: ScoredTurn[] = [];

  for (let i = 0; i < transcript.length; i++) {
    const turn = transcript[i];
    const wordCount = countWords(turn.text);
    originalWordCount += wordCount;

    const isFellow = turn.speaker === "Fellow";
    let score = 0;

    if (CONFIG.SAFETY_LEXICON.test(turn.text)) {
      score += 100;
      signals.safety++;
    }
    if (isFellow && CONFIG.PEDAGOGY_LEXICON.test(turn.text)) {
      score += 50;
      signals.pedagogy++;
    }
    if (isFellow) {
      if (CONFIG.REFLECTION_PROMPTS.test(turn.text)) {
        score += 40;
        signals.facilitation++;
      }
      if (CONFIG.EMPATHY_MARKERS.test(turn.text) || CONFIG.CHECK_FOR_UNDERSTANDING.test(turn.text)) {
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

  // PASS 2: Extract essence and build minimal payload
  const finalPayload: ProcessedTurn[] = [];
  let finalWordCount = 0;

  for (const turn of scoredTurns) {
    const essence = extractEssence(turn.text, turn.score);

    finalPayload.push({
      speaker: turn.speaker,
      text: essence,
      _compressed: essence !== turn.text
    });

    finalWordCount += countWords(essence);
  }

  const reduction = originalWordCount > 0
    ? (1 - (finalWordCount / originalWordCount)).toFixed(2)
    : "0.00";

  return {
    metadata: {
      session_topic: session.session_topic,
      original_turns: transcript.length,
      original_word_count: originalWordCount,
      extracted_signals: signals,
      participation_score: participationScore,
      final_payload_turns: finalPayload.length,
      final_word_count: finalWordCount,
      word_reduction_ratio: reduction
    },
    evaluation_ready_transcript: finalPayload
  };
}
