import { z } from 'zod';
import { RawTurn } from "../types/pruner.types.js";

export const RawTurnSchema: z.ZodType<RawTurn> = z.object({
  speaker: z.string(),
  text: z.string(),
});


export const SessionSchema = z.object({
  session_topic: z.string(),
  duration_minutes: z.number().positive(),
  transcript: z.array(RawTurnSchema)
});

export type SessionFromSchema = z.infer<typeof SessionSchema>;
