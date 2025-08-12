import {
  launchCameraAsync,
  launchImageLibraryAsync,
  PermissionStatus,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';
import {
  extractTextFromImageAdvanced,
  getPlatformCapabilities,
  isSupported,
  projectToOverlay,
  type UnifiedTextExtractionResult,
  type UnifiedTextExtractionOptions,
} from 'expo-text-extractor';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Platform,
} from 'react-native';

interface BoundingBoxOverlayProps {
  result: UnifiedTextExtractionResult;
  imageLayout: { width: number; height: number };
  visible: boolean;
}

/**
 * Calculate the actual rendered image dimensions when using resizeMode="contain"
 * The image is scaled to fit within the container while maintaining aspect ratio
 */
function calculateActualImageDimensions(
  originalImageSize: { width: number; height: number },
  containerSize: { width: number; height: number },
): { width: number; height: number; offsetX: number; offsetY: number } {
  const containerAspectRatio = containerSize.width / containerSize.height;
  const imageAspectRatio = originalImageSize.width / originalImageSize.height;

  let actualWidth: number;
  let actualHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (imageAspectRatio > containerAspectRatio) {
    // Image is wider - fit to container width
    actualWidth = containerSize.width;
    actualHeight = containerSize.width / imageAspectRatio;
    offsetX = 0;
    offsetY = (containerSize.height - actualHeight) / 2;
  } else {
    // Image is taller - fit to container height
    actualWidth = containerSize.height * imageAspectRatio;
    actualHeight = containerSize.height;
    offsetX = (containerSize.width - actualWidth) / 2;
    offsetY = 0;
  }

  return {
    width: actualWidth,
    height: actualHeight,
    offsetX,
    offsetY,
  };
}

