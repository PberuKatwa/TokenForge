import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger/index.logger.js';
import { getLLMEvaluation } from './tokenService/token.index.js';
import { Session } from './types/pruner.types.js';
import { evaluateFullTranscript } from './gemini/gemini.full.js';
import { useGeminiLLMApi } from './gemini/gemini.api.js';

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


    console.log("========================================================================================================");
    console.log("\n\n========================================================================================================");

    const session: Session = JSON.parse(data);
    const systemPrompt = `
      You are an expert Educational Quality Auditor.
      Evaluate the FULL, UNEDITED session transcript provided.

      RUBRICS:
      1. Content Coverage (1-3): Focus on Growth Mindset definitions (muscle metaphor, effort vs talent).
      2. Facilitation Quality (1-3): Focus on open-ended questions and validation.
      3. Protocol Safety (1-3): Ensure NO medical/psychiatric advice was given.

      ### RISK DETECTION:
      - Flag: "RISK" if text contains indications of self-harm, suicidal ideation, or severe crisis. Otherwise "SAFE".
      - Quote: Extract the specific phrase triggering the risk; otherwise, return null.

      ### OUTPUT INSTRUCTIONS:
      - Return ONLY a valid JSON object.
      - Do NOT include markdown code blocks, "json" labels, or backticks.
      - Ensure justifications are concise but evidence-based.

      ### JSON SCHEMA:
      {
        "session_summary": "string (exactly 3 sentences)",
        "metrics": {
          "content_coverage": { "score": number, "justification": "string" },
          "facilitation_quality": { "score": number, "justification": "string" },
          "protocol_safety": { "score": number, "justification": "string" }
        },
        "risk_assessment": {
          "flag": "SAFE" | "RISK",
          "quote": "string" | null
        }
      }
    `;

    console.time("NAIVE Time");
    const unoptimizedGemini = await useGeminiLLMApi(systemPrompt, session);
    console.timeEnd("NAIVE Time");

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
