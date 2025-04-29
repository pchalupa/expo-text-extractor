import { requireNativeModule } from 'expo-modules-core';

interface ExpoTextExtractorModule {
  isSupported: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
}

export default requireNativeModule<ExpoTextExtractorModule>('ExpoTextExtractor');
