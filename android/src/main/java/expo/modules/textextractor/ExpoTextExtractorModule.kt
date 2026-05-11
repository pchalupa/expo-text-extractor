package expo.modules.textextractor

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import androidx.core.net.toUri
import java.io.File

class ExpoTextExtractorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoTextExtractor")

    Constants(
      "isSupported" to true
    )

    AsyncFunction("extractTextFromImage") { uriString: String, promise: Promise ->
      try {
        val context = appContext.reactContext!!
        val uri = when {
          uriString.startsWith("file://") -> uriString.toUri()
          uriString.startsWith("content://") -> uriString.toUri()
          uriString.startsWith("/") -> {
            val file = File(uriString)
            if (!file.exists())
              throw CodedException("File does not exist: $uriString")

            Uri.fromFile(file)
          }
          else -> throw CodedException("The provided URI is not valid: $uriString")
        }

        val inputImage = InputImage.fromFilePath(context, uri)
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

        recognizer.process(inputImage)
          .addOnSuccessListener { visionText ->
            val recognizedTexts = visionText.textBlocks.map { it.text }

            promise.resolve(recognizedTexts)
          }
          .addOnFailureListener { error ->
            promise.reject(CodedException("Failed to extract text from image", error))
          }
      } catch (error: CodedException) {
          promise.reject(error)
      } catch (error: Exception) {
        promise.reject(CodedException("UNKNOWN_ERROR", error.message ?: "Unknown error", error))
      }
    }
  }
}
