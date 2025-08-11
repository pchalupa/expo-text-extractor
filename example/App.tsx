import {
  launchCameraAsync,
  launchImageLibraryAsync,
  PermissionStatus,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';
import {
  extractTextFromImage,
  extractTextFromImageIOS,
  extractTextFromImageAndroid,
  isSupported,
  type RecognizeTextIOSResult,
  type RecognizeTextAndroidResult,
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
  Platform,
  Switch,
} from 'react-native';

export default function App() {
  const [result, setResult] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string>();
  const [advancedIOS, setAdvancedIOS] = useState<RecognizeTextIOSResult | null>(null);
  const [advancedAndroid, setAdvancedAndroid] = useState<RecognizeTextAndroidResult | null>(null);
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus | null>(null);
  const [galleryPermission, setGalleryPermission] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setResult([]);
    setAdvancedIOS(null);
    setAdvancedAndroid(null);

    if (isSupported) {
      try {
        const extractedTexts = await extractTextFromImage(path);
        setResult(extractedTexts);

        if (Platform.OS === 'ios') {
          const advancedRes = await extractTextFromImageIOS(path, {
            maxCandidates: 3,
            recognitionLevel: 'accurate',
          });
          setAdvancedIOS(advancedRes);
          setAdvancedAndroid(null);
        } else if (Platform.OS === 'android') {
          const advancedRes = await extractTextFromImageAndroid(path);
          setAdvancedAndroid(advancedRes);
          setAdvancedIOS(null);
        }
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
      <View style={styles.wrapper}>
        <View style={styles.imageContainer}>
          <View style={styles.buttonContainer}>
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
          <View style={styles.previewContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <Text style={styles.placeholderText}>No image selected</Text>
            )}
          </View>
        </View>
        {__DEV__ && (
          <View style={styles.devRow}>
            <Text style={styles.meta}>Show advanced (iOS)</Text>
            <Switch value={showAdvanced} onValueChange={setShowAdvanced} />
          </View>
        )}
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.scrollContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6858e9" />
              <Text style={styles.loadingText}>Extracting text...</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Simple lines</Text>
              {result.length > 0 ? (
                result.map((line, index) => (
                  <Text key={`line-${index}`} style={styles.mono}>
                    {line}
                  </Text>
                ))
              ) : (
                <Text style={styles.noResultsText}>No text detected</Text>
              )}

              {__DEV__ && showAdvanced && Platform.OS === 'ios' && advancedIOS && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Advanced (iOS)</Text>
                  <Text style={styles.meta}>
                    {`imageSize: ${advancedIOS.imageSize.width.toFixed(0)}x${advancedIOS.imageSize.height.toFixed(0)} - observations: ${advancedIOS.observations.length}`}
                  </Text>
                  <Text style={styles.meta}>
                    {`request: level=${advancedIOS.effectiveRequest.recognitionLevel}, revision=${advancedIOS.effectiveRequest.revision}, langs=[${advancedIOS.effectiveRequest.recognitionLanguages.join(', ')}], maxCandidates=${advancedIOS.effectiveRequest.maxCandidates ?? 128}`}
                  </Text>

                  {advancedIOS.observations.map((obs, idx) => (
                    <View key={`obs-${idx}`} style={styles.obsBlock}>
                      <Text style={styles.obsTitle}>Observation #{idx + 1}</Text>
                      <Text style={styles.mono}>
                        bbox: x={obs.boundingBox.x.toFixed(3)} y={obs.boundingBox.y.toFixed(3)} w=
                        {obs.boundingBox.width.toFixed(3)} h={obs.boundingBox.height.toFixed(3)}
                      </Text>
                      <View style={{ marginTop: 6 }}>
                        {obs.candidates.map((cand, cIdx) => (
                          <Text key={`cand-${idx}-${cIdx}`} style={styles.candidate}>
                            {cIdx + 1}. {cand.text} (conf={cand.confidence.toFixed(3)})
                          </Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {__DEV__ && showAdvanced && Platform.OS === 'android' && advancedAndroid && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Advanced (Android)</Text>
                  <Text style={styles.meta}>
                    {`imageSize: ${advancedAndroid.imageSize.width}x${advancedAndroid.imageSize.height} - blocks: ${advancedAndroid.blocks.length}`}
                  </Text>
                  <Text style={styles.meta}>
                    {`model: ${advancedAndroid.effectiveRequest.model}`}
                  </Text>

                  {advancedAndroid.blocks.map((block, bIdx) => (
                    <View key={`block-${bIdx}`} style={styles.obsBlock}>
                      <Text style={styles.obsTitle}>Block #{bIdx + 1}</Text>
                      <Text style={styles.mono}>{block.text}</Text>
                      {block.boundingBox && (
                        <Text style={styles.mono}>
                          bbox: x={block.boundingBox.x} y={block.boundingBox.y} w=
                          {block.boundingBox.width} h={block.boundingBox.height}
                        </Text>
                      )}
                      {block.lines.map((line, lIdx) => (
                        <View key={`line-${bIdx}-${lIdx}`} style={{ marginTop: 6 }}>
                          <Text style={styles.obsTitle}>Line #{lIdx + 1}</Text>
                          <Text style={styles.mono}>{line.text}</Text>
                          {line.boundingBox && (
                            <Text style={styles.mono}>
                              bbox: x={line.boundingBox.x} y={line.boundingBox.y} w=
                              {line.boundingBox.width} h={line.boundingBox.height}
                            </Text>
                          )}
                          {line.elements.map((el, eIdx) => (
                            <Text key={`el-${bIdx}-${lIdx}-${eIdx}`} style={styles.candidate}>
                              - {el.text}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  wrapper: {
    flex: 1,
    flexDirection: 'column',
    rowGap: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: 10,
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
    marginTop: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
