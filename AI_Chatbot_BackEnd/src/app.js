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
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:3001'];

// Log incoming origin + method to help debug browser CORS/preflight issues
app.use((req, res, next) => {
  try {
    console.log('[CORS DEBUG] origin=', req.headers.origin, 'method=', req.method, 'url=', req.url);
  } catch (e) {
    // ignore logging errors
  }
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // allow non-browser requests (curl, server-side) where origin is undefined
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    console.warn('[CORS] Denied origin:', origin);
    // signal not allowed (do not throw) — browser will block when Access-Control-Allow-Origin missing
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
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
  const embedUrl = process.env.FRONTEND_EMBED_URL || "http://localhost:3001/";
  return res.redirect(embedUrl);
});

export default app;
