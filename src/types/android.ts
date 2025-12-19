/**
 * Android-specific types for ML Kit text recognition
 * These types mirror Google's ML Kit Text Recognition API structure
 */

/**
 * A point in 2D space with x and y coordinates.
 * Used to define corner points of text elements in pixel coordinates.
 *
 * @platform android
 * @see https://developers.google.com/ml-kit/vision/text-recognition/android/text-recognition-v2#text_structure
 */
export interface MLKPoint {
  /** X coordinate in pixels */
  x: number;
  /** Y coordinate in pixels */
  y: number;
}

/**
 * A rectangular bounding box defined by position and dimensions.
 * Coordinates are in pixels relative to the original image.
 *
 * @platform android
 */
export interface RectBox {
  /** X coordinate of the top-left corner in pixels */
  x: number;
  /** Y coordinate of the top-left corner in pixels */
  y: number;
  /** Width of the rectangle in pixels */
  width: number;
  /** Height of the rectangle in pixels */
  height: number;
}

/**
 * Represents a single character or symbol detected by ML Kit.
 * Symbols are the smallest unit of text recognition in the ML Kit hierarchy.
 *
 * @platform android
 * @see https://developers.google.com/ml-kit/vision/text-recognition/android/text-recognition-v2#text_structure
 */
export interface MLKSymbol {
  /** The recognized text content of this symbol */
  text: string;
  /** Bounding box of the symbol in pixel coordinates */
  boundingBox?: RectBox;
  /** Corner points of the symbol's bounding polygon */
  cornerPoints?: MLKPoint[];
  /** Recognition confidence score between 0 and 1 */
  confidence?: number;
  /** Rotation angle of the text in degrees */
  rotationDegree?: number;
}

/**
 * Represents a text element, which is a group of symbols that form a word or similar unit.
 * Elements are contained within text lines.
 *
 * @platform android
 * @see https://developers.google.com/ml-kit/vision/text-recognition/android/text-recognition-v2#text_structure
 */
export interface MLKTextElement {
  /** The recognized text content of this element */
  text: string;
  /** Bounding box of the element in pixel coordinates */
  boundingBox?: RectBox;
  /** Corner points of the element's bounding polygon */
  cornerPoints?: MLKPoint[];
  /** Detected language of the text element (ISO 639-1 code) */
  recognizedLanguage?: string;
  /** Recognition confidence score between 0 and 1 */
  confidence?: number;
  /** Rotation angle of the text in degrees */
  rotationDegree?: number;
  /** Individual symbols that make up this text element */
  symbols?: MLKSymbol[];
}

/**
 * Represents a line of text, which contains multiple text elements.
 * Lines are contained within text blocks.
 *
 * @platform android
 * @see https://developers.google.com/ml-kit/vision/text-recognition/android/text-recognition-v2#text_structure
 */
export interface MLKTextLine {
  /** The recognized text content of this line */
  text: string;
  /** Bounding box of the line in pixel coordinates */
  boundingBox?: RectBox;
  /** Corner points of the line's bounding polygon */
  cornerPoints?: MLKPoint[];
  /** Text elements that make up this line */
  elements: MLKTextElement[];
  /** Detected language of the text line (ISO 639-1 code) */
  recognizedLanguage?: string;
  /** Recognition confidence score between 0 and 1 */
  confidence?: number;
  /** Rotation angle of the text in degrees */
  rotationDegree?: number;
}

/**
 * Represents a block of text, which is the highest level grouping in ML Kit's text hierarchy.
 * Blocks typically represent paragraphs or distinct text regions.
 *
 * @platform android
 * @see https://developers.google.com/ml-kit/vision/text-recognition/android/text-recognition-v2#text_structure
 */
export interface MLKTextBlock {
  /** The recognized text content of this block */
  text: string;
  /** Bounding box of the block in pixel coordinates */
  boundingBox?: RectBox;
  /** Corner points of the block's bounding polygon */
  cornerPoints?: MLKPoint[];
  /** Text lines that make up this block */
  lines: MLKTextLine[];
  /** Detected language of the text block (ISO 639-1 code) */
  recognizedLanguage?: string;
}

/**
 * Options for configuring ML Kit text recognition on Android.
 *
 * @platform android
 * @see https://developers.google.com/ml-kit/vision/text-recognition/android/text-recognition-v2
 */
export interface ExtractTextAndroidOptions {
  /**
   * Choose ML Kit on-device model/script. Defaults to 'latin'.
   * Currently only the Latin script model is bundled with this module.
   *
   * @default 'latin'
   * @see https://developers.google.com/ml-kit/vision/text-recognition/android/text-recognition-v2#models
   */
  model?: 'latin';
}

/**
 * Full result of the advanced Android recognition call using ML Kit.
 * Contains all recognized text blocks and metadata about the recognition process.
 *
 * @platform android
 */
export interface RecognizeTextAndroidResult {
  /** All recognized text blocks in the image, ordered from top to bottom */
  blocks: MLKTextBlock[];
  /** Concatenated text from all blocks as a single string */
  fullText: string;
  /** Original image dimensions in pixels */
  imageSize: {
    /** Width in pixels */
    width: number;
    /** Height in pixels */
    height: number;
  };
  /** Echo of the actual ML Kit configuration used for recognition */
  effectiveRequest: {
    /** ML Kit on-device model used. Currently only 'latin' is bundled by this module. */
    model: 'latin';
  };
}
