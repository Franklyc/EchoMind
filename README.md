# EchoMind 🧠

<a href="https://groq.com" target="_blank" rel="noopener noreferrer">
    <img src="https://groq.com/wp-content/uploads/2024/03/PBG-mark1-color.svg" alt="Powered by Groq" width="100">
</a>

EchoMind is a Chrome extension that allows you to record audio from any webpage, transcribe it using Groq's blazing-fast implementation of the Whisper model, and then process the transcribed text using powerful LLMs hosted by Cerebras or Google. It's your personal AI assistant for the web!

## Features

*   **Tab Audio Recording:** Capture audio directly from your active browser tab. No need for external recording software.
*   **Fast Transcription:** Leverage Groq's incredibly fast implementation of OpenAI's [Whisper-large-v3-turbo](https://console.groq.com/docs/models) model for accurate and speedy speech-to-text conversion.
*   **Multilingual Support:** Transcribe audio in multiple languages, including Chinese (zh), English (en), Spanish (es), French (fr), German (de), Japanese (ja), Korean (ko), and Russian (ru). Automatic language detection is also supported.
*   **AI-Powered Processing:** Process the transcribed text using:
    *   Meta's [llama-3.3-70b](https://inference-docs.cerebras.ai/introduction) (hosted by Cerebras)
    *   Google's [gemini-2.0-flash-exp](https://ai.google.dev/gemini-api/docs/models/gemini#gemini-2.0-flash)
* **AI-Processing Options:**
    *   **Summarization:** Get concise summaries of lengthy audio content.
    *   **Question Answering:** Ask questions about the audio and receive AI-generated answers.
    *   **Custom Prompts:** Craft your own custom prompts to tailor the AI's processing to your specific needs.
*   **User-Friendly Interface:** A clean and intuitive popup interface makes recording, transcribing, and processing simple.
*   **Minimize Mode:** Minimize the popup to a discreet microphone icon while recording, keeping your workspace uncluttered.

## Installation

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/Franklyc/EchoMind.git
    ```

2.  **Load the Extension in Chrome:**

    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" in the top right corner.
    *   Click "Load unpacked".
    *   Select the `EchoMind` directory you just cloned.

3.  **Obtain API Keys:**

    *   **Groq:** [Groq Cloud](https://console.groq.com/playground)
    *   **Cerebras:** [Cerebras Cloud](https://cloud.cerebras.ai)
    *   **Google:** [Google AI Studio](https://aistudio.google.com/)

4.  **Configure API Keys:**

    *   Click the EchoMind extension icon in your Chrome toolbar.
    *   Click the "Settings" gear icon.
    *   Enter your Groq, Cerebras, and Google API keys in the respective fields.
    *   Click "Save Keys".

## Usage

1.  **Start Recording:**
    *   Navigate to the webpage with the audio you want to capture.
    *   Click the EchoMind extension icon.
    *   Select your desired transcription language (or leave it on "Auto" for automatic detection).
    *   Click the "Start" button. The button will change to indicate recording is in progress.

2.  **Stop Recording:**
    *   Click the "Stop" button. EchoMind will automatically send the recorded audio to Groq for transcription.

3.  **View Transcript:**
    *   The transcribed text will appear in the "Transcript" section.

4.  **Process with AI:**
    * **Choose an AI Model:** Select from the dropdown.
    *   Choose a "Processing Option":
        *   **Summarize:** Generates a summary of the transcript.
        *   **Answer Questions:** Prepares the AI to answer questions based on the transcript. You'll likely want to follow this up with a custom prompt.
        *   **Custom Prompt:** Enter your own instructions for the AI.
    *   (Optional) If you selected "Custom Prompt", enter your prompt in the "Custom Prompt" textarea.
    *   Click the "Process" button. The AI's output will appear in the "AI Output" section.

5. **Minimize/Restore:**
    * Click the minimize button on top right corner.
    * Click the microphone icon to restore the extension popup.

## Permissions Explained

*   **`activeTab`:** Required to access the currently active tab for audio capture.
*   **`storage`:** Used to store your API keys, selected AI model, and the transcribed text locally.
*   **`tabCapture`:** Enables capturing audio from the current tab.
*  **`host_permissions`**:
    *   `*://api.groq.com/*`: Allows the extension to communicate with the Groq API for transcription.
    *   `*://api.cerebras.ai/*`: Allows the extension to communicate with the Cerebras API for text processing.
    *   `*://generativelanguage.googleapis.com/*`: Allows the extension to communicate with the Google Generative Language API for text processing.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. Copyright (c) 2025 Franklyc.

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue. If you'd like to contribute code, please fork the repository and submit a pull request.

## Acknowledgements

*   This extension utilizes the powerful and fast Whisper model (developed by OpenAI) and served by [Groq](https://groq.com/).
*   AI processing is powered by Meta's Llama 3 model, hosted by [Cerebras](https://www.cerebras.ai/), and Google's Gemini model.
*   Font Awesome icons are used for a visually appealing UI.