/**
 * Unified cross-platform text extraction API
 * Provides a consistent interface across iOS and Android platforms
 */

import { Platform } from 'react-native';

import ExpoTextExtractorModule from '../ExpoTextExtractorModule';
import type { UnifiedTextExtractionOptions, UnifiedTextExtractionResult } from '../types/unified';
import {
  androidResultToUnified,
  getAndroidOptions,
  getDefaultUnifiedOptions,
  iosResultToUnified,
  unifiedToIosOptions,
} from '../utils/adapters';

/**
 * Cross-platform text extraction with unified result format.
 * This function provides a consistent API across iOS and Android platforms,
 * automatically handling coordinate system differences and result format normalization.
 *
 * @param uri - The URI of the image to extract text from
 * @param options - Unified options that work across platforms
 * @returns Promise that resolves to a unified result format
 *
 * @example
 * ```typescript
 * const result = await extractTextFromImageAdvanced('file://path/to/image.jpg', {
 *   recognitionLevel: 'accurate',
 *   recognitionLanguages: ['en-US', 'es-ES'],
 *   maxCandidates: 3,
 * });
 *
 * // Access unified results
 * console.log('Full text:', result.fullText);
 * console.log('Platform:', result.platform);
 * console.log('Regions found:', result.regions.length);
 *
 * // Access platform-specific results if needed
 * if (result.platform === 'ios') {
 *   console.log('iOS Vision result:', result.platformResult?.ios);
 * }
 * ```
 */
export async function extractTextFromImageAdvanced(
  uri: string,
  options?: UnifiedTextExtractionOptions,
): Promise<UnifiedTextExtractionResult> {
  const processedUri = uri.replace('file://', '');
  const effectiveOptions = { ...getDefaultUnifiedOptions(), ...options };

  if (Platform.OS === 'ios') {
    if (!ExpoTextExtractorModule.extractTextFromImageIOS) {
      throw new Error('iOS text extraction is not available on this platform');
    }

    // We need to get image dimensions first for coordinate conversion
    // For now, we'll make the call and get dimensions from the result
    const iosOptions = unifiedToIosOptions(effectiveOptions, { width: 1, height: 1 });
    const iosResult = await ExpoTextExtractorModule.extractTextFromImageIOS(
      processedUri,
      iosOptions,
    );

    // Now convert with actual image dimensions
    const finalIosOptions = unifiedToIosOptions(effectiveOptions, iosResult.imageSize);

    // If options changed due to image dimensions, make another call
    // Otherwise use the existing result
    const finalResult = await ExpoTextExtractorModule.extractTextFromImageIOS(
      processedUri,
      finalIosOptions,
    );

    return iosResultToUnified(finalResult, effectiveOptions);
  }

  if (Platform.OS === 'android') {
    if (!ExpoTextExtractorModule.extractTextFromImageAndroid) {
      throw new Error('Android text extraction is not available on this platform');
    }

    const androidOptions = getAndroidOptions();
    const androidResult = await ExpoTextExtractorModule.extractTextFromImageAndroid(
      processedUri,
      androidOptions,
    );

    return androidResultToUnified(androidResult, effectiveOptions);
  }

  // Unsupported platform
  throw new Error(`Text extraction is not supported on platform: ${Platform.OS}`);
}

/**
 * Simplified cross-platform text extraction that returns only text strings.
 * This is a convenience wrapper around extractTextFromImageAdvanced for cases
 * where you only need the recognized text without additional metadata.
 *
 * @param uri - The URI of the image to extract text from
 * @param options - Optional unified options
 * @returns Promise that resolves to an array of recognized text strings
 *
 * @example
 * ```typescript
 * const texts = await extractTextFromImageUnified('file://path/to/image.jpg');
 * console.log('Recognized texts:', texts);
 * ```
 */
export async function extractTextFromImageUnified(
  uri: string,
  options?: Pick<UnifiedTextExtractionOptions, 'recognitionLevel' | 'recognitionLanguages'>,
): Promise<string[]> {
  const result = await extractTextFromImageAdvanced(uri, options);
  return result.regions.map((region) => region.text);
}

/**
 * Get platform-specific capabilities and limitations based on ground truth from native implementations.
 * This helps developers understand what features actually work on each platform.
 *
 * @returns Object describing platform capabilities
 */
export function getPlatformCapabilities() {
  const common = {
    platform: Platform.OS,
    isSupported: ExpoTextExtractorModule.isSupported,
    basicExtraction: ExpoTextExtractorModule.isSupported,
  };

  if (Platform.OS === 'ios') {
    return {
      ...common,
      features: {
        // Ground truth from iOS Vision Framework implementation
        recognitionLevels: ['fast', 'accurate'] as const,
        languageSupport: true, // VNRecognizeTextRequest.recognitionLanguages
        customVocabulary: true, // VNRecognizeTextRequest.customWords (iOS 16+)
        regionOfInterest: true, // VNRecognizeTextRequest.regionOfInterest
        minimumTextHeight: true, // VNRecognizeTextRequest.minimumTextHeight
        multipleCandidates: true, // observation.topCandidates(maxCandidates)
        languageCorrection: true, // VNRecognizeTextRequest.usesLanguageCorrection
        automaticLanguageDetection: true, // VNRecognizeTextRequest.automaticallyDetectsLanguage (iOS 16+)
        coordinateSystem: 'normalized-bottom-left (converted to pixel+percentage-top-left)',
        maxCandidatesSupport: true,
        confidenceScores: true,
      },
      limitations: {
        customVocabularyRequiresIOS16: true,
        automaticLanguageDetectionRequiresIOS16: true,
        noCornerPoints: true, // Vision doesn't provide corner points for text observations
        noHierarchicalStructure: true, // Vision provides flat observations, not blocks/lines/elements
      },
    };
  }

  if (Platform.OS === 'android') {
    return {
      ...common,
      features: {
        // Ground truth from Android ML Kit implementation
        recognitionLevels: ['accurate'] as const, // ML Kit doesn't have fast/accurate modes
        languageSupport: false, // ML Kit auto-detects, can't specify languages
        customVocabulary: false, // Not supported by ML Kit
        regionOfInterest: false, // Not supported by ML Kit directly
        minimumTextHeight: false, // Not supported by ML Kit directly
        multipleCandidates: false, // ML Kit returns single result per element
        languageCorrection: false, // Not configurable in ML Kit
        automaticLanguageDetection: true, // Always on in ML Kit
        coordinateSystem: 'pixel-top-left (with percentage conversion)',
        maxCandidatesSupport: false,
        confidenceScores: true,
        hierarchicalTextStructure: true, // ML Kit provides blocks → lines → elements → symbols
        rotationDetection: true, // ML Kit detects text rotation
        symbolLevelDetection: true, // ML Kit provides individual character/symbol info
        cornerPoints: true, // ML Kit provides corner points for rotated text
      },
      limitations: {
        onlyLatinScript: true, // This module only bundles Latin script model
        noCustomVocabulary: true,
        noRegionOfInterest: true, // Would need image preprocessing
        singleCandidatePerElement: true,
        noRecognitionLevelControl: true,
        noLanguageControl: true, // Always auto-detected
      },
    };
  }

  return {
    ...common,
    features: {},
    limitations: {
      platformNotSupported: true,
    },
  };
}
