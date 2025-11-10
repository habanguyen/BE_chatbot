import React from 'react'
import ChatbotWidget from './components/ChatbotWidget'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1> Shop Giày Demo</h1>
        <p>Gõ câu hỏi vào chatbot (nổi ở góc phải).</p>
        
      </header>
      <ChatbotWidget backendUrl={import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/chatbot'} />
    </div>
  )
}
