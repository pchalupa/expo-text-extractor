import { requireNativeModule } from 'expo-modules-core';

import type { ExpoTextExtractorModule } from './types/common';

/**
 * The native expo-text-extractor module.
 * Provides text extraction capabilities using platform-specific APIs:
 * - iOS: Apple Vision Framework
 * - Android: Google ML Kit
 * - Web: Not supported (returns empty results)
 */
export default requireNativeModule<ExpoTextExtractorModule>('ExpoTextExtractor');
