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


Mô tả chi tiết các file và chức năng

- `package.json`
  - Mục đích: khai báo metadata, scripts và dependencies cho frontend (React + Vite).
  - Scripts thường có: `dev` (chạy Vite dev server), `build` (build production), `preview`.

- `package-lock.json`
  - Mục đích: khoá phiên bản của các package để cài đặt nhất quán.

- `vite.config.js`
  - Mục đích: cấu hình Vite (port dev server, proxy cho API nếu cần, alias).
  - Gợi ý: cấu hình proxy để chuyển `/api` sang backend (http://localhost:3000) trong khi dev.

- `index.html`
  - Mục đích: entry HTML cho dev và build. Chứa phần tử để mount React app.

- `src/main.jsx`
  - Mục đích: khởi tạo React app, mount `App.jsx`.

- `src/App.jsx` và `src/App.css`
  - Mục đích: trang demo nhỏ để chạy/kiểm thử `ChatbotWidget`. Không bắt buộc khi bạn chỉ nhúng widget bằng iframe.

- `src/components/ChatbotWidget.jsx`
  - Mục đích: thành phần React chính (floating chat widget) dùng để hiển thị cuộc hội thoại.
  - Chức năng chính:
    - Toggle mở/đóng widget.
    - Hiển thị danh sách tin nhắn (user / bot / system).
    - Gửi POST tới backend (`/api/chatbot` hoặc `backendUrl` prop) với payload `{ message: string }`.
    - Nhận phản hồi JSON `{ reply: string, data?: Array }` — nếu `data` là mảng products thì component sẽ render product cards (tên, thương hiệu, category, giá, stock).
    - Hỗ trợ prop `defaultOpen` để widget mount sẵn ở trạng thái mở (hữu ích khi nhúng vào landing page).
    - Dùng inline styles để giảm rủi ro xung đột CSS khi nhúng vào trang khác.


Chạy nhanh (dev)
```powershell
cd AI_Chatbot_FrontEnd
npm install
npm run dev
```

Mặc định dev server thường chạy ở `http://localhost:3001`. Nếu backend của bạn chạy ở `http://localhost:3000`, bạn có thể cấu hình proxy trong `vite.config.js` để chuyển `/api` requests về backend.
