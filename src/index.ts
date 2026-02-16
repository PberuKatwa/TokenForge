import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger/index.logger.js';
import { getLLMEvaluation } from './tokenService/token.index.js';
import { Session } from './types/pruner.types.js';
import { evaluateFullTranscript } from './gemini/gemini.full.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPruner() {
  try {

    // const inputFileName = "sessionFail.json";
    const inputFileName = "sessionAverage.json";
    // const inputFileName = "sessionPerfect.json";

    const filePath = path.join(__dirname, "OriginalSessions", inputFileName);
    console.log(`Reading file from: ${filePath}`);

    const data = await fs.readFile(filePath, "utf-8");

    console.log("===============================================BEGINNING================================================")
    console.log("========================================================================================================");

    const { llmEvaluation, prunedTranscript } = await getLLMEvaluation(data);
    console.log("pruneddd", prunedTranscript)

    console.log("========================================================================================================");
    console.log("\n========================================================================================================");

    const session: Session = JSON.parse(data);

    console.time("Unoptimized Gemini Response Time");
    const unoptimizedGemini = await evaluateFullTranscript(session)
    console.timeEnd("Unoptimized Gemini Response Time");

    console.log("===============================================ENDDDDDDD================================================")
    console.log("========================================================================================================");


    if (llmEvaluation) {
      const evalFileName = inputFileName.replace(".json", "_evaluation.json");
      const evalPath = path.join(__dirname, "sessionJson", evalFileName);
      await fs.writeFile(evalPath, JSON.stringify(llmEvaluation, null, 2));
    }

    if (prunedTranscript) {
      const evalFileName = inputFileName.replace(".json", "_pruned.json");
      const evalPath = path.join(__dirname, "sessionJson", evalFileName);
      await fs.writeFile(evalPath, JSON.stringify(prunedTranscript.finalTranscript, null, 2));
    }

    if (unoptimizedGemini) {
      const evalFileName = inputFileName.replace(".json", "_unoptimized.json");
      const evalPath = path.join(__dirname, "sessionJson", evalFileName);
      await fs.writeFile(evalPath, JSON.stringify(unoptimizedGemini, null, 2));
    }


  } catch (error) {
    logger.error(`Error in running pruner`, error)
  }
}

runPruner();
