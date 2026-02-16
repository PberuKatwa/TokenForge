import { Lexicons } from "../types/pruner.types.js";

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

export const safetyWords: string[] = [

  // Medical / Clinical
  "medic",
  "medication",
  "pill",
  "tablet",
  "capsule",
  "dose",
  "dosage",
  "prescrib",
  "prescription",
  "doctor",
  "physician",
  "psychiatr",
  "psycholog",
  "therap",
  "counsel",
  "clinic",
  "hospital",
  "emergency",
  "urgent",
  "diagnos",
  "treat",
  "treatment",
  "symptom",
  "condition",
  "mental health",
  "evaluation",
  "assessment",
  "intervention",

  // Mental Health Conditions (root forms for regex flexibility)
  "depress",
  "anxiet",
  "panic",
  "trauma",
  "ptsd",
  "stress disorder",
  "bipolar",
  "mood disorder",
  "personality disorder",
  "eating disorder",
  "addict",
  "substance",
  "alcohol",
  "drug use",
  "withdrawal",

  // Crisis / Harm Signals (non-graphic)
  "suicid",
  "self harm",
  "self-harm",
  "harm myself",
  "hurt myself",
  "unsafe",
  "not safe",
  "in danger",
  "risk",
  "at risk",
  "crisis",
  "breakdown",
  "overwhelmed",
  "hopeless",
  "helpless",
  "worthless",

  // Escalation / Safeguarding
  "report",
  "mandated reporter",
  "escalate",
  "refer",
  "referral",
  "support line",
  "hotline",
  "authorit",
  "legal",
  "lawyer",
  "police",
  "child protection",
  "guardian",
  "parent contact",
  "confidential",
  "confidentiality",
  "duty of care",
  "liability",
  "consent",
  "mandatory",

  // Relationship / Major Stress Events
  "break up",
  "divorce",
  "separation",
  "abuse",
  "neglect",
  "violence",
  "bully",
  "harass",
  "assault"
];


export const pedagogyWords: string[] = [

  // Growth Mindset
  "growth mindset",
  "fixed mindset",
  "mindset",
  "yet",
  "not yet",
  "effort",
  "practice",
  "improve",
  "progress",
  "learn",
  "learning",
  "mistake",
  "failure",
  "feedback",
  "revision",
  "try again",

  // Brain Science
  "neuroplasticity",
  "plasticity",
  "neural",
  "neuron",
  "brain pathway",
  "synapse",
  "cognitive",
  "memory",
  "attention",
  "focus",
  "executive function",

  // Strategy & Skill
  "strategy",
  "approach",
  "technique",
  "method",
  "process",
  "skill",
  "competenc",
  "mastery",
  "deliberate practice",
  "goal",
  "objective",
  "plan",
  "action step",
  "reflect and adjust",

  // Challenge Framing
  "challenge",
  "stretch",
  "push yourself",
  "outside comfort zone",
  "resilien",
  "persist",
  "persistence",
  "grit",
  "discipline",

  // Teaching Moves
  "example",
  "model",
  "demonstrate",
  "explain",
  "clarify",
  "define",
  "summarize",
  "recap",
  "build on",
  "connect to",
  "apply"
];


export const reflectionWords: string[] = [

  "reflect",
  "reflection",
  "pause",
  "take a moment",
  "think quietly",
  "consider",
  "imagine",
  "picture this",
  "what if",
  "how would you",
  "why do you think",
  "what do you notice",
  "what stands out",
  "look inward",
  "self reflect",
  "process that",
  "step back",
  "revisit that",
  "let's unpack",
  "explore that",
  "examine that",
  "analyze",
  "evaluate",
  "notice your reaction",
  "check in with yourself"
];


export const empathyWords: string[] = [

  "i hear you",
  "i understand",
  "i see what you mean",
  "that makes sense",
  "that sounds hard",
  "that sounds difficult",
  "thank you for sharing",
  "i appreciate you sharing",
  "i'm glad you said that",
  "i can imagine",
  "that must feel",
  "it sounds like",
  "i get that",
  "i can see why",
  "you're not alone",
  "that’s valid",
  "your feelings are valid",
  "it's okay to feel",
  "that’s understandable",
  "i'm here with you",
  "thanks for being honest",
  "i respect that",
  "great point",
  "good observation"
];


export const understandingWords: string[] = [

  "does that make sense",
  "is that clear",
  "any questions",
  "what do you think",
  "how do you feel",
  "do you agree",
  "would you agree",
  "can you explain",
  "can you share",
  "what's your take",
  "does anyone want to add",
  "has anyone heard",
  "who can summarize",
  "can someone repeat",
  "what did you notice",
  "does that resonate",
  "does that connect",
  "are we aligned",
  "check for understanding",
  "what are your thoughts"
];


export const fillerWords: string[] = [

  "um",
  "uh",
  "erm",
  "hmm",
  "like",
  "you know",
  "i mean",
  "actually",
  "basically",
  "literally",
  "sort of",
  "kind of",
  "kinda",
  "well",
  "so",
  "just",
  "really",
  "very",
  "right",
  "okay",
  "ok",
  "yeah",
  "yep",
  "alright",
  "anyway",
  "honestly",
  "to be honest",
  "at the end of the day",
  "in a way",
  "more or less"
];


export const allLexicons:Lexicons = {
  safetyWords,
  pedagogyWords,
  reflectionWords,
  empathyWords,
  understandingWords,
  fillerWords
}
