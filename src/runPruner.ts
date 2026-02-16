import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger/index.logger.js";
import { getLLMEvaluation } from "./tokenService/token.index.js";
import { Session } from "./types/pruner.types.js";
import { useGeminiLLMApi } from "./gemini/gemini.api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORIGINAL_SESSIONS_DIR = path.join(__dirname, "OriginalSessions");
const OUTPUT_DIR = path.join(__dirname, "sessionJson");

interface RunConfig {
  inputFileName: string;
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    logger.error("Failed ensuring directory exists", { dirPath, error });
    throw error;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    logger.info("File written successfully", { filePath });
  } catch (error) {
    logger.error("Failed writing JSON file", { filePath, error });
    throw error;
  }
}

export async function runPruner(config: RunConfig): Promise<void> {
  const { inputFileName } = config;

  const filePath = path.join(ORIGINAL_SESSIONS_DIR, inputFileName);
  logger.info("Starting pruner run", { inputFileName, filePath });

  try {
    await ensureDirectoryExists(OUTPUT_DIR);

    logger.warn("Reading session file");
    const rawData = await fs.readFile(filePath, "utf-8");
    const session: Session = JSON.parse(rawData);

    logger.info("Session file loaded", {
      sizeBytes: Buffer.byteLength(rawData),
    });

    logger.info("Running optimized LLM evaluation");
    const { llmEvaluation, prunedTranscript } = await getLLMEvaluation(rawData);

    logger.info("Optimized evaluation complete");

    const systemPrompt = buildSystemPrompt();
    logger.info("Running unoptimized Gemini evaluation");

    const startTime = performance.now();
    const unoptimizedGemini = await useGeminiLLMApi(
      systemPrompt,
      session
    );
    const durationMs = performance.now() - startTime;

    logger.info("Unoptimized Gemini complete", {
      durationMs: Math.round(durationMs),
    });


    const baseName = inputFileName.replace(".json", "");
    if (llmEvaluation) {
      await writeJsonFile(
        path.join(OUTPUT_DIR, `${baseName}_evaluation.json`),
        llmEvaluation
      );
    }

    if (prunedTranscript) {
      await writeJsonFile(
        path.join(OUTPUT_DIR, `${baseName}_pruned.json`),
        prunedTranscript.finalTranscript
      );
    }

    if (unoptimizedGemini) {
      await writeJsonFile(
        path.join(OUTPUT_DIR, `${baseName}_unoptimized.json`),
        unoptimizedGemini
      );
    }

    logger.info("Pruner run completed successfully", {
      inputFileName,
    });

  } catch (error) {
    logger.error("Pruner execution failed", {
      inputFileName,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    process.exitCode = 1;
  }
}

function buildSystemPrompt(): string {
  return `
    You are an expert Educational Quality Auditor.
    Evaluate the FULL, UNEDITED session transcript provided.

    RUBRICS:
    1. Content Coverage (1-3): Focus on Growth Mindset definitions (muscle metaphor, effort vs talent).
    2. Facilitation Quality (1-3): Focus on open-ended questions and validation.
    3. Protocol Safety (1-3): Ensure NO medical/psychiatric advice was given.

    RISK DETECTION:
    - Flag: "RISK" if text contains indications of self-harm, suicidal ideation, or severe crisis.
    - Otherwise return "SAFE".
    - Quote: Extract the triggering phrase; otherwise null.

    OUTPUT INSTRUCTIONS:
    - Return ONLY a valid JSON object.
    - No markdown blocks.
    - Concise but evidence-based justifications.

    JSON SCHEMA:
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
}
