// Digital Assistant for Triet Website
class DigitalAssistant {
  constructor() {
    this.isOpen = false;
    this.conversationHistory = [];
    this.currentStep = "greeting";
    this.userData = {};
    this.profanityList = [];
    this.init();
  }

  init() {
    this.createChatbotHTML();
    this.bindEvents();
    this.loadConversationHistory();
    this.configureMarkdown();
    this.loadProfanityList();
  }

  configureMarkdown() {
    // Configure marked options if available
    if (typeof marked !== "undefined") {
      marked.setOptions({
        breaks: true, // Convert \n to <br>
        gfm: true, // GitHub Flavored Markdown
        sanitize: false, // Allow HTML (be careful with user input)
        smartLists: true,
        smartypants: false,
      });
    }
  }

  createChatbotHTML() {
    const chatbotHTML = `
            <div id="chatbot-container" class="chatbot-container">                <!-- Chatbot Toggle Button -->
                <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Open May">
                    <i class="fas fa-comments"></i>
                </button>

                <!-- Chatbot Widget -->
                <div id="chatbot-widget" class="chatbot-widget">
                    <div class="chatbot-header">
                        <div class="chatbot-header-info">
                            <div class="chatbot-avatar">
                                <img src="/images/bot.webp" alt="May" />
                            </div>                            <div class="chatbot-title">
                                <h4>May</h4>
                                <span class="chatbot-status">Online</span>
                            </div>
                        </div>                        <button id="chatbot-close" class="chatbot-close" aria-label="Close May">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="chatbot-messages" id="chatbot-messages">
                        <!-- Messages will be dynamically added here -->
                    </div>

                    <div class="chatbot-quick-actions" id="chatbot-quick-actions">
                        <!-- Quick action buttons will be added here -->
                    </div>

                    <div class="chatbot-input-area">
                        <div class="chatbot-input-container">
                            <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Type your message..." autocomplete="off">
                            <button id="chatbot-send" class="chatbot-send-btn" aria-label="Send message">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", chatbotHTML);
  }
  bindEvents() {
    const toggle = document.getElementById("chatbot-toggle");
    const close = document.getElementById("chatbot-close");
    const sendBtn = document.getElementById("chatbot-send");
    const input = document.getElementById("chatbot-input");

    toggle.addEventListener("click", () => this.toggleChatbot());
    close.addEventListener("click", () => this.closeChatbot());
    sendBtn.addEventListener("click", () => this.sendMessage());
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });

    // Clear chat history when leaving the page
    window.addEventListener("beforeunload", () => {
      this.clearConversationHistory();
    });

    // Auto-open after 3 seconds if first visit
    if (!localStorage.getItem("chatbot-visited")) {
      setTimeout(() => {
        this.showWelcomeMessage();
      }, 3000);
      localStorage.setItem("chatbot-visited", "true");
    }
  }

  toggleChatbot() {
    const widget = document.getElementById("chatbot-widget");
    const toggle = document.getElementById("chatbot-toggle");

    if (this.isOpen) {
      this.closeChatbot();
    } else {
      this.openChatbot();
    }
  }

  openChatbot() {
    const widget = document.getElementById("chatbot-widget");
    const toggle = document.getElementById("chatbot-toggle");

    widget.classList.add("active");
    toggle.classList.add("active");
    this.isOpen = true;

    // Hide notification badge
    const notification = toggle.querySelector(".chatbot-notification");
    if (notification) {
      notification.style.display = "none";
    }

    // Focus input
    setTimeout(() => {
      document.getElementById("chatbot-input").focus();
    }, 300);

    // Show welcome if no messages
    if (this.conversationHistory.length === 0) {
      this.showWelcomeMessage();
    }
  }

  closeChatbot() {
    const widget = document.getElementById("chatbot-widget");
    const toggle = document.getElementById("chatbot-toggle");

    widget.classList.remove("active");
    toggle.classList.remove("active");
    this.isOpen = false;
  }
  showWelcomeMessage() {
    const welcomeMessage = {
      type: "bot",
      content: `Hello! I'm May, your digital assistant. I'm currently in development and not fully functional yet. Please check back soon!`,
      timestamp: Date.now(),
    };

    this.addMessage(welcomeMessage);

    // Show notification badge if not open
    if (!this.isOpen) {
      const toggle = document.getElementById("chatbot-toggle");
      const notification = toggle.querySelector(".chatbot-notification");
      if (notification) {
        notification.style.display = "block";
      }
    }
  }

  addMessage(message) {
    this.conversationHistory.push(message);
    this.renderMessage(message);
    this.saveConversationHistory();
    this.scrollToBottom();
  }
  renderMessage(message) {
    const messagesContainer = document.getElementById("chatbot-messages");
    const messageElement = document.createElement("div");
    messageElement.className = `message ${message.type}`;

    const time = new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Parse markdown content if marked library is available
    let processedContent = message.content;
    if (typeof marked !== "undefined") {
      processedContent = marked.parse(message.content);
    }

    // Create proper message structure using the correct CSS classes
    messageElement.innerHTML = `
            <div class="message-content">
                ${processedContent}
                <div class="message-timestamp">${time}</div>
            </div>
        `;

    messagesContainer.appendChild(messageElement);
  }

  showQuickActions(actions) {
    const quickActionsContainer = document.getElementById(
      "chatbot-quick-actions",
    );
    quickActionsContainer.innerHTML = "";

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = "quick-action-btn";
      button.textContent = action.text;
      button.addEventListener("click", () =>
        this.handleQuickAction(action.action),
      );
      quickActionsContainer.appendChild(button);
    });

    quickActionsContainer.style.display = "flex";
  }

  hideQuickActions() {
    const quickActionsContainer = document.getElementById(
      "chatbot-quick-actions",
    );
    quickActionsContainer.style.display = "none";
  }
  handleQuickAction(action) {
    this.hideQuickActions();

    // Only handle function-type actions (like external links)
    if (typeof action === "function") {
      action();
    }
  }

  sendMessage() {
    const input = document.getElementById("chatbot-input");
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    this.addMessage({
      type: "user",
      content: message,
      timestamp: Date.now(),
    });

    input.value = "";
    this.hideQuickActions();

    // Process the message
    setTimeout(() => {
      this.processUserMessage(message);
    }, 500);
  }
  processUserMessage(message) {
    this.showTypingIndicator();

    // Check for profanity first
    if (this.containsProfanity(message)) {
      setTimeout(() => {
        this.hideTypingIndicator();
        const response = {
          type: "bot",
          content: `Hey, let's keep things professional here! I'm here to help with your digital needs in a respectful environment.`,
          timestamp: Date.now(),
        };
        this.addMessage(response);
      }, 1000);
      return;
    }

    // Generic "not available" response for any user input
    setTimeout(() => {
      this.hideTypingIndicator();
      const response = {
        type: "bot",
        content: `I'm sorry, but I'm not available for conversations yet. I'm still in development! Please check back soon when I'll be ready to help you with all your digital needs.`,
        timestamp: Date.now(),
      };
      this.addMessage(response);
    }, 1000);
  }
  containsProfanity(message) {
    // If profanity list hasn't loaded yet, skip check
    if (this.profanityList.length === 0) {
      return false;
    }

    const lowerMessage = message.toLowerCase();

    // Check for exact matches and partial matches
    return this.profanityList.some((word) => {
      // Check for whole word matches with word boundaries
      const regex = new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i",
      );
      return regex.test(lowerMessage);
    });
  }
  async loadProfanityList() {
    try {
      const response = await fetch("/data/profanity.json");
      if (response.ok) {
        this.profanityList = await response.json();
        console.log("Profanity filter loaded successfully");
      } else {
        console.warn(
          "Failed to load profanity filter data - Status:",
          response.status,
        );
        // Fallback to basic list if fetch fails
        this.profanityList = ["fuck", "shit", "damn", "bitch", "ass"];
      }
    } catch (error) {
      console.warn("Error loading profanity filter:", error);
      // Fallback to basic list if fetch fails
      this.profanityList = ["fuck", "shit", "damn", "bitch", "ass"];
    }
  }
  handleGreeting() {
    this.hideTypingIndicator();
    this.addMessage(response);
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById("chatbot-messages");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  saveConversationHistory() {
    localStorage.setItem(
      "chatbot-history",
      JSON.stringify(this.conversationHistory),
    );
  }

  loadConversationHistory() {
    const saved = localStorage.getItem("chatbot-history");
    if (saved) {
      this.conversationHistory = JSON.parse(saved);
      this.conversationHistory.forEach((message) =>
        this.renderMessage(message),
      );
    }
  }
  clearConversationHistory() {
    localStorage.removeItem("chatbot-history");
    this.conversationHistory = [];
  }

  // Typing Indicator Methods
  showTypingIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");
    const typingElement = document.createElement("div");
    typingElement.className = "chatbot-message bot-message typing-indicator";
    typingElement.id = "typing-indicator";

    typingElement.innerHTML = `
            <div class="message-avatar"></div>
            <div class="message-bubble">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
    messagesContainer.appendChild(typingElement);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingElement = document.getElementById("typing-indicator");
    if (typingElement) {
      typingElement.remove();
    }
  }
}

// Initialize the chatbot when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new DigitalAssistant();
});
