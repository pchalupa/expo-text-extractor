/**
 * Unified cross-platform types for expo-text-extractor
 * These types provide a consistent API across iOS and Android platforms
 */

/**
 * A point in 2D space with both pixel and percentage coordinates.
 * Always uses top-left origin (0,0 at top-left corner) for consistency.
 */
export interface UnifiedPoint {
  /** X coordinate in pixels from left edge */
  x: number;
  /** Y coordinate in pixels from top edge */
  y: number;
  /** X coordinate as percentage [0..1] from left edge */
  xPercent: number;
  /** Y coordinate as percentage [0..1] from top edge */
  yPercent: number;
}

/**
 * A rectangular bounding box with both pixel and percentage coordinates.
 * Always uses top-left origin for consistency across platforms.
 */
export interface UnifiedBoundingBox {
  /** X coordinate of the top-left corner in pixels */
  x: number;
  /** Y coordinate of the top-left corner in pixels */
  y: number;
  /** Width of the rectangle in pixels */
  width: number;
  /** Height of the rectangle in pixels */
  height: number;
  /** X coordinate as percentage [0..1] from left edge */
  xPercent: number;
  /** Y coordinate as percentage [0..1] from top edge */
  yPercent: number;
  /** Width as percentage [0..1] of image width */
  widthPercent: number;
  /** Height as percentage [0..1] of image height */
  heightPercent: number;
}

/**
 * Recognition confidence level options for cross-platform use.
 */
export type UnifiedRecognitionLevel = 'fast' | 'accurate';

/**
 * Unified options for cross-platform text extraction.
 * These options work across both iOS and Android with appropriate platform mapping.
 */
export interface UnifiedTextExtractionOptions {
  /**
   * Recognition level preference.
   * - 'fast': Prioritizes speed over accuracy
   * - 'accurate': Prioritizes accuracy over speed
   *
   * @default 'accurate'
   */
  recognitionLevel?: UnifiedRecognitionLevel;

  /**
   * Preferred languages for recognition (BCP-47 codes, e.g., 'en-US', 'es-ES').
   * Cross-platform support varies by underlying framework.
   *
   * @example ['en-US', 'es-ES', 'fr-FR']
   */
  recognitionLanguages?: string[];

  /**
   * Region of interest for text detection.
   * Coordinates are in pixels relative to the original image size.
   * If omitted, the entire image is processed.
   *
   * Platform support:
   * - iOS: Full support via VNRecognizeTextRequest.regionOfInterest
   * - Android: Not supported by ML Kit, would require image preprocessing
   */
  regionOfInterest?: UnifiedBoundingBox;

  /**
   * Minimum text height in pixels to consider during recognition.
   * Helps filter out noise from very small text.
   *
   * Platform support:
   * - iOS: Full support via VNRecognizeTextRequest.minimumTextHeight
   * - Android: Not directly supported by ML Kit
   */
  minimumTextHeight?: number;

  /**
   * Additional vocabulary words to prioritize during recognition.
   *
   * Platform support:
   * - iOS: Supported on iOS 16+ via VNRecognizeTextRequest.customWords
   * - Android: Not supported by ML Kit
   *
   * @example ['MyCompany', 'SpecialTerm', 'ProductName']
   */
  customWords?: string[];

  /**
   * Maximum number of text candidates to return per detected region.
   *
   * Platform support:
   * - iOS: Fully supported, controls VNRecognizeTextRequest candidate count
   * - Android: Not supported, ML Kit returns single result per text element
   *
   * @default 5
   */
  maxCandidates?: number;
}

/**
 * A single text recognition candidate with confidence score.
 */
export interface UnifiedTextCandidate {
  /** The recognized text string */
  text: string;
  /** Recognition confidence score between 0 and 1 */
  confidence: number;
}

/**
 * A detected text region with recognition candidates and location information.
 * This represents a unified view of text detection across platforms.
 */
export interface UnifiedTextRegion {
  /** Primary recognized text (highest confidence candidate) */
  text: string;

  /** All recognition candidates for this region, sorted by confidence (highest first) */
  candidates: UnifiedTextCandidate[];

  /** Bounding box of the text region in pixel coordinates */
  boundingBox: UnifiedBoundingBox;

  /** Corner points of the text region (useful for rotated text) */
  cornerPoints?: UnifiedPoint[];

  /** Overall confidence score for this region (0 to 1) */
  confidence: number;

  /** Detected language of the text (ISO 639-1 code, e.g., 'en', 'es') */
  recognizedLanguage?: string;

  /** Rotation angle of the text in degrees (0 = horizontal) */
  rotationDegree?: number;

  /**
   * Platform-specific metadata that doesn't fit the unified model.
   * This allows access to platform-specific features while maintaining compatibility.
   */
  platformData?: {
    /** iOS-specific data from Vision Framework */
    ios?: {
      /** Normalized bounding box in Vision coordinate space [0..1] */
      normalizedBoundingBox: { x: number; y: number; width: number; height: number };
      /** Vision observation type or additional metadata */
      observationType?: string;
    };
    /** Android-specific data from ML Kit */
    android?: {
      /** ML Kit hierarchy level (block, line, element, symbol) */
      hierarchyLevel: 'block' | 'line' | 'element' | 'symbol';
      /** Parent element reference for hierarchical navigation */
      parentId?: string;
      /** Child elements for hierarchical navigation */
      childIds?: string[];
    };
  };
}

/**
 * Unified result from cross-platform text extraction.
 * Provides a consistent interface regardless of the underlying platform.
 * All coordinates use top-left origin with both pixel and percentage values.
 */
export interface UnifiedTextExtractionResult {
  /** All detected text regions in the image */
  regions: UnifiedTextRegion[];

  /** Concatenated text from all regions */
  fullText: string;

  /** Original image dimensions in pixels */
  imageSize: {
    width: number;
    height: number;
  };

  /** Platform that performed the text recognition */
  platform: 'ios' | 'android';

  /** Echo of the effective configuration used for recognition */
  effectiveOptions: {
    recognitionLevel: UnifiedRecognitionLevel;
    recognitionLanguages: string[];
    regionOfInterest?: UnifiedBoundingBox;
    minimumTextHeight?: number;
    customWords?: string[];
    maxCandidates: number;
  };

  /** Processing performance metrics */
  performance?: {
    /** Time taken for text recognition in milliseconds */
    recognitionTimeMs?: number;
    /** Number of text regions detected */
    regionsDetected: number;
  };

  /**
   * Raw platform-specific result for advanced use cases.
   * This allows access to platform-specific features not covered by the unified API.
   */
  platformResult?: {
    /** Raw iOS Vision Framework result */
    ios?: import('./ios').RecognizeTextIOSResult;
    /** Raw Android ML Kit result */
    android?: import('./android').RecognizeTextAndroidResult;
  };
}
