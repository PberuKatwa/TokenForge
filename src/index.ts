import * as fs from 'fs/promises';
import { runTest } from './tokenOptimizer/token.index.js';

async function runner() {
  try {

    const data = await fs.readFile("../src/tokenOptimizer/session1.json", "utf-8");
    const result = await runTest(data);



  } catch (error) {
    console.error(`Error in runner`,error)
  }
}

runner()
