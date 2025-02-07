document.addEventListener('DOMContentLoaded', () => {
    // --- Helper Functions ---
    const updateUI = (isRecording) => {
      startBtn.disabled = isRecording;
      stopBtn.disabled = !isRecording;
      startBtn.innerHTML = isRecording
        ? '<i class="fas fa-spinner fa-spin"></i> Recording...'
        : '<i class="fas fa-play"></i> Start Recording';
      if (isRecording) {
        stopBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
      }
    };
  
    const showStatusMessage = (element, message, isError = false) => {
      element.textContent = message;
      element.classList.toggle('error', isError);
    };
  
    const togglePasswordVisibility = (targetId, event) => {
      const input = document.getElementById(targetId);
      const icon = event.currentTarget.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    };
  
    // --- API Keys ---
    const saveApiKeysBtn = document.getElementById("saveApiKeys");
    const groqApiKeyInput = document.getElementById("groqApiKey");
    const cerebrasApiKeyInput = document.getElementById("cerebrasApiKey");
    const apiKeyStatus = document.getElementById("apiKeyStatus");
  
    document.querySelectorAll('.toggle-password').forEach(button => {
      button.addEventListener('click', function (event) {
        togglePasswordVisibility(this.dataset.target, event);
      });
    });
  
    chrome.storage.local.get(["groqApiKey", "cerebrasApiKey"], (data) => {
      if (data.groqApiKey) groqApiKeyInput.value = data.groqApiKey;
      if (data.cerebrasApiKey) cerebrasApiKeyInput.value = data.cerebrasApiKey;
    });
  
    saveApiKeysBtn.addEventListener("click", async () => {
      const groqKey = groqApiKeyInput.value.trim();
      const cerebrasKey = cerebrasApiKeyInput.value.trim();
  
      if (!groqKey || !cerebrasKey) {
        showStatusMessage(apiKeyStatus, "Please enter both API keys.", true);
        return;
      }
  
      try {
        await chrome.storage.local.set({ groqApiKey: groqKey, cerebrasApiKey: cerebrasKey });
        showStatusMessage(apiKeyStatus, "API Keys saved successfully.", false);
        setTimeout(() => { apiKeyStatus.textContent = ""; }, 3000);
      } catch (error) {
        showStatusMessage(apiKeyStatus, "Error saving API keys.", true);
      }
    });
  
    // --- Custom Prompt ---
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
  
    // --- Recording Variables ---
    let mediaRecorder;
    let audioChunks = [];
    let currentStream = null;
  
    // --- Recording Elements ---
    const startBtn = document.getElementById("start");
    const stopBtn = document.getElementById("stop");
    const recordingStatus = document.getElementById("recordingStatus");
    const resultParagraph = document.getElementById("result");
  
    // --- 录制 Tab 音频的函数 ---
    const startRecordingTab = async () => {
      try {
        const stream = await new Promise((resolve, reject) => {
          chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
            if (chrome.runtime.lastError || !stream) {
              reject(new Error(chrome.runtime.lastError ? chrome.runtime.lastError.message : "Failed to capture tab audio"));
            } else {
              resolve(stream);
            }
          });
        });
        // 创建 AudioContext 并生成媒体流源
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        // 创建 MediaStreamDestination 用于录音
        const dest = audioContext.createMediaStreamDestination();
        // 同时将音频数据输出到录音节点和扬声器（destination），这样用户可以听到音频
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
  
    // --- 停止录音并调用转录 API ---
    const stopRecording = async () => {
      try {
        if (!mediaRecorder) {
          throw new Error("No active recording found.");
        }
        return new Promise((resolve, reject) => {
          mediaRecorder.onstop = async () => {
            try {
              // 停止当前流的所有轨道
              if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
              }
              const audioBlob = new Blob(audioChunks, { type: "audio/m4a" });
              const formData = new FormData();
              formData.append("file", audioBlob, "audio.m4a");
              formData.append("model", "whisper-large-v3-turbo");
              formData.append("response_format", "verbose_json");
  
              // 从 storage 中获取 Groq API Key
              chrome.storage.local.get("groqApiKey", async (data) => {
                const groqApiKey = data.groqApiKey;
                if (!groqApiKey) {
                  reject(new Error("Groq API Key not set. Please set it in the popup."));
                  return;
                }
                try {
                  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + groqApiKey },
                    body: formData
                  });
                  if (!response.ok) {
                    const errorData = await response.text();
                    reject(new Error("Transcription API error: " + errorData));
                    return;
                  }
                  const result = await response.json();
                  const transcript = result.text || "Transcription failed";
                  chrome.storage.local.set({ transcription: transcript });
                  resolve({ status: "Recording stopped, transcription complete", transcription: transcript });
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
  
    // --- 录音按钮事件 ---
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
  
    // --- AI Processing ---
    const processBtn = document.getElementById("process");
    const processStatus = document.getElementById("processStatus");
    const aiResultParagraph = document.getElementById("aiResult");
  
    const processCerebras = async (transcription, taskType, customPrompt) => {
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
          throw new Error("Cerebras API Key not set. Please set it in the popup.");
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
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: transcription }
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
        chrome.storage.local.set({ cerebrasOutput });
        return { status: "Processing complete", output: cerebrasOutput };
      } catch (error) {
        throw new Error("Failed to process with Cerebras: " + error.message);
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
        try {
          const response = await processCerebras(transcription, taskType, customPrompt);
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
  