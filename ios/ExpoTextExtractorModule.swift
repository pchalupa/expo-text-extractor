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

        // iOS-specific advanced API exposing Vision options and near-native results
        AsyncFunction("extractTextFromImageIOS") { (url: URL, options: [String: Any]?, promise: Promise) in
            do {
                let imageData = try Data(contentsOf: url)
                guard let image = UIImage(data: imageData), let cgImage = image.cgImage else {
                    throw Exception(name: "E_BAD_IMAGE", description: "Unable to load image or create CGImage")
                }

                // Configure request with provided options
                let request = VNRecognizeTextRequest { (req, error) in
                    guard error == nil else {
                        return promise.reject(error!)
                    }

                    guard let results = req.results as? [VNRecognizedTextObservation] else {
                        return promise.resolve([
                            "observations": [],
                            "imageSize": ["width": image.size.width, "height": image.size.height],
                            "effectiveRequest": self._effectiveRequestDict(from: req)
                        ])
                    }

                    // Determine effective max candidates (optional): if provided and >=1, use it; otherwise default to 128
                    let effectiveMaxCandidates: Int
                    if let opts = options, let provided = opts["maxCandidates"] as? Int, provided >= 1 {
                        effectiveMaxCandidates = provided
                    } else {
                        effectiveMaxCandidates = 128
                    }

                    // Map observations to JS-friendly payload with minimal transformation
                    let observations: [[String: Any]] = results.map { observation in
                        let candidates = observation.topCandidates(effectiveMaxCandidates).map { candidate in
                            return [
                                "text": candidate.string,
                                "confidence": candidate.confidence
                            ] as [String: Any]
                        }

                        return [
                            "uuid": observation.uuid.uuidString,
                            "boundingBox": [
                                "x": observation.boundingBox.origin.x,
                                "y": observation.boundingBox.origin.y,
                                "width": observation.boundingBox.size.width,
                                "height": observation.boundingBox.size.height
                            ],
                            "requestRevision": observation.requestRevision,
                            "candidates": candidates
                        ] as [String: Any]
                    }

                    var effReq = self._effectiveRequestDict(from: req)
                    effReq["maxCandidates"] = effectiveMaxCandidates

                    promise.resolve([
                        "observations": observations,
                        "imageSize": ["width": image.size.width, "height": image.size.height],
                        "effectiveRequest": effReq
                    ])
                }

                // Apply options to request
                if let opts = options {
                    if let level = opts["recognitionLevel"] as? String {
                        request.recognitionLevel = (level.lowercased() == "fast") ? .fast : .accurate
                    }
                    if let langs = opts["recognitionLanguages"] as? [String] {
                        request.recognitionLanguages = langs
                    }
                    if let usesCorrection = opts["usesLanguageCorrection"] as? Bool {
                        request.usesLanguageCorrection = usesCorrection
                    }
                    if #available(iOS 16.0, *), let custom = opts["customWords"] as? [String] {
                        request.customWords = custom
                    }
                    if let roi = opts["regionOfInterest"] as? [String: Any] {
                        if let x = roi["x"] as? Double,
                           let y = roi["y"] as? Double,
                           let w = roi["width"] as? Double,
                           let h = roi["height"] as? Double {
                            request.regionOfInterest = CGRect(x: CGFloat(x), y: CGFloat(y), width: CGFloat(w), height: CGFloat(h))
                        }
                    }
                    if let minHeight = opts["minimumTextHeight"] as? Double {
                        request.minimumTextHeight = Float(minHeight)
                    }
                    if let revInt = opts["revision"] as? Int {
                        if type(of: request).supportedRevisions.contains(revInt) {
                            request.revision = revInt
                        }
                    } else if let revDouble = opts["revision"] as? Double {
                        let rev = Int(revDouble)
                        if type(of: request).supportedRevisions.contains(rev) {
                            request.revision = rev
                        }
                    }
                    if #available(iOS 16.0, *), let autoLang = opts["automaticallyDetectsLanguage"] as? Bool {
                        request.automaticallyDetectsLanguage = autoLang
                    }
                }

                let handler = VNImageRequestHandler(cgImage: cgImage)
                try handler.perform([request])
            } catch {
                promise.reject(error)
            }
        }
    }
}

extension ExpoTextExtractorModule {
    fileprivate func _effectiveRequestDict(from request: VNRequest) -> [String: Any] {
        guard let r = request as? VNRecognizeTextRequest else {
            return [:]
        }

        var dict: [String: Any] = [
            "recognitionLevel": (r.recognitionLevel == .fast ? "fast" : "accurate"),
            "recognitionLanguages": r.recognitionLanguages,
            "usesLanguageCorrection": r.usesLanguageCorrection,
            "revision": r.revision,
            "minimumTextHeight": r.minimumTextHeight,
            "regionOfInterest": [
                "x": r.regionOfInterest.origin.x,
                "y": r.regionOfInterest.origin.y,
                "width": r.regionOfInterest.size.width,
                "height": r.regionOfInterest.size.height
            ]
        ]

        if #available(iOS 16.0, *) {
            dict["customWords"] = r.customWords
            dict["automaticallyDetectsLanguage"] = r.automaticallyDetectsLanguage
        }

        return dict
    }
}
