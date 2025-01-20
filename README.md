# Expo Text Extractor

Expo Text Extractor is a library that enables text recognition (OCR) using Google ML Kit on Android and Apple Vision on iOS.

### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator | Web |
| -------------- | ---------------- | ---------- | ------------- | --- |
| ✅             | ✅               | ✅         | ✅            | ❌  |

### Demo

<p align="center">
	<img src="https://github.com/pchalupa/readme-assets/blob/main/expo-text-extractor.gif" alt="demo" width="75%" />
</p>

## Installation

To get started, install the library using Expo CLI:

```sh
npx expo install expo-text-extractor
```

> Ensure your project is running Expo SDK 52+.

### API Documentation

Check the [example app](https://github.com/pchalupa/expo-text-extractor/blob/main/example/App.tsx) for more details.

#### Supports Text Extraction

A boolean value indicating whether the current device supports text extraction.

```ts
const isSupported: boolean;
```

#### Extract Text From Image

Extracts text from an image and returns the recognized text as an array.

```ts
async function extractTextFromImage(uri: string): Promise<string>;
```
