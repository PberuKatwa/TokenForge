import { Session } from '../types/pruner.types.js';
import { getPrunedSession } from './token.service.js';
import { allLexicons } from './token.config.js';
import { SessionSchema } from '../validators/session.schema.js';
import { LLMEvaluation } from '../types/evaluation.types.js';
import { useGeminiLLMApi } from '../gemini/gemini.api.js';


export async function tokenService(jsonData:string):Promise<LLMEvaluation> {
  try {

    const parsedJson: Session = JSON.parse(jsonData);
    const result = SessionSchema.safeParse(parsedJson);

    if (!result.success) {
      console.error("validation error",result.error.format());
      throw new Error(`Invalid session data format`);
    }

    const sessionData = result.data;
    const prunedSession = await getPrunedSession(allLexicons, sessionData);

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

    const llmEvaluation = await useGeminiLLMApi(systemPrompt, prunedSession.finalTranscript);

    // const unoptimizedGemini = null;
    // const finalEvaluation = null;

    return llmEvaluation;
  } catch (error) {
    throw error;
  }
}
