# Code Organization for expo-text-extractor

## Overview

The TypeScript types for expo-text-extractor have been reorganized to provide better separation of platform-specific implementation details while maintaining excellent VS Code IntelliSense support.

## File Structure

```
src/
├── types/
│   ├── index.ts          # Main types export (re-exports all types)
│   ├── common.ts         # Platform-agnostic types
│   ├── ios.ts            # iOS Vision Framework types
│   └── android.ts        # Android ML Kit types
├── ExpoTextExtractorModule.ts      # Main native module interface
├── ExpoTextExtractorModule.web.ts  # Web implementation
└── index.ts              # Public API exports
```

## Key Improvements

### 1. Platform Separation ✅

- **iOS types** (`types/ios.ts`): All Vision Framework related types with complete Apple documentation links
- **Android types** (`types/android.ts`): All ML Kit related types with Google documentation links  
- **Common types** (`types/common.ts`): Shared interfaces used across platforms

### 2. Enhanced VS Code IntelliSense ✅

- **Rich JSDoc comments**: Each type includes detailed descriptions, platform availability, examples, and official documentation links
- **@platform annotations**: Clear platform-specific markers for better IDE support
- **@see references**: Direct links to official Apple and Google documentation
- **@example blocks**: Code examples where helpful
- **@default annotations**: Clear default value documentation

### 3. Better Type Organization

- **Hierarchical structure**: Types are organized by platform and functionality
- **Re-export pattern**: Main `types/index.ts` re-exports everything for easy importing
- **Interface over type**: Using `interface` declarations for better extension and IntelliSense

## Usage Examples

### Importing Platform-Specific Types

```typescript
// Import iOS types specifically
import type { VNRecognizeTextRequestOptions, RecognizeTextIOSResult } from 'expo-text-extractor';

// Import Android types specifically  
import type { MLKTextBlock, RecognizeTextAndroidResult } from 'expo-text-extractor';

// Import common types
import type { ExpoTextExtractorModule } from 'expo-text-extractor';
```

### VS Code IntelliSense Benefits

When using these types in VS Code, you'll now see:

1. **Rich descriptions** for each property with platform availability
2. **Links to official documentation** for deeper understanding
3. **Clear platform annotations** showing iOS 16+ requirements, etc.
4. **Proper hierarchy** showing the relationship between ML Kit's text structure
5. **Type safety** with proper optional/required property annotations

### Platform-Specific Implementation Details

#### iOS Vision Framework
- Uses normalized coordinates [0..1] with bottom-left origin
- Supports language detection, custom vocabularies, and region of interest
- Returns confidence scores and multiple recognition candidates
- Structured as observations with bounding boxes

#### Android ML Kit  
- Uses pixel coordinates with top-left origin
- Hierarchical text structure: Blocks → Lines → Elements → Symbols
- Language detection per text element
- Rotation angle detection for skewed text

## Migration

This reorganization is **backward compatible**. All existing type imports will continue to work as before, but you now have access to better-organized types with enhanced documentation.

## Benefits

1. **Maintainability**: Platform-specific code is clearly separated
2. **Documentation**: Rich IntelliSense with platform-specific details
3. **Discoverability**: Clear organization makes finding the right type easier
4. **Extensibility**: Easy to add new platform support or extend existing types
5. **Type Safety**: Better type definitions with proper optional/required annotations
