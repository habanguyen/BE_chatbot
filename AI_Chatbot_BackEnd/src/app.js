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
// Allow common local dev origins (localhost and 127.0.0.1) to avoid CORS issues
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://127.0.0.1:5173'],
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

// ===== DEBUG: Dump tất cả sản phẩm (tạm thời để kiểm tra dữ liệu) =====
app.get("/debug/products", async (req, res) => {
  try {
    const db = (await import("./db.js")).default;
    const [rows] = await db.query("SELECT id, name, brand, price FROM products");
    res.json({ total: rows.length, products: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Embeddable widget redirect =====
// Trả về redirect tới trang embed của frontend. Thiết lập FRONTEND_EMBED_URL trong env nếu cần.
app.get("/embed", (req, res) => {
  const embedUrl = process.env.FRONTEND_EMBED_URL || "http://localhost:3001/embed.html";
  return res.redirect(embedUrl);
});

// ===== Error handler for malformed JSON =====
// Catch SyntaxError from express.json() (invalid JSON body) so the server
// responds with 400 instead of crashing.
app.use((err, req, res, next) => {
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON payload received:', err.message);
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  // pass on to default error handlers
  next(err);
});

export default app;
