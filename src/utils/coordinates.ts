/**
 * Coordinate transformation utilities for cross-platform text extraction
 * Handles conversion between Vision Framework (normalized, bottom-left) and ML Kit (pixel, top-left) coordinates
 */

import type { MLKPoint, RectBox } from '../types/android';
import type { UnifiedBoundingBox, UnifiedPoint } from '../types/unified';

/**
 * Image dimensions for coordinate transformations
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Convert Vision Framework normalized coordinates (bottom-left origin) to unified pixel coordinates (top-left origin)
 */
/**
 * Convert Vision Framework normalized coordinates (bottom-left origin) to unified coordinates (top-left origin)
 * Returns both pixel and percentage coordinates for maximum flexibility
 */
export function visionToUnifiedBoundingBox(
  visionBox: { x: number; y: number; width: number; height: number },
  imageSize: ImageDimensions,
): UnifiedBoundingBox {
  // Vision uses normalized coordinates [0..1] with bottom-left origin
  // Convert to pixel coordinates with top-left origin
  const pixelX = visionBox.x * imageSize.width;
  const pixelWidth = visionBox.width * imageSize.width;
  const pixelHeight = visionBox.height * imageSize.height;

  // Convert from bottom-left to top-left origin
  const pixelY = imageSize.height - visionBox.y * imageSize.height - pixelHeight;

  return {
    x: Math.round(pixelX),
    y: Math.round(pixelY),
    width: Math.round(pixelWidth),
    height: Math.round(pixelHeight),
    // Percentage coordinates (top-left origin)
    xPercent: visionBox.x,
    yPercent: 1 - visionBox.y - visionBox.height, // Convert from bottom-left to top-left
    widthPercent: visionBox.width,
    heightPercent: visionBox.height,
  };
}

/**
 * Convert unified pixel coordinates (top-left origin) to Vision Framework normalized coordinates (bottom-left origin)
 */
/**
 * Convert unified coordinates to Vision Framework normalized coordinates (bottom-left origin)
 */
export function unifiedToVisionBoundingBox(
  unifiedBox: UnifiedBoundingBox,
  imageSize: ImageDimensions,
): { x: number; y: number; width: number; height: number } {
  // Use percentage coordinates directly for Vision (more accurate)
  const normalizedX = unifiedBox.xPercent;
  const normalizedWidth = unifiedBox.widthPercent;
  const normalizedHeight = unifiedBox.heightPercent;

  // Convert from top-left to bottom-left origin
  const normalizedY = 1 - unifiedBox.yPercent - unifiedBox.heightPercent;

  return {
    x: normalizedX,
    y: normalizedY,
    width: normalizedWidth,
    height: normalizedHeight,
  };
}

/**
 * Convert ML Kit pixel coordinates (already top-left origin) to unified coordinates
 */
export function mlkitToUnifiedBoundingBox(
  mlkitBox: RectBox,
  imageSize: ImageDimensions,
): UnifiedBoundingBox {
  // ML Kit already uses pixel coordinates with top-left origin
  return {
    x: Math.round(mlkitBox.x),
    y: Math.round(mlkitBox.y),
    width: Math.round(mlkitBox.width),
    height: Math.round(mlkitBox.height),
    // Calculate percentage coordinates
    xPercent: mlkitBox.x / imageSize.width,
    yPercent: mlkitBox.y / imageSize.height,
    widthPercent: mlkitBox.width / imageSize.width,
    heightPercent: mlkitBox.height / imageSize.height,
  };
}

/**
 * Convert unified coordinates to ML Kit coordinates (no transformation needed, just type conversion)
 */
export function unifiedToMlkitBoundingBox(unifiedBox: UnifiedBoundingBox): RectBox {
  return {
    x: unifiedBox.x,
    y: unifiedBox.y,
    width: unifiedBox.width,
    height: unifiedBox.height,
  };
}

/**
 * Convert ML Kit points to unified points (no transformation needed)
 */
export function mlkitToUnifiedPoints(
  mlkitPoints: MLKPoint[],
  imageSize: ImageDimensions,
): UnifiedPoint[] {
  return mlkitPoints.map((point) => ({
    x: Math.round(point.x),
    y: Math.round(point.y),
    xPercent: point.x / imageSize.width,
    yPercent: point.y / imageSize.height,
  }));
}

/**
 * Convert unified points to ML Kit points
 */
export function unifiedToMlkitPoints(unifiedPoints: UnifiedPoint[]): MLKPoint[] {
  return unifiedPoints.map((point) => ({
    x: point.x,
    y: point.y,
  }));
}

/**
 * Convert Vision corner points (if available) to unified points
 * Note: Vision Framework doesn't typically provide corner points in VNRecognizedTextObservation,
 * but this function handles the conversion if they were available
 */
export function visionToUnifiedPoints(
  visionPoints: { x: number; y: number }[],
  imageSize: ImageDimensions,
): UnifiedPoint[] {
  return visionPoints.map((point) => {
    const pixelX = point.x * imageSize.width;
    // Convert from bottom-left to top-left origin
    const pixelY = imageSize.height - point.y * imageSize.height;

    return {
      x: Math.round(pixelX),
      y: Math.round(pixelY),
      xPercent: point.x,
      yPercent: 1 - point.y, // Convert from bottom-left to top-left
    };
  });
}
