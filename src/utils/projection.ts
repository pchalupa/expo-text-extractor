/**
 * Coordinate transformation helper utilities
 * Provides simple functions for projecting coordinates onto image overlays
 */

import type { UnifiedBoundingBox, UnifiedPoint } from '../types/unified';

/**
 * Project unified coordinates onto an overlay view of different dimensions.
 * This is commonly needed when displaying text regions over images in UI.
 *
 * @param coords - Unified coordinates from text recognition
 * @param originalImageSize - Original image dimensions
 * @param overlaySize - Target overlay view dimensions
 * @returns Projected coordinates for the overlay
 *
 * @example
 * ```typescript
 * const result = await extractTextFromImageAdvanced(imageUri);
 * const overlaySize = { width: 300, height: 200 }; // Your Image component size
 *
 * result.regions.forEach(region => {
 *   const overlayCoords = projectToOverlay(
 *     region.boundingBox,
 *     result.imageSize,
 *     overlaySize
 *   );
 *
 *   // Use overlayCoords to position text overlay components
 *   console.log(`Overlay position: ${overlayCoords.x}, ${overlayCoords.y}`);
 * });
 * ```
 */
export function projectToOverlay(
  coords: UnifiedBoundingBox | UnifiedPoint,
  originalImageSize: { width: number; height: number },
  overlaySize: { width: number; height: number },
): UnifiedBoundingBox | UnifiedPoint {
  // Use percentage coordinates for accurate projection
  if ('width' in coords) {
    // BoundingBox
    return {
      x: Math.round(coords.xPercent * overlaySize.width),
      y: Math.round(coords.yPercent * overlaySize.height),
      width: Math.round(coords.widthPercent * overlaySize.width),
      height: Math.round(coords.heightPercent * overlaySize.height),
      xPercent: coords.xPercent,
      yPercent: coords.yPercent,
      widthPercent: coords.widthPercent,
      heightPercent: coords.heightPercent,
    };
  } else {
    // Point
    return {
      x: Math.round(coords.xPercent * overlaySize.width),
      y: Math.round(coords.yPercent * overlaySize.height),
      xPercent: coords.xPercent,
      yPercent: coords.yPercent,
    };
  }
}

/**
 * Convert pixel coordinates to percentage coordinates relative to image size.
 * Useful when you have pixel coordinates and need percentage for responsive layouts.
 *
 * @param pixelCoords - Pixel coordinates (top-left origin)
 * @param imageSize - Image dimensions
 * @returns Coordinates with percentage values
 */
export function pixelsToPercent(
  pixelCoords: { x: number; y: number; width?: number; height?: number },
  imageSize: { width: number; height: number },
): UnifiedBoundingBox | UnifiedPoint {
  const xPercent = pixelCoords.x / imageSize.width;
  const yPercent = pixelCoords.y / imageSize.height;

  if (pixelCoords.width !== undefined && pixelCoords.height !== undefined) {
    return {
      x: pixelCoords.x,
      y: pixelCoords.y,
      width: pixelCoords.width,
      height: pixelCoords.height,
      xPercent,
      yPercent,
      widthPercent: pixelCoords.width / imageSize.width,
      heightPercent: pixelCoords.height / imageSize.height,
    };
  } else {
    return {
      x: pixelCoords.x,
      y: pixelCoords.y,
      xPercent,
      yPercent,
    };
  }
}

/**
 * Convert percentage coordinates to pixel coordinates relative to image size.
 * Useful when you have percentage coordinates and need pixels for calculations.
 *
 * @param percentCoords - Percentage coordinates [0..1]
 * @param imageSize - Image dimensions
 * @returns Coordinates with pixel values
 */
export function percentToPixels(
  percentCoords: {
    xPercent: number;
    yPercent: number;
    widthPercent?: number;
    heightPercent?: number;
  },
  imageSize: { width: number; height: number },
): UnifiedBoundingBox | UnifiedPoint {
  const x = Math.round(percentCoords.xPercent * imageSize.width);
  const y = Math.round(percentCoords.yPercent * imageSize.height);

  if (percentCoords.widthPercent !== undefined && percentCoords.heightPercent !== undefined) {
    return {
      x,
      y,
      width: Math.round(percentCoords.widthPercent * imageSize.width),
      height: Math.round(percentCoords.heightPercent * imageSize.height),
      xPercent: percentCoords.xPercent,
      yPercent: percentCoords.yPercent,
      widthPercent: percentCoords.widthPercent,
      heightPercent: percentCoords.heightPercent,
    };
  } else {
    return {
      x,
      y,
      xPercent: percentCoords.xPercent,
      yPercent: percentCoords.yPercent,
    };
  }
}
