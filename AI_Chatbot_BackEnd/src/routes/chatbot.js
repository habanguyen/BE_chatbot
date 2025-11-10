// src/routes/chatbot.js
import express from "express";
import { handleChat } from "../controllers/chatbotController.js";

const router = express.Router();

/**
 * POST /api/chatbot
 * Body: { message: string, userInfo?: { height?: number, weight?: number, gender?: 'male'|'female' } }
 */
router.post("/", handleChat);

export default router;
