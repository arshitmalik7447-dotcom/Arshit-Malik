/**
 * Tiona Assistant - Embeddable Customer Support & Product Enquiry Widget
 * Encapsulated via Web Component & Shadow DOM to prevent CSS conflicts on WordPress/Elementor sites.
 */

(function () {
  if (customElements.get('tiona-assistant-widget')) {
    return;
  }

  // Detect script source to automatically configure the API base URL
  const currentScript = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const configuredApiBase = currentScript ? currentScript.getAttribute('data-api') : '';
  const API_BASE = configuredApiBase ? configuredApiBase.replace(/\/$/, '') : window.location.origin;

  class TionaAssistantWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.isOpen = false;
      this.sessionId = null;
      this.messages = [];
      this.isSubmitting = false;
      this.enquiryModalOpen = false;
      this.prefilledProduct = null;
      this.config = {
        brand: 'Tiona Silver',
        bot_name: 'Tiona Assistant',
        phone: '+91 98115 09777',
        whatsapp_url: 'https://wa.me/919811509777',
        quick_actions: ['Find jewellery', 'Ask about a product', 'Delivery and returns', 'Send an enquiry', 'WhatsApp the team']
      };
    }

    connectedCallback() {
      this.initSession();
      this.render();
      this.addInitialGreeting();
    }

    async initSession() {
      try {
        const stored = sessionStorage.getItem('tiona_session_id');
        if (stored) {
          this.sessionId = stored;
        } else {
          const res = await fetch(`${API_BASE}/api/sessions`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            this.sessionId = data.session_id;
            sessionStorage.setItem('tiona_session_id', this.sessionId);
          }
        }
      } catch (err) {
        console.warn('[Tiona Widget] Session initialization error:', err);
      }
    }

    addInitialGreeting() {
      this.messages.push({
        role: 'assistant',
        content: 'Hi! I’m Tiona Assistant. I can help you explore our jewellery, check website information, or send an enquiry to our team. What are you looking for?',
        follow_up: 'Tap a quick topic below or type your question.'
      });
      this.updateChatUI();
    }

    toggleWidget() {
      this.isOpen = !this.isOpen;
      const windowEl = this.shadowRoot.querySelector('.chat-window');
      const launcherBtn = this.shadowRoot.querySelector('.launcher-btn');
      if (this.isOpen) {
        windowEl.classList.add('active');
        launcherBtn.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
          const input = this.shadowRoot.querySelector('#chat-input');
          if (input) input.focus();
        }, 200);
      } else {
        windowEl.classList.remove('active');
        launcherBtn.setAttribute('aria-expanded', 'false');
      }
    }

    async sendMessage(text) {
      if (!text || !text.trim() || this.isSubmitting) return;
      const queryText = text.trim();

      this.messages.push({ role: 'user', content: queryText });
      this.updateChatUI();

      this.isSubmitting = true;
      this.showTypingIndicator(true);

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.sessionId,
            message: queryText,
            history: this.messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
          })
        });

        const data = await res.json();
        this.showTypingIndicator(false);
        this.isSubmitting = false;

        this.messages.push({
          role: 'assistant',
          content: data.reply || 'I couldn’t confirm that from Tiona Silver’s website. Would you like to ask the team on WhatsApp or send an enquiry?',
          recommended_products: data.recommended_products,
          source_links: data.source_links,
          follow_up: data.follow_up
        });

        this.updateChatUI();
      } catch (err) {
        this.showTypingIndicator(false);
        this.isSubmitting = false;
        this.messages.push({
          role: 'assistant',
          content: 'I couldn’t reach the server right now. You can connect with our team directly on WhatsApp or call +91 98115 09777.',
          source_links: [{ title: 'WhatsApp Team', url: 'https://wa.me/919811509777' }]
        });
        this.updateChatUI();
      }
    }

    showTypingIndicator(show) {
      const container = this.shadowRoot.querySelector('#typing-indicator');
      if (container) {
        container.style.display = show ? 'flex' : 'none';
        this.scrollToBottom();
      }
    }

    scrollToBottom() {
      const body = this.shadowRoot.querySelector('.chat-body');
      if (body) {
        body.scrollTop = body.scrollHeight;
      }
    }

    openEnquiryModal(product = null) {
      this.prefilledProduct = product;
      const modal = this.shadowRoot.querySelector('.enquiry-modal');
      if (modal) {
        const prodBanner = this.shadowRoot.querySelector('#modal-product-banner');
        if (product) {
          prodBanner.style.display = 'block';
          prodBanner.innerHTML = `Referencing: <strong>${product.name}</strong> (₹${(product.price_minor / 100).toLocaleString('en-IN')})`;
        } else {
          prodBanner.style.display = 'none';
        }
        modal.classList.add('open');
      }
    }

    closeEnquiryModal() {
      const modal = this.shadowRoot.querySelector('.enquiry-modal');
      if (modal) {
        modal.classList.remove('open');
      }
    }

    async submitEnquiryForm(e) {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value.trim();
      const reply_method = form.reply_method.value;
      const reply_value = form.reply_value.value.trim();
      const enquiry_type = form.enquiry_type.value;
      const message = form.message.value.trim();
      const order_reference = form.order_reference.value.trim() || null;
      const consent = form.consent.checked;

      const submitBtn = form.querySelector('button[type="submit"]');
      const errBox = this.shadowRoot.querySelector('#enquiry-error');
      errBox.style.display = 'none';

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving enquiry...';

      try {
        const res = await fetch(`${API_BASE}/api/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            reply_method,
            reply_value,
            enquiry_type,
            message,
            product_id: this.prefilledProduct ? this.prefilledProduct.id : null,
            product_name: this.prefilledProduct ? this.prefilledProduct.name : null,
            product_url: this.prefilledProduct ? this.prefilledProduct.permalink : null,
            order_reference,
            consent_given: consent,
            session_id: this.sessionId,
            idempotency_key: `${this.sessionId}-${Date.now()}`
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Submission failed');
        }

        this.closeEnquiryModal();
        form.reset();

        this.messages.push({
          role: 'assistant',
          content: `Thank you, ${name}! Your enquiry has been recorded under reference **${data.reference}**. Our team will review your message and reply via ${reply_method === 'email' ? 'email' : 'WhatsApp'} within our estimated 24-hour response window.`
        });
        this.updateChatUI();
      } catch (err) {
        errBox.textContent = err.message || 'Could not submit enquiry. Please WhatsApp us at +91 98115 09777.';
        errBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send enquiry';
      }
    }

    updateChatUI() {
      const messagesContainer = this.shadowRoot.querySelector('.chat-messages');
      if (!messagesContainer) return;

      messagesContainer.innerHTML = '';

      this.messages.forEach((msg) => {
        const msgEl = document.createElement('div');
        msgEl.className = `message ${msg.role}`;

        let html = `<div class="bubble">${this.formatMarkdown(msg.content)}</div>`;

        // Render product cards if available
        if (msg.recommended_products && msg.recommended_products.length > 0) {
          html += `<div class="product-cards-scroll">`;
          msg.recommended_products.forEach((prod) => {
            const price = (prod.price_minor / 100).toLocaleString('en-IN');
            const imgSrc = prod.images && prod.images[0] ? prod.images[0].src : '';
            html += `
              <div class="product-card">
                ${imgSrc ? `<img src="${imgSrc}" alt="${prod.name}" onerror="this.style.display='none'" />` : ''}
                <div class="product-card-body">
                  <div class="product-title">${prod.name}</div>
                  <div class="product-price">₹${price}</div>
                  <div class="product-theme">${prod.design_theme || '925 Sterling Silver'}</div>
                  <div class="product-actions">
                    <a href="${prod.permalink}" target="_blank" rel="noopener" class="btn-product view">View product</a>
                    <button type="button" class="btn-product enquire" data-id="${prod.id}">Enquire</button>
                  </div>
                </div>
              </div>
            `;
          });
          html += `</div>`;
        }

        // Render source links if available
        if (msg.source_links && msg.source_links.length > 0) {
          html += `<div class="source-links">`;
          msg.source_links.forEach((link) => {
            html += `<a href="${link.url}" target="_blank" rel="noopener">📄 ${link.title}</a>`;
          });
          html += `</div>`;
        }

        if (msg.follow_up) {
          html += `<div class="follow-up-hint"><em>${msg.follow_up}</em></div>`;
        }

        msgEl.innerHTML = html;

        // Attach enquire button event handlers
        msgEl.querySelectorAll('.btn-product.enquire').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const prodId = Number(e.currentTarget.getAttribute('data-id'));
            const found = msg.recommended_products.find((p) => p.id === prodId);
            this.openEnquiryModal(found);
          });
        });

        messagesContainer.appendChild(msgEl);
      });

      this.scrollToBottom();
    }

    formatMarkdown(text) {
      if (!text) return '';
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --primary: #0F4C3A;
            --primary-hover: #0B3D2E;
            --accent: #E2E8F0;
            --silver: #C0C7CD;
            --text-dark: #1A202C;
            --text-muted: #4A5568;
            --bg-light: #F8FAFC;
            --white: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: var(--text-dark);
            z-index: 999999;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          /* Floating Launcher Button */
          .launcher-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
          }

          .launcher-btn {
            background-color: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 9999px;
            min-height: 52px;
            padding: 0 20px 0 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 14px rgba(15, 76, 58, 0.35);
            cursor: pointer;
            transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
            font-size: 15px;
            font-weight: 600;
          }

          .launcher-btn:hover {
            background-color: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(15, 76, 58, 0.45);
          }

          .launcher-btn:focus-visible {
            outline: 3px solid #68D391;
            outline-offset: 2px;
          }

          .launcher-icon {
            width: 24px;
            height: 24px;
            fill: currentColor;
          }

          /* Main Chat Window */
          .chat-window {
            position: fixed;
            bottom: 90px;
            right: 24px;
            width: 380px;
            max-width: calc(100vw - 32px);
            height: 600px;
            max-height: calc(100vh - 120px);
            background: var(--white);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.08);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #E2E8F0;
            opacity: 0;
            transform: translateY(20px) scale(0.96);
            pointer-events: none;
            transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 999999;
          }

          .chat-window.active {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
          }

          /* Header */
          .chat-header {
            background-color: var(--primary);
            color: var(--white);
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .header-info {
            display: flex;
            flex-direction: column;
          }

          .header-title {
            font-size: 16px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .online-badge {
            width: 8px;
            height: 8px;
            background-color: #48BB78;
            border-radius: 50%;
            display: inline-block;
          }

          .header-tagline {
            font-size: 12px;
            color: #CBD5E0;
          }

          .header-controls {
            display: flex;
            gap: 8px;
          }

          .header-btn {
            background: transparent;
            border: none;
            color: var(--white);
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
          }

          .header-btn:hover {
            background: rgba(255, 255, 255, 0.15);
          }

          /* Quick Actions Bar */
          .quick-actions-bar {
            background: #EDF2F7;
            padding: 8px 12px;
            display: flex;
            gap: 6px;
            overflow-x: auto;
            white-space: nowrap;
            scrollbar-width: none;
            border-bottom: 1px solid #E2E8F0;
          }

          .quick-actions-bar::-webkit-scrollbar {
            display: none;
          }

          .quick-pill {
            background: var(--white);
            border: 1px solid #CBD5E0;
            border-radius: 12px;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 500;
            color: var(--primary);
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
          }

          .quick-pill:hover {
            background: #E6FFFA;
            border-color: var(--primary);
          }

          /* Chat Body */
          .chat-body {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background-color: var(--bg-light);
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .message {
            display: flex;
            flex-direction: column;
            max-width: 88%;
          }

          .message.user {
            align-self: flex-end;
          }

          .message.assistant {
            align-self: flex-start;
          }

          .bubble {
            padding: 10px 14px;
            border-radius: 14px;
            line-height: 1.5;
            font-size: 13.5px;
          }

          .message.user .bubble {
            background-color: var(--primary);
            color: var(--white);
            border-bottom-right-radius: 2px;
          }

          .message.assistant .bubble {
            background-color: var(--white);
            color: var(--text-dark);
            border: 1px solid #E2E8F0;
            border-bottom-left-radius: 2px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          }

          .source-links {
            margin-top: 6px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            font-size: 11.5px;
          }

          .source-links a {
            color: #2B6CB0;
            text-decoration: none;
            background: #EBF8FF;
            padding: 2px 8px;
            border-radius: 4px;
          }

          .source-links a:hover {
            text-decoration: underline;
          }

          .follow-up-hint {
            font-size: 11.5px;
            color: var(--text-muted);
            margin-top: 4px;
          }

          /* Product Cards Scroll in Chat */
          .product-cards-scroll {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 8px 2px 4px 2px;
            margin-top: 8px;
            width: 100%;
          }

          .product-card {
            min-width: 190px;
            max-width: 210px;
            background: var(--white);
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
          }

          .product-card img {
            width: 100%;
            height: 110px;
            object-fit: cover;
            background: #F7FAFC;
          }

          .product-card-body {
            padding: 8px 10px 10px 10px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .product-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-dark);
            line-height: 1.3;
            margin-bottom: 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .product-price {
            font-size: 13px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 2px;
          }

          .product-theme {
            font-size: 11px;
            color: #718096;
            margin-bottom: 8px;
          }

          .product-actions {
            display: flex;
            gap: 6px;
            margin-top: auto;
          }

          .btn-product {
            flex: 1;
            padding: 5px 6px;
            font-size: 11px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            display: inline-block;
          }

          .btn-product.view {
            background: #EDF2F7;
            color: var(--text-dark);
            border: 1px solid #CBD5E0;
          }

          .btn-product.enquire {
            background: var(--primary);
            color: var(--white);
            border: none;
          }

          /* Typing Indicator */
          #typing-indicator {
            display: none;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            background: var(--white);
            border-radius: 12px;
            border: 1px solid #E2E8F0;
            width: fit-content;
          }

          .dot {
            width: 6px;
            height: 6px;
            background: #A0AEC0;
            border-radius: 50%;
            animation: blink 1.4s infinite both;
          }

          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }

          @keyframes blink {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1.1); }
          }

          /* Input Footer */
          .chat-footer {
            padding: 12px;
            background: var(--white);
            border-top: 1px solid #E2E8F0;
            display: flex;
            gap: 8px;
          }

          .chat-input {
            flex: 1;
            padding: 10px 14px;
            border: 1px solid #CBD5E0;
            border-radius: 24px;
            font-size: 13.5px;
            outline: none;
            transition: border-color 0.15s;
          }

          .chat-input:focus {
            border-color: var(--primary);
          }

          .send-btn {
            background: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.15s;
          }

          .send-btn:hover {
            background: var(--primary-hover);
          }

          /* Enquiry Modal Overlay */
          .enquiry-modal {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 16px;
          }

          .enquiry-modal.open {
            display: flex;
          }

          .enquiry-content {
            background: var(--white);
            width: 100%;
            max-height: 90%;
            border-radius: 12px;
            padding: 18px;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }

          .enquiry-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .enquiry-header h3 {
            font-size: 16px;
            color: var(--primary);
          }

          .form-group {
            margin-bottom: 10px;
          }

          .form-group label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--text-dark);
          }

          .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 8px 10px;
            font-size: 13px;
            border: 1px solid #CBD5E0;
            border-radius: 6px;
            outline: none;
          }

          .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            border-color: var(--primary);
          }

          .consent-box {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin: 12px 0;
            font-size: 11.5px;
            color: var(--text-muted);
          }

          .btn-submit-enquiry {
            width: 100%;
            padding: 10px;
            background: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }

          .error-banner {
            color: #C53030;
            background: #FFF5F5;
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 8px;
            display: none;
          }

          #modal-product-banner {
            background: #F0FFF4;
            border: 1px solid #C6F6D5;
            color: #22543D;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            margin-bottom: 10px;
            display: none;
          }

          @media (max-width: 480px) {
            .chat-window {
              bottom: 0;
              right: 0;
              width: 100vw;
              height: 100vh;
              max-height: 100vh;
              border-radius: 0;
            }
            .launcher-container {
              bottom: 16px;
              right: 16px;
            }
          }
        </style>

        <div class="launcher-container">
          <button class="launcher-btn" aria-label="Open Tiona Assistant Chat" aria-expanded="false">
            <svg class="launcher-icon" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <span>Tiona Assistant</span>
          </button>
        </div>

        <div class="chat-window">
          <div class="chat-header">
            <div class="header-info">
              <div class="header-title">
                <span class="online-badge"></span>
                <span>Tiona Assistant</span>
              </div>
              <div class="header-tagline">The Silver That Defines You</div>
            </div>
            <div class="header-controls">
              <button class="header-btn close-btn" aria-label="Close Chat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="quick-actions-bar">
            <button class="quick-pill" data-query="Find jewellery">Find jewellery</button>
            <button class="quick-pill" data-query="Ask about a product">Ask about a product</button>
            <button class="quick-pill" data-query="Delivery and returns">Delivery & returns</button>
            <button class="quick-pill" data-action="enquire">Send enquiry</button>
            <a class="quick-pill" href="https://wa.me/919811509777" target="_blank" rel="noopener">WhatsApp team</a>
          </div>

          <div class="chat-body">
            <div class="chat-messages"></div>
            <div id="typing-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>

          <div class="chat-footer">
            <input type="text" id="chat-input" class="chat-input" placeholder="Type in English, Hindi, or Hinglish..." />
            <button class="send-btn" id="send-btn" aria-label="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>

          <!-- Enquiry Modal Form -->
          <div class="enquiry-modal">
            <div class="enquiry-content">
              <div class="enquiry-header">
                <h3>Send an Enquiry</h3>
                <button type="button" class="header-btn close-modal-btn" style="color: #4A5568;">✕</button>
              </div>

              <div id="modal-product-banner"></div>
              <div id="enquiry-error" class="error-banner"></div>

              <form id="enquiry-form">
                <div class="form-group">
                  <label>Your Name *</label>
                  <input type="text" name="name" required placeholder="e.g. Priya Sharma" />
                </div>

                <div class="form-group">
                  <label>Reply via *</label>
                  <select name="reply_method">
                    <option value="email">Email</option>
                    <option value="phone_whatsapp">Phone / WhatsApp</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Email or WhatsApp Number *</label>
                  <input type="text" name="reply_value" required placeholder="e.g. priya@example.com or +91 98765 43210" />
                </div>

                <div class="form-group">
                  <label>Enquiry Type *</label>
                  <select name="enquiry_type">
                    <option value="Product enquiry">Product enquiry</option>
                    <option value="Order support">Order support (handoff to team)</option>
                    <option value="Piercing enquiry">Piercing enquiry</option>
                    <option value="Bulk/wholesale">Bulk / wholesale</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other Tiona-related enquiry">Other Tiona-related enquiry</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Order Reference (optional)</label>
                  <input type="text" name="order_reference" placeholder="e.g. #TS-1042 (if applicable)" />
                </div>

                <div class="form-group">
                  <label>Message *</label>
                  <textarea name="message" rows="3" required placeholder="How can our team help you?"></textarea>
                </div>

                <div class="consent-box">
                  <input type="checkbox" name="consent" id="consent-check" required />
                  <label for="consent-check">I consent to Tiona Silver contacting me regarding this specific enquiry. (No marketing spam or payment details collected).</label>
                </div>

                <button type="submit" class="btn-submit-enquiry">Send enquiry</button>
              </form>
            </div>
          </div>
        </div>
      `;

      // Event Listeners
      const launcher = this.shadowRoot.querySelector('.launcher-btn');
      launcher.addEventListener('click', () => this.toggleWidget());

      const closeBtn = this.shadowRoot.querySelector('.close-btn');
      closeBtn.addEventListener('click', () => this.toggleWidget());

      const input = this.shadowRoot.querySelector('#chat-input');
      const sendBtn = this.shadowRoot.querySelector('#send-btn');

      const triggerSend = () => {
        const val = input.value;
        input.value = '';
        this.sendMessage(val);
      };

      sendBtn.addEventListener('click', triggerSend);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerSend();
      });

      // Quick actions
      this.shadowRoot.querySelectorAll('.quick-pill[data-query]').forEach((pill) => {
        pill.addEventListener('click', (e) => {
          const query = e.currentTarget.getAttribute('data-query');
          this.sendMessage(query);
        });
      });

      const enquiryPill = this.shadowRoot.querySelector('.quick-pill[data-action="enquire"]');
      if (enquiryPill) {
        enquiryPill.addEventListener('click', () => this.openEnquiryModal());
      }

      // Modal
      const closeModalBtn = this.shadowRoot.querySelector('.close-modal-btn');
      closeModalBtn.addEventListener('click', () => this.closeEnquiryModal());

      const enquiryForm = this.shadowRoot.querySelector('#enquiry-form');
      enquiryForm.addEventListener('submit', (e) => this.submitEnquiryForm(e));
    }
  }

  customElements.define('tiona-assistant-widget', TionaAssistantWidget);

  // Auto-mount widget element to DOM
  const widgetEl = document.createElement('tiona-assistant-widget');
  document.body.appendChild(widgetEl);
})();
