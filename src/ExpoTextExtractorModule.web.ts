import type { ExpoTextExtractorModule } from './types/common';

/**
 * Web implementation of ExpoTextExtractorModule.
 * Text extraction is not supported on web platform.
 */
const ExpoTextExtractorModuleWeb: ExpoTextExtractorModule = {
  isSupported: false,
  extractTextFromImage: async (uri: string) => {
    console.warn('Text extraction is not supported on web platform');
    return [];
  },
};

export default ExpoTextExtractorModuleWeb;
