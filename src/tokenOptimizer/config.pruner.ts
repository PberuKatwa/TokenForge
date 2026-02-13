export const CONFIG = {
  SAFETY_LEXICON: /\b(medication|pill|doctor|diagnose|depressed|suicide|self-harm|break up|therapy|legal|clinic|prescription)\b/gi,
  PEDAGOGY_LEXICON: /\b(growth mindset|fixed mindset|neuroplasticity|effort|yet|challenge|muscle|neural|persistence|strategy)\b/gi,
  REFLECTION_PROMPTS: /\b(think quietly|reflect|imagine|what if|how would you|take a moment)\b/i,
  EMPATHY_MARKERS: /^(i hear you|that makes sense|thank you for sharing|great point)/i,
  CHECK_FOR_UNDERSTANDING: /\b(does that make sense|how do you feel|do you agree|has anyone heard)\b/i,
  FILLER_WORDS: /\b(um|uh|like|you know|i mean|actually|basically|literally|sort of|kind of|well|so|just|really|very|right|okay|yeah)\b/gi,

  // EXTREME settings
  WINDOW_PADDING: 0,  // NO context padding
  MAX_CHARS_PER_TURN: 100,  // Hyper-aggressive truncation
  MIN_SIGNAL_SCORE: 20,  // Only keep high-signal turns
  KEEP_ONLY_SIGNAL_TURNS: true  // Skip all non-signal turns
};

export const safetyWords:string[] = [
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
