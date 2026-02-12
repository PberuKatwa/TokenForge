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
  // Safety-related keywords (Protocol Safety: things the Fellow should NOT give advice on)
  SAFETY_LEXICON: /\b(medication|pill|doctor|diagnose|depressed|suicide|self-harm|break up|therapy|legal|clinic|prescription|relationship|stop this|don’t do that)\b/gi,

  // Pedagogy-related keywords (Content Coverage: Growth Mindset concepts)
  PEDAGOGY_LEXICON: /\b(growth mindset|fixed mindset|abilities can improve|effort matters|learning from failure|brain is a muscle|practice|strategies|improvement|yet|challenge|small steps|continuous improvement|skills|motivation|persistence|learning|mistakes)\b/gi,

  // Reflection prompts (Facilitation Quality: encouraging self-reflection)
  REFLECTION_PROMPTS: /\b(think quietly|reflect|imagine|what if|how would you|take a moment|notice|catch a thought|connect this to real life|consider)\b/i,

  // Empathy markers (Facilitation Quality: showing warmth & validation)
  EMPATHY_MARKERS: /^(i hear you|that’s a very common feeling|that makes sense|thank you for sharing|great point|i appreciate your honesty|exactly|perfect|good point|sounds like that was hard|nice example)/i,

  // Checking for understanding (Facilitation Quality: engagement & comprehension)
  CHECK_FOR_UNDERSTANDING: /\b(does that make sense|how do you feel about|do you agree|has anyone heard|what usually goes through your mind|could be a version of that thought|next question|what do you think|can you share)\b/i,

  // Other parameters
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

   console.log(`\n🚀 [START] Optimizing session: "${session.session_topic}"`);

   // PASS 1: Categorization & Scoring
   console.log(`\n--- PASS 1: SCORING LOGS ---`);
   for (let i = 0; i < transcript.length; i++) {
     const turn = transcript[i];
     const text = turn.text;
     const isFellow = turn.speaker === "Fellow";
     let score = 0;
     const tags: string[] = [];
     // console.log("===========================================================================================================")

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

     if (score > 0) {
       console.log(`[HIT] Turn #${i} (${turn.speaker}): Score ${score} | Tags: [${tags.join(", ")}] | Text: "${text.substring(0, 50)}..."`);
     }

     if (!isFellow && text.split(/\s+/).length > 3) participationScore++;
     scoredTurns.push({ ...turn, index: i, score, tags });

     CONFIG.SAFETY_LEXICON.lastIndex = 0;
     CONFIG.PEDAGOGY_LEXICON.lastIndex = 0;
     // console.log("===========================================================================================================")
   }

   // PASS 2: Cluster Identification
   console.log(`\n--- PASS 2: WINDOW EXPANSION ---`);
   const keepIndices = new Set<number>();
   scoredTurns.forEach(turn => {
     if (turn.score > 0) {
       const start = Math.max(0, turn.index - CONFIG.WINDOW_PADDING);
       const end = Math.min(transcript.length - 1, turn.index + CONFIG.WINDOW_PADDING);

       console.log(`[WINDOW] Signal at #${turn.index} triggering keep for range: ${start} to ${end}`);

       for (let i = start; i <= end; i++) {
         keepIndices.add(i);
       }
     }
   });

   // PASS 3: Assembly & Truncation
   console.log(`\n--- PASS 3: FINAL ASSEMBLY ---`);
   const finalPayload: PayloadTurn[] = [];
   const sortedIndices = Array.from(keepIndices).sort((a, b) => a - b);
   let lastIdx = -1;

   for (const idx of sortedIndices) {
     // Log Omissions
     if (lastIdx !== -1 && idx > lastIdx + 1) {
       const skippedCount = idx - lastIdx - 1;
       console.log(`[SKIP] Skipping ${skippedCount} turns between index ${lastIdx} and ${idx}`);
       finalPayload.push({ _type: "OMITTED_CONTENT", count: skippedCount });
     }

     const originalTurn = transcript[idx];
     const processedTurn: ProcessedTurn = { ...originalTurn };

     if (processedTurn.text.length > CONFIG.MAX_MONOLOGUE_CHARS) {
       console.log(`[COMPRESS] Truncating Turn #${idx} monologue (${processedTurn.text.length} chars)`);
       const half = Math.floor(CONFIG.MAX_MONOLOGUE_CHARS / 2);
       processedTurn.text = `${processedTurn.text.slice(0, half)} ... [TRUNCATED] ... ${processedTurn.text.slice(-half)}`;
       processedTurn._compressed = true;
     }

     finalPayload.push(processedTurn);
     lastIdx = idx;
   }

   const reduction = (1 - (finalPayload.length / transcript.length)) * 100;
   console.log(`\n✅ [FINISH] Optimization complete. Reduction: ${reduction.toFixed(1)}%\n`);

   return {
     metadata: {
       session_topic: session.session_topic,
       original_turns: transcript.length,
       extracted_signals: signals,
       participation_score: participationScore,
       final_payload_turns: finalPayload.length,
       reduction_ratio: (reduction / 100).toFixed(2)
     },
     evaluation_ready_transcript: finalPayload
   };
 }
