/**
 * Platform adapters for converting between platform-specific and unified types
 * Handles the conversion of iOS Vision Framework and Android ML Kit results to unified format
 */

import { Platform } from 'react-native';

import {
  mlkitToUnifiedBoundingBox,
  mlkitToUnifiedPoints,
  unifiedToVisionBoundingBox,
  visionToUnifiedBoundingBox,
} from './coordinates';
import type { RecognizeTextAndroidResult, ExtractTextAndroidOptions } from '../types/android';
import type { RecognizeTextIOSResult, VNRecognizeTextRequestOptions } from '../types/ios';
import type {
  UnifiedTextExtractionOptions,
  UnifiedTextExtractionResult,
  UnifiedTextRegion,
  UnifiedTextCandidate,
} from '../types/unified';

/**
 * Convert iOS Vision Framework result to unified format
 */
export function iosResultToUnified(
  iosResult: RecognizeTextIOSResult,
  originalOptions?: UnifiedTextExtractionOptions,
): UnifiedTextExtractionResult {
  const startTime = Date.now();

  const regions: UnifiedTextRegion[] = iosResult.observations.map((observation, index) => {
    const unifiedBoundingBox = visionToUnifiedBoundingBox(
      observation.boundingBox,
      iosResult.imageSize,
    );

    const candidates: UnifiedTextCandidate[] = observation.candidates.map((candidate) => ({
      text: candidate.text,
      confidence: candidate.confidence,
    }));

    const primaryCandidate = candidates[0];

    return {
      text: primaryCandidate?.text || '',
      candidates,
      boundingBox: unifiedBoundingBox,
      confidence: primaryCandidate?.confidence || 0,
      platformData: {
        ios: {
          normalizedBoundingBox: observation.boundingBox,
          observationType: 'VNRecognizedTextObservation',
        },
      },
    };
  });

  const fullText = regions.map((region) => region.text).join(' ');

  return {
    regions,
    fullText,
    imageSize: iosResult.imageSize,
    platform: 'ios',
    effectiveOptions: {
      recognitionLevel: iosResult.effectiveRequest.recognitionLevel,
      recognitionLanguages: iosResult.effectiveRequest.recognitionLanguages,
      regionOfInterest: iosResult.effectiveRequest.regionOfInterest
        ? visionToUnifiedBoundingBox(
            iosResult.effectiveRequest.regionOfInterest,
            iosResult.imageSize,
          )
        : undefined,
      minimumTextHeight: iosResult.effectiveRequest.minimumTextHeight
        ? Math.round(iosResult.effectiveRequest.minimumTextHeight * iosResult.imageSize.height)
        : undefined,
      customWords: iosResult.effectiveRequest.customWords,
      maxCandidates: iosResult.effectiveRequest.maxCandidates || 5,
    },
    performance: {
      recognitionTimeMs: Date.now() - startTime,
      regionsDetected: regions.length,
    },
    platformResult: {
      ios: iosResult,
    },
  };
}

/**
 * Convert Android ML Kit result to unified format
 */
export function androidResultToUnified(
  androidResult: RecognizeTextAndroidResult,
  originalOptions?: UnifiedTextExtractionOptions,
): UnifiedTextExtractionResult {
  const startTime = Date.now();

  const regions: UnifiedTextRegion[] = [];

  // Extract regions from ML Kit's hierarchical structure
  // We'll create unified regions from text elements (words) for consistency with iOS
  androidResult.blocks.forEach((block, blockIndex) => {
    block.lines.forEach((line, lineIndex) => {
      line.elements.forEach((element, elementIndex) => {
        if (!element.boundingBox) return;

        const unifiedBoundingBox = mlkitToUnifiedBoundingBox(
          element.boundingBox,
          androidResult.imageSize,
        );
        const cornerPoints = element.cornerPoints
          ? mlkitToUnifiedPoints(element.cornerPoints, androidResult.imageSize)
          : undefined;

        // ML Kit doesn't provide multiple candidates per element, so we create a single candidate
        const candidates: UnifiedTextCandidate[] = [
          {
            text: element.text,
            confidence: element.confidence || 1.0,
          },
        ];

        regions.push({
          text: element.text,
          candidates,
          boundingBox: unifiedBoundingBox,
          cornerPoints,
          confidence: element.confidence || 1.0,
          recognizedLanguage: element.recognizedLanguage,
          rotationDegree: element.rotationDegree,
          platformData: {
            android: {
              hierarchyLevel: 'element',
              parentId: `block-${blockIndex}-line-${lineIndex}`,
              childIds: element.symbols?.map((_, symIndex) => `symbol-${symIndex}`) || [],
            },
          },
        });
      });
    });
  });

  return {
    regions,
    fullText: androidResult.fullText,
    imageSize: androidResult.imageSize,
    platform: 'android',
    effectiveOptions: {
      recognitionLevel: 'accurate', // ML Kit doesn't have fast/accurate modes in the same way
      recognitionLanguages: [], // ML Kit auto-detects languages
      maxCandidates: 1, // ML Kit provides one result per element
    },
    performance: {
      recognitionTimeMs: Date.now() - startTime,
      regionsDetected: regions.length,
    },
    platformResult: {
      android: androidResult,
    },
  };
}

/**
 * Convert unified options to iOS Vision Framework options
 */
export function unifiedToIosOptions(
  unifiedOptions: UnifiedTextExtractionOptions,
  imageSize: { width: number; height: number },
): VNRecognizeTextRequestOptions {
  const iosOptions: VNRecognizeTextRequestOptions = {};

  if (unifiedOptions.recognitionLevel) {
    iosOptions.recognitionLevel = unifiedOptions.recognitionLevel;
  }

  if (unifiedOptions.recognitionLanguages) {
    iosOptions.recognitionLanguages = unifiedOptions.recognitionLanguages;
  }

  if (unifiedOptions.regionOfInterest) {
    iosOptions.regionOfInterest = unifiedToVisionBoundingBox(
      unifiedOptions.regionOfInterest,
      imageSize,
    );
  }

  if (unifiedOptions.minimumTextHeight) {
    // Convert pixel height to normalized height
    iosOptions.minimumTextHeight = unifiedOptions.minimumTextHeight / imageSize.height;
  }

  if (unifiedOptions.customWords) {
    iosOptions.customWords = unifiedOptions.customWords;
  }

  if (unifiedOptions.maxCandidates) {
    iosOptions.maxCandidates = unifiedOptions.maxCandidates;
  }

  // Enable language correction by default for better results
  iosOptions.usesLanguageCorrection = true;

  return iosOptions;
}

/**
 * Convert unified options to Android ML Kit options
 */
export function getAndroidOptions(): ExtractTextAndroidOptions {
  const androidOptions: ExtractTextAndroidOptions = {};

  // ML Kit currently only supports Latin script in this module
  androidOptions.model = 'latin';

  // Note: Many unified options don't have direct ML Kit equivalents
  // ML Kit auto-detects languages and doesn't support custom vocabularies
  // Region of interest and recognition level would need to be implemented
  // at the application level with image preprocessing

  return androidOptions;
}

/**
 * Get platform-appropriate default options
 */
export function getDefaultUnifiedOptions(): UnifiedTextExtractionOptions {
  return {
    recognitionLevel: 'accurate',
    recognitionLanguages: Platform.OS === 'ios' ? ['en-US'] : [],
    maxCandidates: Platform.OS === 'ios' ? 5 : 1,
  };
}
