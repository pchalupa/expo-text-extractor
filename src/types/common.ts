/**
 * Common types shared across platforms for expo-text-extractor
 */

/**
 * Platform-agnostic interface for the expo-text-extractor module.
 * This defines the core functionality available across all platforms.
 */
export interface ExpoTextExtractorModule {
  /**
   * Indicates whether text extraction is supported on the current platform.
   * Always true on iOS and Android, false on web and other platforms.
   */
  isSupported: boolean;

  /**
   * Basic text extraction that returns an array of recognized text strings.
   * This is the simplest API and works across all supported platforms.
   *
   * @param uri - The URI of the image to extract text from
   * @returns Promise that resolves to an array of recognized text strings
   */
  extractTextFromImage: (uri: string) => Promise<string[]>;

  /**
   * iOS-only advanced API that provides detailed Vision framework results.
   * Returns structured data with bounding boxes, confidence scores, and metadata.
   * Throws on non-iOS platforms.
   *
   * @platform ios
   */
  extractTextFromImageIOS?: (
    uri: string,
    options?: import('./ios').VNRecognizeTextRequestOptions,
  ) => Promise<import('./ios').RecognizeTextIOSResult>;

  /**
   * Android-only advanced API that provides detailed ML Kit results.
   * Returns structured data with text hierarchy (blocks, lines, elements, symbols).
   * Throws on non-Android platforms.
   *
   * @platform android
   */
  extractTextFromImageAndroid?: (
    uri: string,
    options?: import('./android').ExtractTextAndroidOptions,
  ) => Promise<import('./android').RecognizeTextAndroidResult>;
}
