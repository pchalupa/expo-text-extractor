/**
 * Type definitions for expo-text-extractor
 * Organized by platform for better maintainability and IntelliSense
 */

// Re-export all iOS types
export type {
  VNRecognizeTextRequestOptions,
  RecognizedTextCandidate,
  VNRecognizedTextObservation,
  RecognizeTextIOSResult,
} from './ios';

// Re-export all Android types
export type {
  MLKPoint,
  RectBox,
  MLKSymbol,
  MLKTextElement,
  MLKTextLine,
  MLKTextBlock,
  ExtractTextAndroidOptions,
  RecognizeTextAndroidResult,
} from './android';

// Re-export unified cross-platform types
export type {
  UnifiedPoint,
  UnifiedBoundingBox,
  UnifiedRecognitionLevel,
  UnifiedTextExtractionOptions,
  UnifiedTextCandidate,
  UnifiedTextRegion,
  UnifiedTextExtractionResult,
} from './unified';

// Re-export common types
export type { ExpoTextExtractorModule } from './common';
