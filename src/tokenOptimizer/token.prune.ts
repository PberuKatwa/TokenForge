/**
 * TOKENCUT: Exhaustive Transcript Preprocessing for LLM Evaluation
 * Language: TypeScript 5.x
 * ENHANCED: Aggressive word reduction strategies
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
  evaluation_ready_transcript: PayloadTurn[];
}

interface ScoredTurn extends RawTurn {
  index: number;
  score: number;
  tags: string[];
}

// --- Configuration (AGGRESSIVE MODE) ---

const CONFIG = {
  SAFETY_LEXICON: /\b(medication|pill|doctor|diagnose|depressed|suicide|self-harm|break up|therapy|legal|clinic|prescription)\b/gi,
  PEDAGOGY_LEXICON: /\b(growth mindset|fixed mindset|neuroplasticity|effort|yet|challenge|muscle|neural|persistence|strategy)\b/gi,
  REFLECTION_PROMPTS: /\b(think quietly|reflect|imagine|what if|how would you|take a moment)\b/i,
  EMPATHY_MARKERS: /^(i hear you|that makes sense|thank you for sharing|great point|i appreciate your honesty)/i,
  CHECK_FOR_UNDERSTANDING: /\b(does that make sense|how do you feel about|do you agree|has anyone heard)\b/i,

  // Aggressive compression settings
  FILLER_WORDS: /\b(um|uh|like|you know|i mean|actually|basically|literally|sort of|kind of|well|so|just|really|very)\b/gi,
  REPETITION_PATTERN: /\b(\w+)\s+\1\b/gi,
  WINDOW_PADDING: 1,  // Reduced from 2 - tighter context windows
  MAX_MONOLOGUE_CHARS: 250,  // Reduced from 600 - aggressive truncation
  MIN_TURN_SCORE: 5,  // Skip low-value turns entirely
  COMPRESS_FELLOW_TURNS: true,  // Extract only key phrases from Fellow
  STRIP_FILLER: true,  // Remove filler words
  MERGE_CONSECUTIVE_SPEAKERS: true,  // Combine sequential turns from same speaker
  SUMMARY_THRESHOLD: 100  // Summarize turns longer than this word count
};

// --- Helper Functions ---

const countWords = (str: string): number => str.trim().split(/\s+/).length;

const stripFiller = (text: string): string => {
  if (!CONFIG.STRIP_FILLER) return text;
  return text
    .replace(CONFIG.FILLER_WORDS, '')
    .replace(CONFIG.REPETITION_PATTERN, '$1')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractKeyPhrases = (text: string): string => {
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  // Keep only sentences with lexicon matches or questions
  const keySentences = sentences.filter(s => {
    return CONFIG.SAFETY_LEXICON.test(s) ||
           CONFIG.PEDAGOGY_LEXICON.test(s) ||
           CONFIG.REFLECTION_PROMPTS.test(s) ||
           CONFIG.CHECK_FOR_UNDERSTANDING.test(s) ||
           /\?/.test(s);
  });

  CONFIG.SAFETY_LEXICON.lastIndex = 0;
  CONFIG.PEDAGOGY_LEXICON.lastIndex = 0;

  return keySentences.length > 0 ? keySentences.join(' ') : sentences[0] || text;
};

const compressText = (text: string, isFellow: boolean, score: number): string => {
  let compressed = stripFiller(text);

  // For Fellow turns with low scores, extract only key phrases
  if (isFellow && CONFIG.COMPRESS_FELLOW_TURNS && score < 30) {
    compressed = extractKeyPhrases(compressed);
  }

  // Aggressive truncation for long turns
  if (compressed.length > CONFIG.MAX_MONOLOGUE_CHARS) {
    const half = Math.floor(CONFIG.MAX_MONOLOGUE_CHARS / 2);
    compressed = `${compressed.slice(0, half)}...[TRUNCATED]...${compressed.slice(-half)}`;
  }

  return compressed;
};

// --- Main Processing Function ---

export function optimizeTranscriptForLLM(session: Session): EvalPayload {
  const { transcript } = session;
  const scoredTurns: ScoredTurn[] = [];
  const signals = { safety: 0, pedagogy: 0, facilitation: 0 };
  let participationScore = 0;
  let originalWordCount = 0;

  // PASS 1: Categorization & Scoring
  for (let i = 0; i < transcript.length; i++) {
    const turn = transcript[i];
    const text = turn.text;
    const wordCount = countWords(text);
    originalWordCount += wordCount;

    const isFellow = turn.speaker === "Fellow";
    let score = 0;
    const tags: string[] = [];

    if (CONFIG.SAFETY_LEXICON.test(text)) {
      score += 100; tags.push("SAFETY"); signals.safety++;
    }
    if (isFellow && CONFIG.PEDAGOGY_LEXICON.test(text)) {
      score += 50; tags.push("PEDAGOGY"); signals.pedagogy++;
    }
    if (isFellow) {
      if (CONFIG.REFLECTION_PROMPTS.test(text)) {
        score += 40; tags.push("REFLECTION"); signals.facilitation++;
      }
      if (CONFIG.EMPATHY_MARKERS.test(text) || CONFIG.CHECK_FOR_UNDERSTANDING.test(text)) {
        score += 30; tags.push("FACILITATION"); signals.facilitation++;
      }
    }

    if (!isFellow && wordCount > 3) participationScore++;

    scoredTurns.push({ ...turn, index: i, score, tags });
    CONFIG.SAFETY_LEXICON.lastIndex = 0;
    CONFIG.PEDAGOGY_LEXICON.lastIndex = 0;
  }

  // PASS 2: Enhanced Cluster Identification
  const keepIndices = new Set<number>();
  scoredTurns.forEach(turn => {
    // Only keep turns that meet minimum score threshold OR are high-signal
    if (turn.score >= CONFIG.MIN_TURN_SCORE || turn.tags.includes("SAFETY")) {
      for (let i = turn.index - CONFIG.WINDOW_PADDING; i <= turn.index + CONFIG.WINDOW_PADDING; i++) {
        if (i >= 0 && i < transcript.length) keepIndices.add(i);
      }
    }
  });

  // PASS 3: Merge consecutive same-speaker turns
  const sortedIndices = Array.from(keepIndices).sort((a, b) => a - b);
  const mergedIndices: number[][] = [];
  let currentGroup: number[] = [];

  if (CONFIG.MERGE_CONSECUTIVE_SPEAKERS) {
    for (let i = 0; i < sortedIndices.length; i++) {
      const idx = sortedIndices[i];
      if (currentGroup.length === 0) {
        currentGroup.push(idx);
      } else {
        const prevIdx = currentGroup[currentGroup.length - 1];
        const prevSpeaker = transcript[prevIdx].speaker;
        const currSpeaker = transcript[idx].speaker;

        // Merge if same speaker and consecutive indices
        if (prevSpeaker === currSpeaker && idx === prevIdx + 1) {
          currentGroup.push(idx);
        } else {
          mergedIndices.push([...currentGroup]);
          currentGroup = [idx];
        }
      }
    }
    if (currentGroup.length > 0) mergedIndices.push(currentGroup);
  } else {
    mergedIndices.push(...sortedIndices.map(idx => [idx]));
  }

  // PASS 4: Assembly with aggressive compression
  const finalPayload: PayloadTurn[] = [];
  let lastMaxIdx = -1;
  let finalWordCount = 0;

  for (const group of mergedIndices) {
    const minIdx = group[0];
    const maxIdx = group[group.length - 1];

    // Add omission marker if gap exists
    if (lastMaxIdx !== -1 && minIdx > lastMaxIdx + 1) {
      finalPayload.push({ _type: "OMITTED_CONTENT", count: minIdx - lastMaxIdx - 1 });
    }

    // Merge group turns if same speaker
    if (group.length > 1) {
      const speaker = transcript[minIdx].speaker;
      const combinedText = group.map(idx => transcript[idx].text).join(' ');
      const avgScore = group.reduce((sum, idx) => sum + scoredTurns[idx].score, 0) / group.length;

      const compressed = compressText(combinedText, speaker === "Fellow", avgScore);
      const processedTurn: ProcessedTurn = {
        speaker,
        text: compressed,
        _compressed: true
      };

      finalWordCount += countWords(compressed);
      finalPayload.push(processedTurn);
    } else {
      // Single turn
      const idx = group[0];
      const originalTurn = transcript[idx];
      const turnScore = scoredTurns[idx].score;

      const compressed = compressText(
        originalTurn.text,
        originalTurn.speaker === "Fellow",
        turnScore
      );

      const processedTurn: ProcessedTurn = {
        speaker: originalTurn.speaker,
        text: compressed,
        _compressed: compressed !== originalTurn.text
      };

      finalWordCount += countWords(compressed);
      finalPayload.push(processedTurn);
    }

    lastMaxIdx = maxIdx;
  }

  const reduction = (1 - (finalWordCount / originalWordCount)).toFixed(2);

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
