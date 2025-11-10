import React, { useState, useRef, useEffect } from "react";

export default function ChatbotWidget({ backendUrl = "http://localhost:3000/api/chatbot", defaultOpen = false }) {
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
      // If backend returns structured data (suggestions), attach it to the bot message
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        setMessages((m) => [...m, { from: "bot", text: botReply, data: data.data }]);
      } else {
        setMessages((m) => [...m, { from: "bot", text: botReply }]);
      }
    } catch (err) {
      console.error("ChatbotWidget send error:", err);
      setMessages((m) => [...m, { from: "system", text: "Lỗi khi kết nối server: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div style={containerStyle}>
      <div style={widgetStyle}>
        <div style={headerStyle} onClick={toggleOpen}>
          <div style={{ fontWeight: "bold" }}>Chatbot</div>
          <div style={{ fontSize: 12 }}>{open ? "–" : "+"}</div>
        </div>

        {open && (
          <div style={bodyStyle}>
            <div ref={messagesRef} style={messagesStyle}>
              {messages.length === 0 && <div style={emptyStyle}>Chào! Gõ câu hỏi để bắt đầu.</div>}
              {messages.map((m, idx) => (
                <div key={idx} style={m.from === "user" ? userMsgStyle : m.from === "bot" ? botMsgStyle : systemMsgStyle}>
                  <div>{m.text}</div>
                  {m.from === 'bot' && Array.isArray(m.data) && m.data.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {m.data.slice(0, 10).map((p) => (
                        <div key={p.id || p.sku || Math.random()} style={prodCardStyle}>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{p.brand} • {p.category}</div>
                          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700 }}>{p.price ? formatPrice(p.price) : ''}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>Còn: {p.stock ?? 0}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && <div style={typingStyle}>Bot đang trả lời...</div>}
            </div>

            <form onSubmit={handleSubmit} style={formStyle}>
              <input
                aria-label="message"
                placeholder="Nhập câu hỏi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={inputStyle}
                disabled={loading}
              />
              <button type="submit" style={sendBtnStyle} disabled={loading || !input.trim()}>
                Gửi
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const containerStyle = { position: "fixed", right: 20, bottom: 20, zIndex: 1000 };
const widgetStyle = { width: 320, boxShadow: "0 6px 18px rgba(0,0,0,0.15)", borderRadius: 8, overflow: "hidden", fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif" };
const headerStyle = { background: "#0b79d0", color: "white", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" };
const bodyStyle = { background: "white", maxHeight: 420, display: "flex", flexDirection: "column" };
const messagesStyle = { padding: 12, overflowY: "auto", flex: 1 };
const emptyStyle = { color: "#666", fontSize: 13 };
const userMsgStyle = { alignSelf: "flex-end", background: "#e6f2ff", padding: "8px 10px", borderRadius: 10, margin: "6px 0", maxWidth: "80%" };
const botMsgStyle = { alignSelf: "flex-start", background: "#f1f1f1", padding: "8px 10px", borderRadius: 10, margin: "6px 0", maxWidth: "80%" };
const systemMsgStyle = { alignSelf: "center", background: "#fff3cd", padding: "6px 8px", borderRadius: 6, margin: "6px 0", fontSize: 12 };
const typingStyle = { color: "#666", fontStyle: "italic", fontSize: 13, marginTop: 6 };
const formStyle = { display: "flex", padding: 8, borderTop: "1px solid #eee" };
const inputStyle = { flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", marginRight: 8 };
const sendBtnStyle = { background: "#0b79d0", color: "white", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" };
const prodCardStyle = { border: '1px solid #eee', padding: 8, borderRadius: 6, marginBottom: 8, background: '#fff' };

function formatPrice(v) {
  try {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  } catch (e) {
    return String(v);
  }
}
