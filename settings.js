document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById("backBtn");
    backBtn.addEventListener("click", () => {
        window.close();
    });

    const saveApiKeysBtn = document.getElementById("saveApiKeys");
    const groqApiKeyInput = document.getElementById("groqApiKey");
    const cerebrasApiKeyInput = document.getElementById("cerebrasApiKey");
    const geminiApiKeyInput = document.getElementById("geminiApiKey"); // Add Gemini input
    const apiKeyStatus = document.getElementById("apiKeyStatus");

    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function(event) {
            const targetId = this.dataset.target;
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Load saved API keys
    chrome.storage.local.get(["groqApiKey", "cerebrasApiKey", "geminiApiKey"], (data) => {
        if (data.groqApiKey) groqApiKeyInput.value = data.groqApiKey;
        if (data.cerebrasApiKey) cerebrasApiKeyInput.value = data.cerebrasApiKey;
        if (data.geminiApiKey) geminiApiKeyInput.value = data.geminiApiKey; // Load Gemini key
    });

    saveApiKeysBtn.addEventListener("click", async () => {
        const groqKey = groqApiKeyInput.value.trim();
        const cerebrasKey = cerebrasApiKeyInput.value.trim();
        const geminiKey = geminiApiKeyInput.value.trim(); // Get Gemini Key

        if (!groqKey || !cerebrasKey || !geminiKey) {
            apiKeyStatus.textContent = "Please enter all API keys.";
            apiKeyStatus.classList.add("error");
            return;
        }

        try {
            await chrome.storage.local.set({
                groqApiKey: groqKey,
                cerebrasApiKey: cerebrasKey,
                geminiApiKey: geminiKey
            }); // Save Gemini key
            apiKeyStatus.textContent = "API Keys saved successfully.";
            apiKeyStatus.classList.remove("error");
            setTimeout(() => {
                apiKeyStatus.textContent = "";
            }, 3000);
        } catch (error) {
            apiKeyStatus.textContent = "Error saving API keys.";
            apiKeyStatus.classList.add("error");
        }
    });
});