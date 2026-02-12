import * as fs from 'fs/promises';
import * as path from 'path'; // 1. Import path module
import { fileURLToPath } from 'url';
import { runTest } from './tokenOptimizer/token.index.js';

// 2. Setup __dirname for ESM (since you are likely using ES Modules with tsx)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runner() {
  try {
    // 3. Construct the absolute path to the file in the same directory
    const filePath = path.join(__dirname, "session1.json");

    console.log(`Reading file from: ${filePath}`); // Debugging line

    const data = await fs.readFile(filePath, "utf-8");
    const result = await runTest(data);

    // console.log(result);

  } catch (error) {
    console.error(`Error in runner`, error);
  }
}

runner();
