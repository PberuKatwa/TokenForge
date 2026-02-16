import { z } from "zod";

export const MetricCategorySchema = z.object({
  score: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  justification: z.string().min(1),
});

export const MetricsSchema = z.object({
  content_coverage: MetricCategorySchema,
  facilitation_quality: MetricCategorySchema,
  protocol_safety: MetricCategorySchema,
});

export const RiskAssessmentSchema = z.object({
  flag: z.union([z.literal("SAFE"), z.literal("UNSAFE")]),
  quote: z.string().nullable(),
});

export const LLMEvaluationSchema = z.object({
  session_summary: z.string().min(1),
  metrics: MetricsSchema,
  risk_assessment: RiskAssessmentSchema,
});

export const LLMEvaluationResponseSchema = z.array(LLMEvaluationSchema);
