document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById("backBtn");
    backBtn.addEventListener("click", () => {
       window.close();
    });

    const saveApiKeysBtn = document.getElementById("saveApiKeys");
    const groqApiKeyInput = document.getElementById("groqApiKey");
    const cerebrasApiKeyInput = document.getElementById("cerebrasApiKey");
    const apiKeyStatus = document.getElementById("apiKeyStatus");

    document.querySelectorAll('.toggle-password').forEach(button => {
      button.addEventListener('click', function (event) {
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

    chrome.storage.local.get(["groqApiKey", "cerebrasApiKey"], (data) => {
      if (data.groqApiKey) groqApiKeyInput.value = data.groqApiKey;
      if (data.cerebrasApiKey) cerebrasApiKeyInput.value = data.cerebrasApiKey;
    });

    saveApiKeysBtn.addEventListener("click", async () => {
      const groqKey = groqApiKeyInput.value.trim();
      const cerebrasKey = cerebrasApiKeyInput.value.trim();

      if (!groqKey || !cerebrasKey) {
        apiKeyStatus.textContent = "Please enter both API keys.";
        apiKeyStatus.classList.add("error");
        return;
      }

      try {
        await chrome.storage.local.set({ groqApiKey: groqKey, cerebrasApiKey: cerebrasKey });
        apiKeyStatus.textContent = "API Keys saved successfully.";
        apiKeyStatus.classList.remove("error");
        setTimeout(() => { apiKeyStatus.textContent = ""; }, 3000);
      } catch (error) {
        apiKeyStatus.textContent = "Error saving API keys.";
        apiKeyStatus.classList.add("error");
      }
    });
});
