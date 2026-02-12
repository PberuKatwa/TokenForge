import { optimizeTranscriptForLLM, Session, EvalPayload } from './token.prune.js';

export async function runTest(jsonData:string) {
  try {

    const session: Session = JSON.parse(jsonData);

    // console.log(`--- Starting Optimization for: ${session.session_topic} ---`);
    // console.log(`Original Size: ${session.transcript.length} turns`);

    // 2. Execute the pruning logic
    const result: EvalPayload = optimizeTranscriptForLLM(session);

    // 3. Log the Performance Metadata

    console.log("\n--- Session Compression Stats ---");
    console.table({
      "Session Topic": result.metadata.session_topic,
      "Original Turns": result.metadata.original_turns,
      "Original Word Count": result.metadata.original_word_count,
      "Final Turns": result.metadata.final_payload_turns,
      "Final Word Count": result.metadata.final_word_count,
      "Word Reduction Ratio": `${(parseFloat(result.metadata.word_reduction_ratio) * 100).toFixed(0)}%`,
      "Participation Score": result.metadata.participation_score,
      "Extracted Signals": Array.isArray(result.metadata.extracted_signals)
        ? result.metadata.extracted_signals.length
        : result.metadata.extracted_signals
    });

    // console.log("\n--- Signals Detected ---");
    // console.table(result.metadata.extracted_signals);

    // 4. Log the actual Payload for inspection
    //
    // console.log("\n--- Final Payload Preview ---");
    // console.log(JSON.stringify(result.evaluation_ready_transcript, null, 2));

    return result;

  } catch (error) {
    console.error("Error processing transcript:", error);
  }
}
