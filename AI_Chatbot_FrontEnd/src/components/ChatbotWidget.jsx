import React, { useState, useRef, useEffect } from "react";
import "./ChatbotWidget.css";
export default function ChatbotWidget({ backendUrl = "/api/chatbot", defaultOpen = false }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, open]);

  const toggleOpen = () => setOpen((v) => !v);

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

  return (
    <div className="chat-container">
      <div className="chat-widget">
        <div className="chat-header" onClick={toggleOpen}>
          <div className="chat-title">Chatbot</div>
          <div className="chat-toggle">{open ? "–" : "+"}</div>
        </div>

        {open && (
          <div className="chat-body">
            <div ref={messagesRef} className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty">Chào! Gõ câu hỏi để bắt đầu.</div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.from === "user"
                      ? "msg-user"
                      : m.from === "bot"
                      ? "msg-bot"
                      : "msg-system"
                  }
                >
                  <div>{m.text}</div>

                  {m.from === "bot" && Array.isArray(m.data) && m.data.length > 0 && (
                    <div className="product-list">
                      {m.data.slice(0, 10).map((p) => (
                        <div className="product-card" key={p.id || p.sku || Math.random()}>
                          <div className="product-name">{p.name}</div>
                          <div className="product-meta">
                            {p.brand} • {p.category}
                          </div>
                          <div className="product-bottom">
                            <div className="product-price">{formatPrice(p.price)}</div>
                            <div className="product-stock">Còn: {p.stock ?? 0}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
