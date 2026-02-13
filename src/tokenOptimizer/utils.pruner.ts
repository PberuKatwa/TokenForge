import { CONFIG } from "./config.pruner.js";

export const countWords = (str: string): number => str.trim().split(/\s+/).length;

export const stripFiller = (text: string): string => {
  return text
    .replace(CONFIG.FILLER_WORDS, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractEssence = (text: string, score: number): string => {
  let essence = stripFiller(text);

  // For safety turns, keep the critical sentence
  if (score >= 100) {
    const match = essence.match(/[^.!?]*(?:medication|pill|doctor|diagnose|depressed|suicide|self-harm|therapy|legal)[^.!?]*[.!?]/i);
    if (match) essence = match[0];
  }

  // For pedagogy turns, extract the concept mention
  else if (score >= 50) {
    const match = essence.match(/[^.!?]*(?:growth mindset|fixed mindset|neuroplasticity|effort|challenge|muscle|neural)[^.!?]*[.!?]/i);
    if (match) essence = match[0];
  }

  // Truncate aggressively
  if (essence.length > CONFIG.MAX_CHARS_PER_TURN) {
    essence = essence.slice(0, CONFIG.MAX_CHARS_PER_TURN) + "...";
  }

  return essence;
};
