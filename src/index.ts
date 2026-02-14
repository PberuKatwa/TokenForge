import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { runTest } from './tokenOptimizer/token.index.js';
import { evaluateWithGemini } from './tokenOptimizer/gemini.js';
import { evaluateFullTranscript } from './tokenOptimizer/geminiFull.js';
import { Session } from './tokenOptimizer/token.pruneLogged.js';
import { logger } from './utils/logger/index.logger.js';
import { tokenService } from './tokenService/token.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function runPruner() {
  try {
    // const inputFileName = "sessionFail.json";
    // const inputFileName = "sessionAverage.json";
    const inputFileName = "sessionPerfect.json";

    const filePath = path.join(__dirname, "sessionJson", inputFileName);
    console.log(`Reading file from: ${filePath}`);

    const data = await fs.readFile(filePath, "utf-8");

    const output = await tokenService(data)

  } catch (error) {
    logger.error(`Error in running pruner`, error)
  }
}

runPruner()
