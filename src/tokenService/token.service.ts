import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Session } from '../types/pruner.types.js';
import { initializePruner } from '../transcriptPruner/index.pruner.js';
import { safetyWords, pedagogyWords, reflectionWords, empathyWords, understandingWords,fillerWords } from '../tokenOptimizer/config.pruner.js';


export async function tokenService(jsonData:string) {
  try {

    const sessionData: Session = JSON.parse(jsonData);

    const answer = await initializePruner(0, 100, 20, true, safetyWords,pedagogyWords,reflectionWords,empathyWords,understandingWords,fillerWords,sessionData)

  } catch (error) {
    throw error;
  }
}
