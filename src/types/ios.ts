/**
 * iOS-specific types for Vision Framework text recognition
 * These types mirror Apple's VNRecognizeTextRequest and related Vision APIs
 */

/**
 * iOS-only: Options that mirror Apple's VNRecognizeTextRequest as closely as possible.
 * All fields are optional; only provided ones will be applied. Availability-gated
 * properties are ignored on older iOS versions but echoed in `effectiveRequest` when used.
 *
 * @platform ios
 * @see https://developer.apple.com/documentation/vision/vnrecognizetextrequest
 */
export interface VNRecognizeTextRequestOptions {
  /**
   * Vision recognition level. `fast` is lower-latency, `accurate` is higher-quality.
   * Defaults to Vision's default (typically `accurate`).
   *
   * @see https://developer.apple.com/documentation/vision/vnrequesttextrecognitionlevel
   */
  recognitionLevel?: 'fast' | 'accurate';

  /**
   * Preferred languages (BCP‑47 codes, e.g. `en-US`, `cs`, `de`).
   * Passed to `VNRecognizeTextRequest.recognitionLanguages`.
   *
   * @example ['en-US', 'es-ES', 'fr-FR']
   * @see https://developer.apple.com/documentation/vision/vnrecognizetextrequest/3152634-recognitionlanguages
   */
  recognitionLanguages?: string[];

  /**
   * Enables Vision's post-recognition language correction.
   * When true, Vision applies additional language-based corrections to improve accuracy.
   *
   * @see https://developer.apple.com/documentation/vision/vnrecognizetextrequest/3152635-useslanguagecorrection
   */
  usesLanguageCorrection?: boolean;

  /**
   * Additional vocabulary to bias recognition. iOS 16+ only.
   * Provides custom words that the recognizer should prioritize during text detection.
   *
   * @platform ios 16+
   * @example ['MyCompany', 'SpecialTerm', 'ProductName']
   * @see https://developer.apple.com/documentation/vision/vnrecognizetextrequest/4073142-customwords
   */
  customWords?: string[];

  /**
   * Normalized region-of-interest rectangle in Vision coordinate space [0..1].
   * If omitted, the entire image is used. No re-mapping is performed.
   * Origin is at bottom-left in Vision coordinate system.
   *
   * @see https://developer.apple.com/documentation/vision/vnrecognizetextrequest/3152636-regionofinterest
   */
  regionOfInterest?: {
    /** X coordinate (0 = left edge, 1 = right edge) */
    x: number;
    /** Y coordinate (0 = bottom edge, 1 = top edge) */
    y: number;
    /** Width (0 to 1) */
    width: number;
    /** Height (0 to 1) */
    height: number;
  };

  /**
   * Minimum text height in normalized image coordinates [0..1].
   * Values too small can increase noise. If omitted, Vision's default is used.
   *
   * @see https://developer.apple.com/documentation/vision/vnrecognizetextrequest/3152637-minimumtextheight
   */
  minimumTextHeight?: number;

  /**
   * VNRecognizeTextRequest revision to use. If not supported, the default revision is used.
   * Different revisions may have different capabilities and performance characteristics.
   *
   * @see https://developer.apple.com/documentation/vision/vnrecognizetextrequest/3152638-revision
   */
  revision?: number;

  /**
   * Lets Vision auto-detect text language. iOS 16+ only.
   * When enabled, Vision attempts to automatically determine the language of detected text.
   *
   * @platform ios 16+
   * @see https://developer.apple.com/documentation/vision/vnrecognizetextrequest/4073141-automaticallydetectslanguage
   */
  automaticallyDetectsLanguage?: boolean;

  /**
   * Optional cap on the number of candidates returned per observation.
   * - If provided and >= 1, your value is used.
   * - If omitted or < 1, native defaults to 128.
   *
   * @default 128
   */
  maxCandidates?: number;
}

/**
 * One recognized text candidate for an observation, sorted by confidence descending.
 * Represents a single possible text interpretation for a detected text region.
 *
 * @see https://developer.apple.com/documentation/vision/vnrecognizedtext
 */
export interface RecognizedTextCandidate {
  /** Recognized string value. */
  text: string;
  /**
   * Candidate confidence in range [0, 1].
   * Higher values indicate greater confidence in the recognition accuracy.
   */
  confidence: number;
}

/**
 * Vision-like observation describing a detected text region.
 * Represents a single block of detected text with its location and recognition candidates.
 *
 * @see https://developer.apple.com/documentation/vision/vnrecognizedtextobservation
 */
export interface VNRecognizedTextObservation {
  /**
   * Normalized bounding box in Vision coordinate space [0..1].
   * Origin is at bottom-left in Vision coordinate system.
   */
  boundingBox: {
    /** X coordinate (0 = left edge, 1 = right edge) */
    x: number;
    /** Y coordinate (0 = bottom edge, 1 = top edge) */
    y: number;
    /** Width (0 to 1) */
    width: number;
    /** Height (0 to 1) */
    height: number;
  };
  /** All available recognition candidates for this region, best-first. */
  candidates: RecognizedTextCandidate[];
}

/**
 * Full result of the advanced iOS recognition call.
 * Contains all recognized text observations and metadata about the recognition process.
 */
export interface RecognizeTextIOSResult {
  /** All recognized text observations in the image. */
  observations: VNRecognizedTextObservation[];

  /**
   * Logical image size from UIImage.size (points).
   * Multiply by scale to obtain pixels if you need pixel coordinates.
   */
  imageSize: {
    /** Width in points */
    width: number;
    /** Height in points */
    height: number;
  };

  /**
   * Echo of the actual VNRecognizeTextRequest configuration used after availability guards
   * and supported revision checks. This shows the effective configuration that was applied.
   */
  effectiveRequest: {
    /** Recognition level actually used */
    recognitionLevel: 'fast' | 'accurate';
    /** Languages actually used for recognition */
    recognitionLanguages: string[];
    /** Whether language correction was enabled */
    usesLanguageCorrection: boolean;
    /** Revision number actually used */
    revision: number;
    /** Minimum text height used by native (normalized [0..1]). */
    minimumTextHeight?: number;
    /** Region of interest actually used */
    regionOfInterest: { x: number; y: number; width: number; height: number };
    /** Custom words actually used (iOS 16+) */
    customWords?: string[];
    /** Whether automatic language detection was enabled (iOS 16+) */
    automaticallyDetectsLanguage?: boolean;
    /** Effective candidate cap used by native (defaults to 128 when not provided or < 1). */
    maxCandidates?: number;
  };
}
