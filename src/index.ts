import { Platform } from 'react-native';

import ExpoTextExtractorModule from './ExpoTextExtractorModule';
import { extractTextFromImageAdvanced, getPlatformCapabilities } from './api/unified';
import type {
  RecognizeTextIOSResult,
  VNRecognizeTextRequestOptions,
  RecognizeTextAndroidResult,
  ExtractTextAndroidOptions,
} from './types';
import { projectToOverlay } from './utils/projection';

/**
 * A boolean value that indicates whether the text extraction module is supported on the current device.
 *
 * @example
 * if (isSupported) {
 *   console.log('Text extraction is supported on this device.');
 * } else {
 *   console.log('Text extraction is not supported on this device.');
 * }
 */
export const isSupported = ExpoTextExtractorModule.isSupported;

/**
 * Extracts text from an image.
 *
 * @param {string} uri - The URI of the image to extract text from.
 * @returns {Promise<string[]>} A promise that fulfills with an array of recognized texts.
 */
export async function extractTextFromImage(uri: string): Promise<string[]> {
  const processedUri = uri.replace('file://', '');

  return ExpoTextExtractorModule.extractTextFromImage(processedUri);
}

/**
 * iOS-only: Extracts text from an image and returns Vision-like observations.
 * On non-iOS platforms, this will throw an error.
 */
export async function extractTextFromImageIOS(
  uri: string,
  options?: VNRecognizeTextRequestOptions,
): Promise<RecognizeTextIOSResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('extractTextFromImageIOS is only available on iOS');
  }

  const processedUri = uri.replace('file://', '');
  if (!ExpoTextExtractorModule.extractTextFromImageIOS) {
    throw new Error('Native function extractTextFromImageIOS is not available');
  }
  return ExpoTextExtractorModule.extractTextFromImageIOS(processedUri, options);
}

/**
 * Android-only: Extracts text from an image and returns ML Kit-like structure.
 * On non-Android platforms, this will throw an error.
 */
export async function extractTextFromImageAndroid(
  uri: string,
  options?: ExtractTextAndroidOptions,
): Promise<RecognizeTextAndroidResult> {
  if (Platform.OS !== 'android') {
    throw new Error('extractTextFromImageAndroid is only available on Android');
  }

  const processedUri = uri.replace('file://', '');
  if (!ExpoTextExtractorModule.extractTextFromImageAndroid) {
    throw new Error('Native function extractTextFromImageAndroid is not available');
  }
  return ExpoTextExtractorModule.extractTextFromImageAndroid(processedUri, options);
}

// ============================================================================
// UNIFIED CROSS-PLATFORM API (LEVEL 2)
// ============================================================================

/**
 * Cross-platform text extraction with unified result format.
 *
 * This provides a consistent API across iOS and Android platforms with:
 * - Unified coordinate system (both pixel and percentage coordinates, top-left origin)
 * - Consistent result structure regardless of platform
 * - Access to platform-specific features through options
 * - Raw platform results available in the response
 *
 * @param uri - The URI of the image to extract text from
 * @param options - Unified options that work across platforms
 * @returns Promise that resolves to a unified result format with platform metadata
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await extractTextFromImageAdvanced('file://image.jpg');
 * console.log('Text:', result.fullText);
 * console.log('Platform:', result.platform);
 *
 * // With options (ground truth: iOS supports all, Android has limitations)
 * const result = await extractTextFromImageAdvanced('file://image.jpg', {
 *   recognitionLevel: 'accurate',
 *   recognitionLanguages: ['en-US', 'es-ES'], // iOS: ✅ Android: ❌ (auto-detected)
 *   customWords: ['MyBrand'], // iOS: ✅ (iOS 16+) Android: ❌
 *   maxCandidates: 3, // iOS: ✅ Android: ❌ (always 1)
 * });
 *
 * // Access detailed results with both pixel and percentage coordinates
 * result.regions.forEach(region => {
 *   console.log(`Text: "${region.text}"`);
 *   console.log(`Pixels: ${region.boundingBox.x},${region.boundingBox.y}`);
 *   console.log(`Percent: ${region.boundingBox.xPercent},${region.boundingBox.yPercent}`);
 * });
 * ```
 */
export { extractTextFromImageAdvanced };

/**
 * Get detailed information about platform capabilities and limitations.
 *
 * This helps developers understand what features are available on each platform
 * and make informed decisions about which API to use.
 *
 * @returns Object describing platform capabilities and limitations
 *
 * @example
 * ```typescript
 * const capabilities = getPlatformCapabilities();
 * console.log('Platform:', capabilities.platform);
 * console.log('Features:', capabilities.features);
 * console.log('Limitations:', capabilities.limitations);
 *
 * if (capabilities.features.customVocabulary) {
 *   // Use custom vocabulary on iOS
 *   options.customWords = ['MyBrand', 'SpecialTerm'];
 * }
 * ```
 */
export { getPlatformCapabilities };

// ============================================================================
// COORDINATE TRANSFORMATION HELPERS
// ============================================================================

/**
 * Project unified coordinates onto an overlay view of different dimensions.
 * Essential for displaying text regions over images in UI components.
 *
 * @param coords - Unified coordinates from text recognition
 * @param originalImageSize - Original image dimensions
 * @param overlaySize - Target overlay view dimensions
 * @returns Projected coordinates for the overlay
 *
 * @example
 * ```typescript
 * const result = await extractTextFromImageAdvanced(imageUri);
 * const overlaySize = { width: 300, height: 200 }; // Your Image component size
 *
 * result.regions.forEach(region => {
 *   const overlayCoords = projectToOverlay(
 *     region.boundingBox,
 *     result.imageSize,
 *     overlaySize
 *   );
 *   // Position your text overlay components using overlayCoords
 * });
 * ```
 */
export { projectToOverlay };

export type {
  // iOS types
  RecognizeTextIOSResult,
  VNRecognizeTextRequestOptions,
  RecognizedTextCandidate,
  VNRecognizedTextObservation,
  // Android types
  RecognizeTextAndroidResult,
  ExtractTextAndroidOptions,
  MLKPoint,
  RectBox,
  MLKSymbol,
  MLKTextElement,
  MLKTextLine,
  MLKTextBlock,
  // Unified cross-platform types
  UnifiedTextExtractionOptions,
  UnifiedTextExtractionResult,
  UnifiedTextRegion,
  UnifiedTextCandidate,
  UnifiedBoundingBox,
  UnifiedPoint,
  UnifiedRecognitionLevel,
  // Common types
  ExpoTextExtractorModule,
} from './types';
