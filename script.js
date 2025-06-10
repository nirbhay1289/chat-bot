document.addEventListener("DOMContentLoaded", function () {
    const chatbotIcon = document.getElementById("chatbot-icon");
    const chatbotContainer = document.getElementById("chatbot-container");
    const closeBtn = document.getElementById("close-btn");
    const sendBtn = document.getElementById("send-btn");
    const micBtn = document.getElementById("mic-btn");
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotMessages = document.getElementById("chatbot-messages");
    const responseToggle = document.getElementById("response-length-toggle");
    const apiSelect = document.getElementById("api-select");
    const deleteBtn = document.getElementById("delete-history-btn");

    let chatHistory = [];

    chatbotIcon.addEventListener("click", () => chatbotContainer.classList.remove("hidden"));
    closeBtn.addEventListener("click", () => chatbotContainer.classList.add("hidden"));
    deleteBtn.addEventListener("click", () => {
        chatHistory = [];
        chatbotMessages.innerHTML = "";
    });

    sendBtn.addEventListener("click", handleSend);
    chatbotInput.addEventListener("keypress", e => {
        if (e.key === "Enter") handleSend();
    });

    micBtn.addEventListener("click", () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.start();

        recognition.onresult = function (event) {
            chatbotInput.value = event.results[0][0].transcript;
        };
    });

    async function handleSend() {
        const userInput = chatbotInput.value.trim();
        if (!userInput) return;
        
        appendMessage("user", userInput);
        chatbotInput.value = "";
        simulateTyping();
        
        try {
            const reply = await generateResponse(userInput);
            appendMessage("bot", reply);
            speak(reply);
        } catch (error) {
            appendMessage("bot", "Sorry, I encountered an error. Please try again.");
            console.error("Error:", error);
        }
    }

    function simulateTyping() {
        const typingDiv = document.createElement("div");
        typingDiv.className = "message bot typing";
        typingDiv.innerHTML = `<div class="typing-animation">
            <span></span><span></span><span></span>
        </div>`;
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        setTimeout(() => {
            typingDiv.remove();
        }, 1500);
    }

    function appendMessage(sender, message) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}`;

        if (sender === "bot") {
            messageDiv.innerHTML = `
                <ul>
                    <li><strong>Response:</strong></li>
                </ul>
                <p>${message}</p>
            `;
        } else {
            messageDiv.textContent = message;
        }

        messageDiv.addEventListener("click", () => {
            chatbotInput.value = messageDiv.innerText || messageDiv.textContent;
            chatbotInput.focus();
        });

        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        
        // Save to chat history
        chatHistory.push({ sender, message, timestamp: new Date().toISOString() });
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        speechSynthesis.speak(utterance);
    }

    async function generateResponse(userMessage) {
        const selectedApi = apiSelect.value;
        const isLong = responseToggle.checked;
        
        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + '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'
                },
                body: JSON.stringify({
                    model: "mixtral-8x7b-instruct",
                    messages: [
                        {
                            role: "user",
                            content: userMessage
                        }
                    ],
                    max_tokens: isLong ? 150 : 50,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error:', error);
            return "I'm sorry, I'm having trouble connecting to the API. Error details: " + error.message;
        }
    }
});