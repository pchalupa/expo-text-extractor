import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoTextExtractorModule extends NativeModule {
  isSupported: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
}

export default requireNativeModule<ExpoTextExtractorModule>('ExpoTextExtractor');
