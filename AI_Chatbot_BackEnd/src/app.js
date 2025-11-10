// ======================================
//  app.js
//  Chức năng: Cấu hình Express app, middleware, và routes
// ======================================

import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import productRoutes from "./routes/products.js";
import chatbotRoutes from "./routes/chatbot.js";

dotenv.config();

const app = express();

// ===== Middleware =====
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'], // thêm origin của frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json()); // cho phép đọc body JSON
app.use(morgan("dev"));  // log request ra console

// ===== Routes =====
app.use("/api/products", productRoutes);
app.use("/api/chatbot", chatbotRoutes);

// ===== Kiểm tra API root =====
app.get("/", (req, res) => {
  res.send(" Chatbot Backend API đang hoạt động!");
});

// ===== Embeddable widget redirect =====
// Trả về redirect tới trang embed của frontend. Thiết lập FRONTEND_EMBED_URL trong env nếu cần.
app.get("/embed", (req, res) => {
  const embedUrl = process.env.FRONTEND_EMBED_URL || "http://localhost:3001/embed.html";
  return res.redirect(embedUrl);
});

export default app;
