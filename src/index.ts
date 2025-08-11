import { Platform } from 'react-native';

import ExpoTextExtractorModule, {
  RecognizeTextIOSResult,
  VNRecognizeTextRequestOptions,
  RecognizeTextAndroidResult,
  ExtractTextAndroidOptions,
} from './ExpoTextExtractorModule';

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

export type {
  RecognizeTextIOSResult,
  VNRecognizeTextRequestOptions,
  RecognizeTextAndroidResult,
  ExtractTextAndroidOptions,
};
