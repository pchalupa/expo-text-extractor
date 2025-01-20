import { launchImageLibraryAsync } from 'expo-image-picker';
import { isSupported, extractTextFromImage } from 'expo-text-extractor';
import { useState } from 'react';
import {
  SafeAreaView,
  Image,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

export default function App() {
  const [result, setResult] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string>();

  const handleImagePick = async () => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
      });

      if (!result.canceled) {
        const path = result.assets?.at(0)?.uri;

        setImageUri(path);

        if (isSupported && path) {
          const extractedTexts = await extractTextFromImage(path);

          setResult(extractedTexts);
        }
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <TouchableOpacity style={styles.group} onPress={handleImagePick}>
          <Text style={styles.text}>Pick an image</Text>
          {imageUri && <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} />}
        </TouchableOpacity>
        <ScrollView style={styles.group} contentContainerStyle={styles.scrollContainer}>
          {result.map((line, index) => (
            <Text key={index}>{line}</Text>
          ))}
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
  },
  group: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  scrollContainer: {
    padding: 20,
  },
  text: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6858e9',
    marginVertical: 'auto',
  },
});
