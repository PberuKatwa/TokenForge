import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';
import { safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords,fillerWords } from '../tokenOptimizer/config.pruner.js';


export async function tokenService() {
  try {

    // const inputFileName = "sessionFail.json";
    const inputFileName = "sessionAverage.json";
    // const inputFileName = "sessionPerfect.json";
    const filePath = path.join(__dirname, "sessionJson", inputFileName);

    console.log(`Reading file from: ${filePath}`);

    const data = await fs.readFile(filePath, "utf-8");
    const sessionData: Session = JSON.parse(data);

    const answer = await initializePruner(0, 100, 20, true, safetyWords,pedagogyWords,reflectionWords,empathyWords,understandingWords,fillerWords,sessionData)

  } catch (error) {
    throw error;
  }
}
