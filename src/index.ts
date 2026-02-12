import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { runTest } from './tokenOptimizer/token.index.js';
import { evaluateWithGemini } from './tokenOptimizer/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runner() {
  try {
    const inputFileName = "sessionFail.json";
    const filePath = path.join(__dirname, "sessionJson", inputFileName);

    console.log(`Reading file from: ${filePath}`);

    const data = await fs.readFile(filePath, "utf-8");
    const result = await runTest(data);

    console.log("--- Pruning Complete. Sending to Gemini... ---");

    if (!result) throw new Error(`No result for running test`);
    console.time("Gemini Response Time");
    const finalEvaluation = await evaluateWithGemini(result);
    console.timeEnd("Gemini Response Time");

    if (finalEvaluation) {
      const evalFileName = inputFileName.replace(".json", "_eval.json");
        console.log("\n--- Final AI Scores ---");
        console.table(finalEvaluation.scores);
        // console.log("\nReasoning:", finalEvaluation.reasoning);

        // Save the final evaluation result
        const evalPath = path.join(__dirname, "sessionJson", evalFileName);
        await fs.writeFile(evalPath, JSON.stringify(finalEvaluation, null, 2));
    }

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
