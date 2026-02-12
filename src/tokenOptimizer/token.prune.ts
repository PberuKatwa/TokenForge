/**
 * TOKENCUT: Exhaustive Transcript Preprocessing for LLM Evaluation
 * Language: TypeScript 5.x
 */

// --- Types & Interfaces ---

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

export interface OmittedMarker {
  _type: "OMITTED_CONTENT";
  count: number;
}

export interface ProcessedTurn extends RawTurn {
  _compressed?: boolean;
}

export type PayloadTurn = ProcessedTurn | OmittedMarker;

export interface EvalMetadata {
  session_topic: string;
  original_turns: number;
  extracted_signals: {
    safety: number;
    pedagogy: number;
    facilitation: number;
  };
  participation_score: number;
  final_payload_turns: number;
  reduction_ratio: string;
}

export interface EvalPayload {
  metadata: EvalMetadata;
  evaluation_ready_transcript: PayloadTurn[];
}

interface ScoredTurn extends RawTurn {
  index: number;
  score: number;
  tags: string[];
}

// --- Configuration ---

const CONFIG = {
  SAFETY_LEXICON: /\b(medication|pill|doctor|diagnose|depressed|suicide|self-harm|break up|therapy|legal|clinic|prescription)\b/gi,
  PEDAGOGY_LEXICON: /\b(growth mindset|fixed mindset|neuroplasticity|effort|yet|challenge|muscle|neural|persistence|strategy)\b/gi,
  REFLECTION_PROMPTS: /\b(think quietly|reflect|imagine|what if|how would you|take a moment)\b/i,
  EMPATHY_MARKERS: /^(i hear you|that makes sense|thank you for sharing|great point|i appreciate your honesty)/i,
  CHECK_FOR_UNDERSTANDING: /\b(does that make sense|how do you feel about|do you agree|has anyone heard)\b/i,
  WINDOW_PADDING: 2,
  MAX_MONOLOGUE_CHARS: 600
};

// --- Core Logic ---

/**
 * Optimizes a transcript into a token-efficient payload for LLM analysis.
 */
export function optimizeTranscriptForLLM(session: Session): EvalPayload {
  const { transcript } = session;
  const scoredTurns: ScoredTurn[] = [];

  const signals = { safety: 0, pedagogy: 0, facilitation: 0 };
  let participationScore = 0;

  // PASS 1: Categorization & Scoring
  for (let i = 0; i < transcript.length; i++) {
    const turn = transcript[i];
    const text = turn.text;
    const isFellow = turn.speaker === "Fellow";

    let score = 0;
    const tags: string[] = [];

    // Protocol Safety
    if (CONFIG.SAFETY_LEXICON.test(text)) {
      score += 100;
      tags.push("SAFETY_CRITICAL");
      signals.safety++;
    }

    // Content Coverage
    if (isFellow && CONFIG.PEDAGOGY_LEXICON.test(text)) {
      score += 50;
      tags.push("PEDAGOGY");
      signals.pedagogy++;
    }

    // Facilitation Quality
    if (isFellow) {
      if (CONFIG.REFLECTION_PROMPTS.test(text)) {
        score += 40;
        tags.push("REFLECTION");
        signals.facilitation++;
      }
      if (CONFIG.EMPATHY_MARKERS.test(text) || CONFIG.CHECK_FOR_UNDERSTANDING.test(text)) {
        score += 30;
        tags.push("FACILITATION");
        signals.facilitation++;
      }
    }

    // Interaction Check (Metric Support)
    if (!isFellow && text.split(/\s+/).length > 3) {
      participationScore++;
    }

    scoredTurns.push({ ...turn, index: i, score, tags });

    // Reset regex state for global flags
    CONFIG.SAFETY_LEXICON.lastIndex = 0;
    CONFIG.PEDAGOGY_LEXICON.lastIndex = 0;
  }

  // PASS 2: Cluster Identification (Sliding Window)
  const keepIndices = new Set<number>();
  scoredTurns.forEach(turn => {
    if (turn.score > 0) {
      for (let i = turn.index - CONFIG.WINDOW_PADDING; i <= turn.index + CONFIG.WINDOW_PADDING; i++) {
        if (i >= 0 && i < transcript.length) keepIndices.add(i);
      }
    }
  });

  // PASS 3: Assembly & Intra-turn Compression
  const finalPayload: PayloadTurn[] = [];
  const sortedIndices = Array.from(keepIndices).sort((a, b) => a - b);
  let lastIdx = -1;

  for (const idx of sortedIndices) {
    // Inject gap marker if content was skipped
    if (lastIdx !== -1 && idx > lastIdx + 1) {
      finalPayload.push({
        _type: "OMITTED_CONTENT",
        count: idx - lastIdx - 1
      });
    }

    const originalTurn = transcript[idx];
    const processedTurn: ProcessedTurn = { ...originalTurn };

    // Prune very long monologues (preserve start and end)
    if (processedTurn.text.length > CONFIG.MAX_MONOLOGUE_CHARS) {
      const half = Math.floor(CONFIG.MAX_MONOLOGUE_CHARS / 2);
      processedTurn.text = `${processedTurn.text.slice(0, half)} ... [LONG MONOLOGUE TRUNCATED] ... ${processedTurn.text.slice(-half)}`;
      processedTurn._compressed = true;
    }

    finalPayload.push(processedTurn);
    lastIdx = idx;
  }

  return {
    metadata: {
      session_topic: session.session_topic,
      original_turns: transcript.length,
      extracted_signals: signals,
      participation_score: participationScore,
      final_payload_turns: finalPayload.length,
      reduction_ratio: (1 - (finalPayload.length / transcript.length)).toFixed(2)
    },
    evaluation_ready_transcript: finalPayload
  };
}
