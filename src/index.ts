import ExpoTextExtractorModule from './ExpoTextExtractorModule';

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
  uri = uri.replace('file://', '');

  return ExpoTextExtractorModule.extractTextFromImage(uri);
}
