import { optimizeTranscriptForLLM, Session, EvalPayload } from './token.prune.js';

export async function runTest(jsonData:string) {
  try {

    const session: Session = JSON.parse(jsonData);

    console.log(`--- Starting Optimization for: ${session.session_topic} ---`);
    console.log(`Original Size: ${session.transcript.length} turns`);

    // 2. Execute the pruning logic
    const result: EvalPayload = optimizeTranscriptForLLM(session);

    // 3. Log the Performance Metadata
    // console.log("\n--- Compression Stats ---");
    // console.table({
    //   "Original Turns": result.metadata.original_turns,
    //   "Final Turns": result.metadata.final_payload_turns,
    //   "Reduction Ratio": `${(parseFloat(result.metadata.reduction_ratio) * 100).toFixed(0)}%`,
    //   "Participation Hits": result.metadata.participation_score
    // });

    // console.log("\n--- Signals Detected ---");
    // console.table(result.metadata.extracted_signals);

    // 4. Log the actual Payload for inspection
    console.log("\n--- Final Payload Preview ---");
    console.log(JSON.stringify(result.evaluation_ready_transcript, null, 2));

    return result;

  } catch (error) {
    console.error("Error processing transcript:", error);
  }
}
