chatbot-frontend/
├── package.json
├── package-lock.json
├── vite.config.js
├── index.html
├── README.md             # (this file) hướng dẫn và mô tả cấu trúc
└── src/
    ├── main.jsx          # entry point React (createRoot -> <App />)
    ├── App.jsx           # demo / container để test widget
    ├── App.css           # styles cho demo app
    └── components/
        └── ChatbotWidget.jsx  # thành phần React chính: floating chat widget
        └── ChatbotWidget.css
    └── img/              # (tuỳ chọn) chứa ảnh tĩnh nếu cần
        └── avatar_chatbot.png  # ảnh avatar bot 

