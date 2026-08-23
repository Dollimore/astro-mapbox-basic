import { FeatureCollectionSchema, type Feature } from '../data/schema.js';
import sample from '../data/sample.json';

/**
 * Parse at the boundary. Every component downstream can then trust every
 * record — that is what makes the frozen schema a real seam rather than a
 * suggestion.
 */
export function loadFeatures(): Feature[] {
  const result = FeatureCollectionSchema.safeParse(sample);
  if (!result.success) {
    throw new Error(`src/data/sample.json failed validation: ${result.error.message}`);
  }
  return result.data;
}
