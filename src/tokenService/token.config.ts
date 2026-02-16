import { Lexicons } from "../types/pruner.types.js";

export const safetyWords: string[] = [
  "medication",
  "pill",
  "doctor",
  "diagnose",
  "depress",      // use root form instead of depressed
  "suicide",
  "self-harm",
  "break up",
  "therapy",
  "legal",
  "clinic",
  "prescription"
];

export const pedagogyWords: string[] = [
  "growth mindset",
  "fixed mindset",
  "neuroplasticity",
  "effort",
  "yet",
  "challenge",
  "muscle",
  "neural",
  "persistence",
  "strategy"
];

export const reflectionWords: string[] = [
  "think quietly",
  "reflect",
  "imagine",
  "what if",
  "how would you",
  "take a moment"
];

export const empathyWords: string[] = [
  "i hear you",
  "that makes sense",
  "thank you for sharing",
  "great point"
];

export const understandingWords: string[] = [
  "does that make sense",
  "how do you feel",
  "do you agree",
  "has anyone heard"
];

export const fillerWords: string[] = [
  "um",
  "uh",
  "like",
  "you know",
  "i mean",
  "actually",
  "basically",
  "literally",
  "sort of",
  "kind of",
  "well",
  "so",
  "just",
  "really",
  "very",
  "right",
  "okay",
  "yeah"
];

export const allLexicons:Lexicons = {
  safetyWords,
  pedagogyWords,
  reflectionWords,
  empathyWords,
  understandingWords,
  fillerWords
}
