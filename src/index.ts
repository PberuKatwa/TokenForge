import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { runTest } from './tokenOptimizer/token.index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runner() {
  try {
    const inputFileName = "sessionAverage.json";
    const filePath = path.join(__dirname, "sessionJson", inputFileName);

    console.log(`Reading file from: ${filePath}`);

    const data = await fs.readFile(filePath, "utf-8");
    const result = await runTest(data);

    const prompt = `

      You are an expert Educational Quality Auditor. Your task is to evaluate a session transcript
      between a "Fellow" (teacher) and "Members" (students) based on specific scoring rubrics.

      Context of the Data:
      The transcript has been pre-processed to remove logistical noise and non-essential chatter.

      OMITTED_CONTENT (count: X) indicates that X turns were removed because they contained no pedagogical or safety signals.
      Do NOT penalize the Fellow for abruptness at these markers.

      [TRUNCATED] indicates a long monologue where only the beginning and end were kept to save tokens.

      participation_score reflects how many times members spoke for more than 3 words across the entire original session.

      Rubric 1: Content Coverage (Growth Mindset)
      Evidence Required: Clear definitions of "Growth Mindset," use of "Muscle" metaphors, and checking for understanding.

      1 (Missed): Incorrect definition or zero mention.

      2 (Partial): Mentioned but no "check for understanding" loop.

      3 (Complete): Clear explanation + Example + Group interaction loop.

      Rubric 2: Facilitation Quality
      Evidence Required: Validation ("I hear you"), open questions, and interaction balance.

      Note: Refer to participation_score. A high score suggests good engagement even if some responses were pruned.

      1 (Poor): Monologues (look for [TRUNCATED] without member breaks) or interrupting.

      2 (Adequate): Polite but purely script-based.

      3 (Excellent): Warmth, validation, and calling on specific members.

      Rubric 3: Protocol Safety
      Evidence Required: Adherence to the curriculum.

      1 (Violation): Medical advice, diagnoses, or relationship therapy.

      2 (Minor Drift): Off-topic chatter (check OMITTED_CONTENT markers for context).

      3 (Adherent): Focused strictly on the Growth Mindset protocol.

      Output Format (JSON Only):

      JSON
      {
        "scores": {
          "content_coverage": { "score": number, "reasoning": "string" },
          "facilitation_quality": { "score": number, "reasoning": "string" },
          "protocol_safety": { "score": number, "reasoning": "string" }
        },
        "summary": "string"
      }
      Input Data:
      {{YOUR_JSON_RESULT_HERE}}

    `

    // 1. Define the output path (saving it in the same directory as the input)
    const outputFileName = inputFileName.replace(".json", "_optimized.json");
    const outputPath = path.join(__dirname, "sessionJson", outputFileName);

    // 2. Convert the result object to a pretty-printed JSON string
    // The 'null, 2' arguments add indentation so it's readable for humans
    const jsonString = JSON.stringify(result, null, 2);

    // 3. Write to file
    await fs.writeFile(outputPath, jsonString, "utf-8");

    console.log(`\n✔ Success!`);
    console.log(`Optimized payload saved to: ${outputPath}`);

    // Optional: Log the reduction ratio to the console for a quick check
    // if (result.metadata) {
    //    console.log(`Reduction: ${(parseFloat(result.metadata.reduction_ratio) * 100).toFixed(0)}%`);
    // }

  } catch (error) {
    console.error(`Error in runner:`, error);
  }
}

runner();
