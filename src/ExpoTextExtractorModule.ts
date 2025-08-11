import { requireNativeModule } from 'expo-modules-core';

/**
 * iOS-only: Options that mirror Apple's VNRecognizeTextRequest as closely as possible.
 * All fields are optional; only provided ones will be applied. Availability-gated
 * properties are ignored on older iOS versions but echoed in `effectiveRequest` when used.
 */
export type VNRecognizeTextRequestOptions = {
  /**
   * Vision recognition level. `fast` is lower-latency, `accurate` is higher-quality.
   * Defaults to Vision's default (typically `accurate`).
   */
  recognitionLevel?: 'fast' | 'accurate';
  /**
   * Preferred languages (BCP‑47 codes, e.g. `en-US`, `cs`, `de`).
   * Passed to `VNRecognizeTextRequest.recognitionLanguages`.
   */
  recognitionLanguages?: string[];
  /**
   * Enables Vision's post-recognition language correction.
   */
  usesLanguageCorrection?: boolean;
  /**
   * Additional vocabulary to bias recognition. iOS 16+ only.
   */
  customWords?: string[]; // iOS 16+
  /**
   * Normalized region-of-interest rectangle in Vision coordinate space [0..1].
   * If omitted, the entire image is used. No re-mapping is performed.
   */
  regionOfInterest?: { x: number; y: number; width: number; height: number };
  /**
   * VNRecognizeTextRequest revision to use. If not supported, the default revision is used.
   */
  revision?: number;
  /**
   * Lets Vision auto-detect text language. iOS 16+ only.
   */
  automaticallyDetectsLanguage?: boolean; // iOS 16+
  /**
   * Optional cap on the number of candidates returned per observation.
   * - If provided and >= 1, your value is used.
   * - If omitted or < 1, native defaults to 128.
   */
  maxCandidates?: number;
};

/**
 * One recognized text candidate for an observation, sorted by confidence descending.
 */
export type RecognizedTextCandidate = {
  /** Recognized string value. */
  text: string;
  /** Candidate confidence in range [0, 1]. */
  confidence: number;
};

/**
 * Vision-like observation describing a detected text region.
 */
export type VNRecognizedTextObservationTS = {
  /** Stable identifier for the observation within this request. */
  uuid: string;
  /** Normalized bounding box in Vision coordinate space [0..1]. */
  boundingBox: { x: number; y: number; width: number; height: number };
  /** All available recognition candidates for this region, best-first. */
  candidates: RecognizedTextCandidate[];
  /** The request revision that produced this observation. */
  requestRevision: number;
};

/**
 * Full result of the advanced iOS recognition call.
 */
export type RecognizeTextIOSResult = {
  /** All recognized text observations in the image. */
  observations: VNRecognizedTextObservationTS[];
  /**
   * Logical image size from UIImage.size (points). Multiply by scale to obtain pixels
   * if you need pixel coordinates.
   */
  imageSize: { width: number; height: number };
  /**
   * Echo of the actual VNRecognizeTextRequest configuration used after availability guards
   * and supported revision checks.
   */
  effectiveRequest: {
    recognitionLevel: 'fast' | 'accurate';
    recognitionLanguages: string[];
    usesLanguageCorrection: boolean;
    revision: number;
    regionOfInterest: { x: number; y: number; width: number; height: number };
    customWords?: string[];
    automaticallyDetectsLanguage?: boolean;
  /** Effective candidate cap used by native (defaults to 128 when not provided or < 1). */
  maxCandidates?: number;
  };
};

interface ExpoTextExtractorModule {
  isSupported: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
  // iOS-only advanced API
  /**
   * iOS-only: Extract text and return Vision-like observations and metadata.
   * Throws on non‑iOS platforms. Coordinates are normalized and unmodified.
   */
  extractTextFromImageIOS?: (
    uri: string,
    options?: VNRecognizeTextRequestOptions,
  ) => Promise<RecognizeTextIOSResult>;
}

export default requireNativeModule<ExpoTextExtractorModule>('ExpoTextExtractor');
