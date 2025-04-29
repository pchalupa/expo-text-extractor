package expo.modules.textextractor

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
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
        val uri = if (uriString.startsWith("content://")) {
          Uri.parse(uriString)
        } else {
          val file = File(uriString)
          if (!file.exists()) {
            throw Exception("File not found: $uriString")
          }
          Uri.fromFile(file)
        }

        val inputImage = InputImage.fromFilePath(context, uri)
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

        recognizer.process(inputImage)
          .addOnSuccessListener { visionText ->
            val recognizedTexts = visionText.textBlocks.map { it.text }

            promise.resolve(recognizedTexts)
          }
          .addOnFailureListener { error ->
            promise.reject(CodedException("err", error))
          }
      } catch (error: Exception) {
        promise.reject(CodedException("err", error.message ?: "Unknown error", error))
      }
    }
  }
}
