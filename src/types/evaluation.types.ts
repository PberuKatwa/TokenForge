import { PrunedSession } from "./pruner.types.js";

export interface LLMEvaluation {
  session_summary: string;
  metrics: Metrics;
  risk_assessment: RiskAssessment;
}

export interface Metrics {
  content_coverage: MetricCategory;
  facilitation_quality: MetricCategory;
  protocol_safety: MetricCategory;
}

export interface MetricCategory {
  score: 1 | 2 | 3;
  justification: string;
}

export interface RiskAssessment {
  flag: "SAFE" | "RISK";
  quote: string | null;
}

export interface LLMEvaluationResult {
  llmEvaluation: LLMEvaluation;
  prunedTranscript: PrunedSession;
}
