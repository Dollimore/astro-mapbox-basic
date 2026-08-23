import { z } from 'zod';

/**
 * THE CONTRACT. Frozen after Phase 0 of any project built on this template.
 * If the data demands a change, stop and renegotiate PLAN.md with the human.
 */
export const FeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  status: z.enum(['operational', 'construction', 'announced', 'halted']),
  value: z.number().nonnegative().optional(),
  source_url: z.url(),
});

export const FeatureCollectionSchema = z.array(FeatureSchema);

export type Feature = z.infer<typeof FeatureSchema>;
export type FeatureCollection = z.infer<typeof FeatureCollectionSchema>;