function BoundingBoxOverlay({ result, imageLayout, visible }: BoundingBoxOverlayProps) {
  if (!visible || !result || !imageLayout) {
    return null;
  }

  const getBoxColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4ade80'; // green for high confidence
    if (confidence >= 0.6) return '#fbbf24'; // yellow for medium confidence
    return '#f87171'; // red for low confidence
  };

  // Calculate the actual rendered image dimensions within the container
  const actualImageDimensions = calculateActualImageDimensions(result.imageSize, imageLayout);

  return (
    <View style={styles.overlayContainer}>
      {result.regions.map((region, index) => {
        // Project the bounding box coordinates to the actual rendered image dimensions
        const projectedBox = projectToOverlay(
          region.boundingBox,
          result.imageSize,
          actualImageDimensions,
        );

        // Ensure we have a bounding box (not a point)
        if (!('width' in projectedBox)) {
          return null;
        }

        const boxColor = getBoxColor(region.confidence);

        return (
          <View
            key={`bbox-${index}`}
            style={[
              styles.boundingBox,
              {
                left: projectedBox.x + actualImageDimensions.offsetX,
                top: projectedBox.y + actualImageDimensions.offsetY,
                width: projectedBox.width,
                height: projectedBox.height,
                borderColor: boxColor,
                backgroundColor: boxColor + '20', // 20 for opacity
              },
            ]}>
            <View style={[styles.boundingBoxLabel, { backgroundColor: boxColor }]}>
              <Text style={styles.boundingBoxText}>{index + 1}</Text>
            </View>
            {projectedBox.height > 30 && (
              <Text style={styles.confidenceText} numberOfLines={1}>
                {Math.round(region.confidence * 100)}%
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function App() {
  const [result, setResult] = useState<UnifiedTextExtractionResult | null>(null);
  const [imageUri, setImageUri] = useState<string>();
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus | null>(null);
  const [galleryPermission, setGalleryPermission] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null);

  const platformCapabilities = getPlatformCapabilities();

  useEffect(() => {
    const getPermissions = async () => {
      const cameraPermissionResult = await requestCameraPermissionsAsync();
      setCameraPermission(cameraPermissionResult.status);

      const galleryPermissionResult = await requestMediaLibraryPermissionsAsync();
      setGalleryPermission(galleryPermissionResult.status);
    };

    getPermissions();
  }, []);

  const processImage = async (path?: string) => {
    if (!path) return;

    setImageUri(path);
    setIsLoading(true);
    setResult(null);

    if (isSupported) {
      try {
        // Use unified API with options that work across platforms
        const extractionOptions: UnifiedTextExtractionOptions = {
          recognitionLevel: 'accurate',
          recognitionLanguages: ['en-US'],
          maxCandidates: 3,
        };

        const unifiedResult = await extractTextFromImageAdvanced(path, extractionOptions);
        setResult(unifiedResult);
      } catch (error) {
        if (error instanceof Error) Alert.alert('Text Extraction Error', error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      Alert.alert('Not Supported', 'Text extraction is not supported on this device');
    }
  };

  const handleImagePick = async () => {
    try {
      if (galleryPermission !== PermissionStatus.GRANTED) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to use this feature',
        );
        const { status } = await requestMediaLibraryPermissionsAsync();
        setGalleryPermission(status);
        if (status !== PermissionStatus.GRANTED) return;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
      });

      if (!result.canceled) {
        const path = result.assets?.at(0)?.uri;
        await processImage(path);
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert('Image Pick Error', error.message);
    }
  };

  const handleCameraCapture = async () => {
    try {
      if (cameraPermission !== PermissionStatus.GRANTED) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your camera to use this feature',
        );
        const { status } = await requestCameraPermissionsAsync();
        setCameraPermission(status);
        if (status !== PermissionStatus.GRANTED) return;
      }

      const result = await launchCameraAsync({
        mediaTypes: ['images'],
      });

      if (!result.canceled) {
        const path = result.assets?.at(0)?.uri;
        await processImage(path);
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert('Camera Error', error.message);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.mainScrollContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleImagePick}
            disabled={isLoading}>
            <Text style={styles.buttonText}>Pick Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleCameraCapture}
            disabled={isLoading}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.imageContainer,
            imageUri ? styles.imageContainerExpanded : styles.imageContainerCollapsed,
          ]}>
          <View style={styles.previewContainer}>
            {imageUri ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewImage}
                  onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setImageLayout({ width, height });
                  }}
                  resizeMode="contain"
                />
                {imageLayout && result && (
                  <BoundingBoxOverlay
                    result={result}
                    imageLayout={imageLayout}
                    visible={showBoundingBoxes}
                  />
                )}
              </View>
            ) : (
              <Text style={styles.placeholderText}>No image selected</Text>
            )}
          </View>
        </View>
        <View style={styles.controlsContainer}>
          <View style={styles.devRow}>
            <Text style={styles.meta}>Show bounding boxes</Text>
            <Switch value={showBoundingBoxes} onValueChange={setShowBoundingBoxes} />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6858e9" />
            <Text style={styles.loadingText}>Extracting text...</Text>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Extracted Text</Text>
            {result && result.regions.length > 0 ? (
              result.regions.map((region, index) => (
                <Text key={`region-${index}`} style={styles.mono}>
                  {region.text}
                </Text>
              ))
            ) : (
              <Text style={styles.noResultsText}>No text detected</Text>
            )}

            {result && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Detection Info</Text>
                <Text style={styles.meta}>
                  Platform: {result.platform} | Regions: {result.regions.length}
                </Text>
                <Text style={styles.meta}>
                  Image Size: {result.imageSize.width}×{result.imageSize.height}
                </Text>
                <Text style={styles.meta}>
                  Recognition Level: {result.effectiveOptions.recognitionLevel}
                </Text>
                {result.performance && (
                  <Text style={styles.meta}>
                    Processing Time: {result.performance.recognitionTimeMs}ms
                  </Text>
                )}
              </View>
            )}

            {result && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Advanced Details</Text>

                {showBoundingBoxes && (
                  <View style={styles.legendSection}>
                    <Text style={styles.subsectionTitle}>Bounding Box Legend</Text>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendBox, { backgroundColor: '#4ade80' }]} />
                      <Text style={styles.legendText}>High confidence (≥80%)</Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendBox, { backgroundColor: '#fbbf24' }]} />
                      <Text style={styles.legendText}>Medium confidence (60-79%)</Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendBox, { backgroundColor: '#f87171' }]} />
                      <Text style={styles.legendText}>Low confidence (&lt;60%)</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.subsectionTitle}>Platform Capabilities</Text>
                <Text style={styles.meta}>
                  Supported Features:{' '}
                  {Object.entries(platformCapabilities.features)
                    .filter(([_, supported]) => supported)
                    .map(([feature]) => feature)
                    .join(', ')}
                </Text>

                <Text style={[styles.subsectionTitle, { flex: 1 }]}>Detected Regions</Text>
                {result.regions.map((region, index) => (
                  <View key={`detail-${index}`} style={styles.regionDetail}>
                    <Text style={styles.regionTitle}>Region #{index + 1}</Text>
                    <Text style={styles.mono}>"{region.text}"</Text>
                    <Text style={styles.meta}>Confidence: {region.confidence.toFixed(3)}</Text>
                    <Text style={styles.meta}>
                      Position: ({region.boundingBox.x.toFixed(0)},{' '}
                      {region.boundingBox.y.toFixed(0)})
                    </Text>
                    <Text style={styles.meta}>
                      Size: {region.boundingBox.width.toFixed(0)}×
                      {region.boundingBox.height.toFixed(0)}
                    </Text>
                    <Text style={styles.meta}>
                      Percentage: ({region.boundingBox.xPercent.toFixed(2)},{' '}
                      {region.boundingBox.yPercent.toFixed(2)})
                    </Text>
                    {region.candidates.length > 1 && (
                      <View style={styles.candidatesSection}>
                        <Text style={styles.meta}>Alternative candidates:</Text>
                        {region.candidates.slice(1).map((candidate, cIdx) => (
                          <Text key={`cand-${index}-${cIdx}`} style={styles.candidate}>
                            • {candidate.text} (conf: {candidate.confidence.toFixed(3)})
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContainer: {
    flexGrow: 1,
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  wrapper: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  imageContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  imageContainerCollapsed: {
    height: 200,
  },
  imageContainerExpanded: {
    height: '50%',
    minHeight: 300,
    maxHeight: 500,
  },
  controlsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 10,
  },
  button: {
    backgroundColor: '#6858e9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#b3aedb',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    maxHeight: '40%',
    padding: 20,
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6858e9',
  },
  noResultsText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  meta: {
    color: '#555',
    marginBottom: 4,
  },
  obsBlock: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  obsTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    color: '#222',
  },
  candidate: {
    marginLeft: 8,
    color: '#333',
  },
  devRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
  },
  infoSection: {
    marginTop: 16,
    paddingTop: 12,    
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  regionDetail: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  regionTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#444',
  },
  candidatesSection: {
    marginTop: 6,
    marginLeft: 8,
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 2,
    minWidth: 20,
    minHeight: 20,
  },
  boundingBoxLabel: {
    position: 'absolute',
    top: -12,
    left: -1,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boundingBoxText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confidenceText: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: 8,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
  },
  legendSection: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  legendText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
});
