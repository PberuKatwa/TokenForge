import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger/index.logger.js';
import { tokenService } from './tokenService/token.service.js';

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

    const { prunedSession, unoptimizedGemini, finalEvaluation } = await tokenService(data);

    console.log("pruneddd", prunedSession)
    // console.log("unoptimizedGemini", unoptimizedGemini)
    // console.log("finalEvaluation", finalEvaluation)

    if (prunedSession) {
      const evalFileName = inputFileName.replace(".json", "_pruned.json");
      const evalPath = path.join(__dirname, "sessionJson", evalFileName);
      await fs.writeFile(evalPath, JSON.stringify(prunedSession.finalTranscript, null, 2));
    }

    if (unoptimizedGemini) {
      const evalFileName = inputFileName.replace(".json", "_unoptimized.json");
      const evalPath = path.join(__dirname, "sessionJson", evalFileName);
      await fs.writeFile(evalPath, JSON.stringify(unoptimizedGemini, null, 2));
    }

    if (finalEvaluation) {
      const evalFileName = inputFileName.replace(".json", "_evaluation.json");
      const evalPath = path.join(__dirname, "sessionJson", evalFileName);
      await fs.writeFile(evalPath, JSON.stringify(finalEvaluation, null, 2));
    }

  } catch (error) {
    logger.error(`Error in running pruner`, error)
  }
}

runPruner()


// console.log("===============================================BEGINNING================================================")
// console.log("========================================================================================================");

// const prunedSession = await getPrunedSession(allLexicons,sessionData)


// console.time("Gemini Response Time");
// const finalEvaluation = await evaluateWithGemini(prunedSession);
// console.timeEnd("Gemini Response Time");

// // console.log("Optimized Evaluation", finalEvaluation)

// // console.log("PrunedSession", prunedSession)
// // console.log(JSON.stringify(prunedSession.finalTranscript, null, 2));

// console.log("========================================================================================================");
// console.log("\n========================================================================================================");


// console.time("Unoptimized Gemini Response Time");
// const unoptimizedGemini = await evaluateFullTranscript(sessionData)
// console.timeEnd("Unoptimized Gemini Response Time");

// // console.log("Unoptimized Evaluation", unoptimizedGemini)

// console.log("===============================================ENDDDDDDD================================================")
// console.log("========================================================================================================");
