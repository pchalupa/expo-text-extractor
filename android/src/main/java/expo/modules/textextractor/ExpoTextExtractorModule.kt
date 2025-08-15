package expo.modules.textextractor

import android.graphics.Point
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.lang.reflect.Method

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
        promise.reject(CodedException("UNKNOWN_ERROR", error.message ?: "Unknown error", error))
      }
    }

  // Android-specific advanced API exposing near-native ML Kit structure
  AsyncFunction("extractTextFromImageAndroid") { uriString: String, options: Map<String, Any>?, promise: Promise ->
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
        // Resolve model option; currently this module bundles only the Latin model dependency.
        val requestedModel = (options?.get("model") as? String)?.lowercase() ?: "latin"
        val recognizer = when (requestedModel) {
          "latin" -> TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
          else -> {
            // Other scripts require additional dependencies not bundled by this module.
            promise.reject(
              CodedException(
                "E_UNSUPPORTED_MODEL",
                "Requested model '$requestedModel' is not bundled. Add appropriate ML Kit text-recognition dependency or use 'latin'.",
                null
              )
            )
            return@AsyncFunction
          }
        }

        recognizer.process(inputImage)
          .addOnSuccessListener { visionText ->
            // Map ML Kit results to JS-friendly payload with minimal transformation
            val blocks = visionText.textBlocks.map { block ->
              val blockBox = block.boundingBox
              val blockMap = mutableMapOf<String, Any>(
                "text" to block.text,
                "lines" to block.lines.map { line ->
                  val lineBox = line.boundingBox
                  val lineMap = mutableMapOf<String, Any>(
                    "text" to line.text,
                    "elements" to line.elements.map { el ->
                      val elBox = el.boundingBox
                      val elMap = mutableMapOf<String, Any>(
                        "text" to el.text
                      )
                      // Element optional properties
                      elBox?.let {
                        elMap["boundingBox"] = mapOf(
                          "x" to it.left,
                          "y" to it.top,
                          "width" to it.width(),
                          "height" to it.height()
                        )
                      }
                      el.cornerPoints?.let { pts ->
                        elMap["cornerPoints"] = pts.map { p -> mapOf("x" to p.x, "y" to p.y) }
                      }
                      reflectGetString(el, "getRecognizedLanguage")?.let { lang ->
                        if (lang.isNotEmpty()) elMap["recognizedLanguage"] = lang
                      }
                      reflectGetNumber(el, "getConfidence")?.let { conf -> elMap["confidence"] = conf }
                      // Rotation degree availability varies; try multiple common getters
                      reflectFirstNumber(el, listOf("getAngle", "getRotationDegrees", "getRotation"))?.let { angle ->
                        elMap["rotationDegree"] = angle
                      }
                      // Symbols (characters) if available in this version
                      val symbols = reflectGet(el, "getSymbols") as? List<*>
                      if (symbols != null) {
                        elMap["symbols"] = symbols.mapNotNull { sym ->
                          sym?.let { s ->
                            val symMap = mutableMapOf<String, Any>()
                            (reflectGetString(s, "getText") ?: "").let { t -> symMap["text"] = t }
                            (reflectGet(s, "getBoundingBox") as? android.graphics.Rect)?.let { r ->
                              symMap["boundingBox"] = mapOf(
                                "x" to r.left,
                                "y" to r.top,
                                "width" to r.width(),
                                "height" to r.height()
                              )
                            }
                            (reflectGet(s, "getCornerPoints") as? Array<Point>)?.let { pts ->
                              symMap["cornerPoints"] = pts.map { p -> mapOf("x" to p.x, "y" to p.y) }
                            }
                            reflectGetNumber(s, "getConfidence")?.let { conf -> symMap["confidence"] = conf }
                            reflectFirstNumber(s, listOf("getAngle", "getRotationDegrees", "getRotation"))?.let { ang ->
                              symMap["rotationDegree"] = ang
                            }
                            symMap
                          }
                        }
                      }
                      elMap
                    }
                  )
                  // Line optional properties
                  lineBox?.let {
                    lineMap["boundingBox"] = mapOf(
                      "x" to it.left,
                      "y" to it.top,
                      "width" to it.width(),
                      "height" to it.height()
                    )
                  }
                  line.cornerPoints?.let { pts ->
                    lineMap["cornerPoints"] = pts.map { p -> mapOf("x" to p.x, "y" to p.y) }
                  }
                  reflectGetString(line, "getRecognizedLanguage")?.let { lang ->
                    if (lang.isNotEmpty()) lineMap["recognizedLanguage"] = lang
                  }
                  reflectGetNumber(line, "getConfidence")?.let { conf -> lineMap["confidence"] = conf }
                  reflectFirstNumber(line, listOf("getAngle", "getRotationDegrees", "getRotation"))?.let { angle ->
                    lineMap["rotationDegree"] = angle
                  }
                  lineMap
                }
              )
              blockBox?.let {
                blockMap["boundingBox"] = mapOf(
                  "x" to it.left,
                  "y" to it.top,
                  "width" to it.width(),
                  "height" to it.height()
                )
              }
              block.cornerPoints?.let { pts ->
                blockMap["cornerPoints"] = pts.map { p -> mapOf("x" to p.x, "y" to p.y) }
              }
              reflectGetString(block, "getRecognizedLanguage")?.let { lang ->
                if (lang.isNotEmpty()) blockMap["recognizedLanguage"] = lang
              }
              blockMap
            }

            val result = mapOf(
              "fullText" to visionText.text,
              "blocks" to blocks,
              "imageSize" to mapOf("width" to inputImage.width, "height" to inputImage.height),
              // Echo back the effective model used
              "effectiveRequest" to mapOf("model" to requestedModel)
            )

            promise.resolve(result)
          }
          .addOnFailureListener { error ->
            promise.reject(CodedException("err", error))
          }
      } catch (error: Exception) {
        promise.reject(CodedException("UNKNOWN_ERROR", error.message ?: "Unknown error", error))
      }
    }
  }

  // Reflection helper functions to safely call methods that may not exist in all ML Kit versions
  private fun reflectGetString(obj: Any, methodName: String): String? {
    return try {
      val method: Method = obj.javaClass.getMethod(methodName)
      method.invoke(obj) as? String
    } catch (e: Exception) {
      null
    }
  }

  private fun reflectGetNumber(obj: Any, methodName: String): Number? {
    return try {
      val method: Method = obj.javaClass.getMethod(methodName)
      method.invoke(obj) as? Number
    } catch (e: Exception) {
      null
    }
  }

  private fun reflectGet(obj: Any, methodName: String): Any? {
    return try {
      val method: Method = obj.javaClass.getMethod(methodName)
      method.invoke(obj)
    } catch (e: Exception) {
      null
    }
  }

  private fun reflectFirstNumber(obj: Any, methodNames: List<String>): Number? {
    for (methodName in methodNames) {
      try {
        val method: Method = obj.javaClass.getMethod(methodName)
        val result = method.invoke(obj) as? Number
        if (result != null) return result
      } catch (e: Exception) {
        // Continue to next method name
      }
    }
    return null
  }
}
