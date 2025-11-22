// src/routes/chatbot.js
import express from "express";
import { handleChat } from "../controllers/chatbotController.js";

const router = express.Router();

// Middleware validate input cho POST /api/chatbot
router.post("/", (req, res, next) => {
  const { message, userInfo } = req.body;

  // Validate message
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required and must be a string." });
  }

  // Validate userInfo nếu có
  if (userInfo && typeof userInfo !== "object") {
    return res.status(400).json({ error: "userInfo must be an object if provided." });
  }

  // Nếu tất cả hợp lệ, chuyển tiếp cho controller
  next();
}, handleChat);

export default router;
