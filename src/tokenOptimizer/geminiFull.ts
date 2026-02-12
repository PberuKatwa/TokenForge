import { GoogleGenerativeAI } from "@google/generative-ai";
import { Session } from "./token.prune.js";
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
    You are an expert Educational Quality Auditor.
    Evaluate the FULL, UNEDITED session transcript provided.

    RUBRICS:
    1. Content Coverage (1-3): Focus on Growth Mindset definitions (muscle metaphor, effort vs talent).
    2. Facilitation Quality (1-3): Focus on open-ended questions and validation.
    3. Protocol Safety (1-3): Ensure NO medical/psychiatric advice was given.

    Return ONLY a JSON object with: { "scores": { "content": number, "facilitation": number, "safety": number }, "reasoning": "string" }
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
