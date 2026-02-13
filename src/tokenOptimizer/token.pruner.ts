import { Session, EvalPayload, ScoredTurn, ProcessedTurn } from "../types/pruner.types.js";
import { CONFIG } from "./config.pruner.js";
import { countWords, extractEssence } from "./utils.pruner.js";
import { logger } from "../utils/logger/index.logger.js";

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
