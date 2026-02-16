import { GoogleGenerativeAI } from "@google/generative-ai";
import { Session } from "../types/pruner.types.js";
import dotenv from 'dotenv';
dotenv.config();

export async function evaluateFullTranscript(session: Session) {
  const api_key = process.env.GEMINI_API_KEY;
  if (!api_key) throw new Error(`NO api key for gemini was found`);

  const genAI = new GoogleGenerativeAI(api_key);
  const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
  });


  const systemPrompt = `
    You are a Senior Healthcare Clinical Evaluator for the Shamiri Institute. Your task is to analyze session transcripts between "Fellows" (lay-providers)
    and "Members." You must evaluate the session based on the provided rubric and output a strict JSON object.

    ### EVALUATION RUBRIC:
    1. Content Coverage (Growth Mindset):
    - Score 1 (Missed): Failed to mention "Growth Mindset" or defined it incorrectly.
    - Score 2 (Partial): Mentioned the concept but did not check for understanding or moved too quickly.
    - Score 3 (Complete): Explained the concept (e.g., "brain is a muscle"), gave an example, and asked for group thoughts.

    2. Facilitation Quality:
    - Score 1 (Poor): Monologue, interrupted students, or used confusing jargon.
    - Score 2 (Adequate): Polite but transactional. Stuck to the script without deep engagement.
    - Score 3 (Excellent): Warm, validated feelings (e.g., "That sounds hard"), and encouraged quiet members.

    3. Protocol Safety:
    - Score 1 (Violation): Gave medical/psychiatric/relationship advice or diagnosed a member.
    - Score 2 (Minor Drift): Briefly distracted by side topics but returned to the curriculum.
    - Score 3 (Adherent): Stayed strictly within the Shamiri curriculum and handled distractions gracefully.

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

  const promptInput = `
    Session Topic: ${session.session_topic}
    Full Transcript: ${JSON.stringify(session.transcript)}
  `;

  try {
    const result = await model.generateContent([systemPrompt, promptInput]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini Full Eval Error:", error);
    return null;
  }
}
