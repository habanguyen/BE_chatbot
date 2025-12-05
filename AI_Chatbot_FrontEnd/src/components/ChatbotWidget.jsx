import React, { useState, useRef, useEffect } from "react";
import "./ChatbotWidget.css";

export default function ChatbotWidget({ backendUrl = "/api/chatbot", defaultOpen = false, avatarUrl = null, width = 320 }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, open]);

  const toggleOpen = () => setOpen((v) => !v);

  // When widget is opened for the first time (no messages), request a welcome/greeting
  useEffect(() => {
    let cancelled = false;
    async function fetchWelcome() {
      try {
        setLoading(true);
        const res = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "chào" }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        const data = await res.json();
        if (cancelled) return;
        const botReply = (data && data.reply) || "(Không có phản hồi)";
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setMessages((m) => [...m, { from: "bot", text: botReply, data: data.data }]);
        } else {
          setMessages((m) => [...m, { from: "bot", text: botReply }]);
        }
      } catch (err) {
        console.error("ChatbotWidget welcome error:", err);
        setMessages((m) => [...m, { from: "system", text: "Lỗi khi kết nối server: " + err.message }]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (open && messages.length === 0) {
      fetchWelcome();
    }

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function sendMessage(rawText) {
    const text = String(rawText || "").trim();
    if (!text) return;

    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }

      const data = await res.json();
      const botReply = (data && data.reply) || "(Không có phản hồi)";

      if (data && Array.isArray(data.data) && data.data.length > 0) {
        setMessages((m) => [...m, { from: "bot", text: botReply, data: data.data }]);
      } else {
        setMessages((m) => [...m, { from: "bot", text: botReply }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { from: "system", text: "Lỗi server: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

// tiny default avatar (robot) as data URL
const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24'><rect rx='4' width='24' height='24' fill='%230b79d0'/><circle cx='8.5' cy='9' r='1.2' fill='%23fff'/><circle cx='15.5' cy='9' r='1.2' fill='%23fff'/><rect x='9' y='14' width='6' height='1.6' rx='0.8' fill='%23fff'/></svg>`;

// Avatar priority: avatarUrl (props) → public `/avatar_chatbot.svg` → public `/avatar_chatbot.png` → inline SVG fallback
const avatar = avatarUrl || '/avatar_chatbot.svg' || '/avatar_chatbot.png' || defaultAvatar;


  return (
    <div className="chat-container">
      <div className="chat-widget" style={{ width: width }}>
        <div className="chat-header" onClick={toggleOpen}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={avatar} alt="bot" className="chat-header-avatar" />
            <div className="chat-title">Trợ lý AI</div>
          </div>
          <div className="chat-toggle">{open ? "–" : "+"}</div>
        </div>

        {open && (
          <div className="chat-body">
            <div ref={messagesRef} className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty">Chào! Gõ câu hỏi để bắt đầu.</div>
              )}

              {messages.map((m, i) => (
                m.from === 'bot' ? (
                  <div key={i} className="msg-row-bot">
                    <img src={avatar} alt="bot" className="msg-avatar" />
                    <div className="msg-bubble-bot">
                      <div>{m.text}</div>
                      {Array.isArray(m.data) && m.data.length > 0 && (
                        <div className="product-list">
                          {m.data.slice(0, 10).map((p) => (
                            <div className="product-card" key={p.id || p.sku || Math.random()}>
                              <div className="product-name">{p.name}</div>
                              <div className="product-meta">{p.brand} • {p.category}</div>
                              <div className="product-bottom">
                                <div className="product-price">{formatPrice(p.price)}</div>
                                <div className="product-stock">Còn: {p.stock ?? 0}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : m.from === 'user' ? (
                  <div key={i} className="msg-user">
                    <div>{m.text}</div>
                  </div>
                ) : (
                  <div key={i} className="msg-system">
                    <div>{m.text}</div>
                  </div>
                )
              ))}

              {loading && <div className="typing">Bot đang trả lời...</div>}
            </div>

            <form onSubmit={handleSubmit} className="chat-form">
              <input
                placeholder="Nhập câu hỏi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="chat-input"
              />
              <button className="chat-send" disabled={loading || !input.trim()}>
                Gửi
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPrice(v) {
  try {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);
  } catch (e) {
    return String(v);
  }
}
