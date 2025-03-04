document.addEventListener('DOMContentLoaded', () => {
    // === Minimized and Settings Logic ===
    const popupContainer = document.getElementById("popup-container");
    const minimizeBtn = document.getElementById("minimizeBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const minimizedIcon = document.getElementById("minimizedIcon");

    minimizeBtn.addEventListener("click", () => {
        popupContainer.classList.add("minimized");
    });

    minimizedIcon.addEventListener("click", () => {
        popupContainer.classList.remove("minimized");
    });

    settingsBtn.addEventListener("click", () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open('settings.html');
        }
    });

    // === UI Update and Status Functions ===
    const updateUI = (isRecording) => {
        startBtn.disabled = isRecording;
        stopBtn.disabled = !isRecording;
        startBtn.innerHTML = isRecording ?
            '<i class="fas fa-spinner fa-spin"></i> Recording...' :
            '<i class="fas fa-play"></i> Start'; // Removed extra text
        if (isRecording) {
            stopBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
        }
    };

    const showStatusMessage = (element, message, isError = false) => {
        element.textContent = message;
        element.classList.toggle('error', isError);
    };


    // === Custom Prompt Logic ===
    const taskTypeSelect = document.getElementById("taskType");
    const customPromptTextarea = document.getElementById("customPrompt");
    const customPromptGroup = document.querySelector(".custom-prompt-group");

    taskTypeSelect.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
            customPromptGroup.classList.remove("hidden");
            customPromptTextarea.focus();
        } else {
            customPromptGroup.classList.add("hidden");
        }
    });

    // === Recording Logic ===
    let mediaRecorder;
    let audioChunks = [];
    let currentStream = null;

    const startBtn = document.getElementById("start");
    const stopBtn = document.getElementById("stop");
    const recordingStatus = document.getElementById("recordingStatus");
    const resultParagraph = document.getElementById("result");

    const startRecordingTab = async () => {
        try {
            const stream = await new Promise((resolve, reject) => {
                chrome.tabCapture.capture({
                    audio: true,
                    video: false
                }, (stream) => {
                    if (chrome.runtime.lastError || !stream) {
                        reject(new Error(chrome.runtime.lastError ? chrome.runtime.lastError.message : "Failed to capture tab audio"));
                    } else {
                        resolve(stream);
                    }
                });
            });
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const dest = audioContext.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioContext.destination);
            currentStream = dest.stream;
            mediaRecorder = new MediaRecorder(currentStream);
            audioChunks = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            mediaRecorder.start();
            showStatusMessage(recordingStatus, "Recording tab audio...");
        } catch (error) {
            showStatusMessage(recordingStatus, "Failed to start tab recording: " + error.message, true);
            updateUI(false);
        }
    };

    const stopRecording = async () => {
        try {
            if (!mediaRecorder) {
                throw new Error("No active recording found.");
            }
            return new Promise((resolve, reject) => {
                mediaRecorder.onstop = async () => {
                    try {
                        if (currentStream) {
                            currentStream.getTracks().forEach(track => track.stop());
                        }
                        const audioBlob = new Blob(audioChunks, {
                            type: "audio/m4a"
                        });
                        const formData = new FormData();
                        formData.append("file", audioBlob, "audio.m4a");
                        formData.append("model", "whisper-large-v3-turbo");
                        formData.append("response_format", "verbose_json");

                        const languageSelect = document.getElementById("transcriptionLanguage");
                        const selectedLanguage = languageSelect.value;
                        if (selectedLanguage !== "auto") {
                            formData.append("language", selectedLanguage);
                        }

                        chrome.storage.local.get("groqApiKey", async (data) => {
                            const groqApiKey = data.groqApiKey;
                            if (!groqApiKey) {
                                reject(new Error("Groq API Key not set. Please set it in the settings."));
                                return;
                            }
                            try {
                                const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                                    method: "POST",
                                    headers: {
                                        "Authorization": "Bearer " + groqApiKey
                                    },
                                    body: formData
                                });
                                if (!response.ok) {
                                    const errorData = await response.text();
                                    reject(new Error("Transcription API error: " + errorData));
                                    return;
                                }
                                const result = await response.json();
                                const transcript = result.text || "Transcription failed";
                                chrome.storage.local.set({
                                    transcription: transcript
                                });
                                resolve({
                                    status: "Recording stopped, transcription complete",
                                    transcription: transcript
                                });
                            } catch (apiError) {
                                reject(new Error("Error during transcription API call: " + apiError.message));
                            }
                        });
                    } catch (err) {
                        reject(new Error("Error processing recording: " + err.message));
                    }
                };
                mediaRecorder.stop();
            });
        } catch (error) {
            throw new Error("Failed to stop recording: " + error.message);
        }
    };

    startBtn.addEventListener("click", async () => {
        showStatusMessage(recordingStatus, "Starting tab recording...");
        updateUI(true);
        await startRecordingTab();
    });

    stopBtn.addEventListener("click", async () => {
        showStatusMessage(recordingStatus, "Stopping recording...");
        updateUI(false);
        try {
            const response = await stopRecording();
            if (response.status && response.status.startsWith("Recording stopped")) {
                showStatusMessage(recordingStatus, "Recording stopped. Processing transcription...");
                resultParagraph.textContent = response.transcription || "No transcription received.";
            } else {
                showStatusMessage(recordingStatus, response.message || "Failed to stop recording.", true);
                updateUI(false);
            }
        } catch (error) {
            showStatusMessage(recordingStatus, error.message, true);
            updateUI(false);
        }
    });

    // === AI Processing Logic ===
    const processBtn = document.getElementById("process");
    const processStatus = document.getElementById("processStatus");
    const aiResultParagraph = document.getElementById("aiResult");
    const modelSelect = document.getElementById("modelSelect");

    // Load saved model selection
    chrome.storage.local.get(["selectedModel"], (data) => {
        if (data.selectedModel) {
            modelSelect.value = data.selectedModel;
        }
    });

    // Save model selection on change
    modelSelect.addEventListener("change", () => {
        chrome.storage.local.set({
            selectedModel: modelSelect.value
        });
    });

    const processCerebras = async (transcription, taskType, customPrompt) => {
        // ... (Your existing Cerebras processing code) ...
        try {
            if (!transcription) {
                throw new Error("No transcription available to process.");
            }
            const cerebrasApiKey = await new Promise((resolve) => {
                chrome.storage.local.get("cerebrasApiKey", (data) => {
                    resolve(data.cerebrasApiKey);
                });
            });
            if (!cerebrasApiKey) {
                throw new Error("Cerebras API Key not set. Please set it in the settings.");
            }
            let systemContent = "Provide a well-structured summary of the transcript.";
            if (taskType === "qa") {
                systemContent = "Answer questions based on the transcript.";
            } else if (taskType === "custom") {
                systemContent = customPrompt || "Custom instruction missing.";
            }
            const payload = {
                model: "llama-3.3-70b",
                stream: false,
                max_tokens: 1024,
                temperature: 0.7,
                top_p: 1,
                messages: [{
                        role: "system",
                        content: systemContent
                    },
                    {
                        role: "user",
                        content: transcription
                    }
                ]
            };
            const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + cerebrasApiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error("Cerebras API error: " + errorData);
            }
            const result = await response.json();
            const output =
                result.choices &&
                result.choices[0] &&
                result.choices[0].message &&
                result.choices[0].message.content;
            const cerebrasOutput = output || "Processing failed.";
            chrome.storage.local.set({
                cerebrasOutput
            });
            return {
                status: "Processing complete",
                output: cerebrasOutput
            };
        } catch (error) {
            throw new Error("Failed to process with Cerebras: " + error.message);
        }
    };


    const processGemini = async (transcription, taskType, customPrompt) => {
        try {
            if (!transcription) {
                throw new Error("No transcription available to process.");
            }

            const geminiApiKey = await new Promise((resolve) => {
                chrome.storage.local.get("geminiApiKey", (data) => {
                    resolve(data.geminiApiKey);
                });
            });

            if (!geminiApiKey) {
                throw new Error("Gemini API Key not set. Please set it in the settings.");
            }

            let systemContent = "Provide a well-structured summary of the transcript.";
            if (taskType === "qa") {
                systemContent = "Answer questions based on the transcript.";
            } else if (taskType === "custom") {
                systemContent = customPrompt || "Custom instruction missing.";
            }

            const payload = {
                contents: [{
                    role: "user",
                    parts: [{
                        text: transcription
                    }],
                }, ],
                systemInstruction: {
                    role: "user",
                    parts: [{
                        text: systemContent
                    }, ],
                },
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain",
                },
            };

            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + geminiApiKey, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error("Gemini API error: " + errorData);
            }

            const result = await response.json();
            // Adapt Gemini response to match Cerebras structure (for consistency)
            const output = result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts[0].text;
            const geminiOutput = output || "Processing failed.";


            return {
                status: "Processing complete",
                output: geminiOutput
            };

        } catch (error) {
            throw new Error("Failed to process with Gemini: " + error.message);
        }
    };


    processBtn.addEventListener("click", async () => {
        processStatus.textContent = "Processing...";
        processBtn.disabled = true;

        chrome.storage.local.get("transcription", async (data) => {
            const transcription = data.transcription;
            if (!transcription) {
                showStatusMessage(processStatus, "No transcription available.", true);
                processBtn.disabled = false;
                return;
            }

            const taskType = taskTypeSelect.value;
            const customPrompt = customPromptTextarea.value.trim();
            const selectedModel = modelSelect.value; // Get selected model

            try {
                let response;
                if (selectedModel === "cerebras") {
                    response = await processCerebras(transcription, taskType, customPrompt);
                } else if (selectedModel === "gemini") {
                    response = await processGemini(transcription, taskType, customPrompt);
                } else {
                    throw new Error("Invalid model selected."); // Should not happen
                }


                if (response.status && response.status.startsWith("Processing complete")) {
                    processStatus.textContent = "Processing complete.";
                    aiResultParagraph.textContent = response.output || "No AI output received.";
                } else {
                    showStatusMessage(processStatus, response.message || "AI processing failed.", true);
                }
            } catch (error) {
                showStatusMessage(processStatus, error.message, true);
            }

            processBtn.disabled = false;
        });
    });
});