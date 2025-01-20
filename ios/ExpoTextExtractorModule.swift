import ExpoModulesCore
import Vision

public class ExpoTextExtractorModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoTextExtractor")

        Constants([
            "isSupported": true
        ])

        AsyncFunction("extractTextFromImage") { (url: URL, promise: Promise) in
            do {
                let imageData = try Data(contentsOf: url)
                let image = UIImage(data: imageData)
                guard let cgImage = image?.cgImage else {
                    throw Exception.init(name: "err", description: "err")
                }

                let requestHandler = VNImageRequestHandler(cgImage: cgImage)
                let request = VNRecognizeTextRequest { (request, error ) in
                    guard let observations = request.results as? [VNRecognizedTextObservation] else {
                        return promise.resolve([])
                    }

                    let recognizedTexts = observations.compactMap { observation in
                        observation.topCandidates(1).first?.string
                    }

                    promise.resolve(recognizedTexts)
                }

                try requestHandler.perform([request])
            } catch {
                promise.reject(error)
            }
        }
    }
}
