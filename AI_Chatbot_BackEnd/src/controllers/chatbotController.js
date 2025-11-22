// ==========================================
// src/controllers/chatbotController.js
// Controller xử lý logic chính của Chatbot
// ==========================================

import { analyzeMessage } from "../utils/nlp.js";
import { 
  searchProductsInDB, 
  getProductByIdFromDB 
} from "../models/productModel.js";

import { saveUserIfNotExists, saveChatMessage } from "../models/userModel.js";

// ==============================
// Controller chính
// ==============================
export async function handleChat(req, res) {
  try {
    const { message, userInfo = {}, userId } = req.body;

    // 1) Validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Thiếu trường 'message' (string).",
        example: { 
          message: "tìm giày Nike dưới 2 triệu",
          userInfo: { height: 170, weight: 65 }
        }
      });
    }

    // 2) Đảm bảo user tồn tại trong DB
    const uid = await saveUserIfNotExists(userId || "guest", userInfo);

    // 3) NLP → intent + entities + filters
    const nlu = analyzeMessage(message);

    // 4) Lưu lịch sử chat (user → bot)
    await saveChatMessage(uid, "user", message);

    // ==============================
    // Xử lý theo intent từ NLP
    // ==============================
    let botReply = "";
    let botData = null;

    switch (nlu.intent) {

      // -----------------------------
      // LỜI CHÀO (Greeting)
      // -----------------------------
      case "greeting": {
        botReply = "Chào bạn! Mình là trợ lý mua sắm — bạn muốn tìm sản phẩm, tư vấn size, hay xem khuyến mãi?";
        // provide a small set of quick suggestions in data (optional)
        botData = [
          { id: null, name: "Tìm giày Nike", brand: "Nike", category: "Giày thể thao" },
          { id: null, name: "Tư vấn size", brand: null, category: null },
          { id: null, name: "Xem khuyến mãi", brand: null, category: null }
        ];
        break;
      }

      // -----------------------------
      // TÌM SẢN PHẨM
      // -----------------------------
      case "find_product": {
        const filters = nlu.filters || {};

        // merge với userInfo gửi từ FE
        if (userInfo) {
          filters.userInfo = {
            height: userInfo.height,
            weight: userInfo.weight,
            gender: userInfo.gender
          };
        }

        const products = await searchProductsInDB(filters);

        if (!products || products.length === 0) {
          botReply =
            "Mình chưa tìm thấy sản phẩm phù hợp. Bạn mô tả thêm hãng, mức giá hoặc nhu cầu nhé!";
          break;
        }

        botReply = `Mình tìm thấy ${products.length} sản phẩm phù hợp, gợi ý một số mẫu:`;

        botData = products.slice(0, 10).map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          brand: p.brand,
          price: p.price,
          stock: p.stock || 0,
          category: p.category,
        }));
        break;
      }

      // -----------------------------
      // TƯ VẤN SIZE
      // -----------------------------
      case "recommend_size": {
        const { height, weight, gender } = nlu.entities || {};

        const h = height || userInfo.height;
        const w = weight || userInfo.weight;
        const g = gender || userInfo.gender || "male";

        if (!h || !w) {
          botReply =
            "Bạn cần cung cấp chiều cao và cân nặng. Ví dụ: 'Tôi cao 170cm nặng 68kg'.";
          break;
        }

        const size = recommendShoeSize(h, w, g);
        botReply = `Với chiều cao ${h}cm và cân nặng ${w}kg, size phù hợp là: ${size}`;
        break;
      }

      // -----------------------------
      // KIỂM TRA KHUYẾN MÃI
      // -----------------------------
      case "check_discount": {
        botReply =
          "Hiện tại shop đang giảm 10% cho một số mẫu sneaker. Bạn muốn tìm giảm giá theo hãng hoặc mức giá nào?";
        break;
      }

      // -----------------------------
      // LẤY CHI TIẾT SẢN PHẨM
      // -----------------------------
      case "get_product_detail": {
        const { productId, sku } = nlu.entities || {};

        if (!productId && !sku) {
          botReply = "Bạn muốn xem chi tiết sản phẩm nào? (id hoặc sku)";
          break;
        }

        let product = null;

        if (productId) product = await getProductByIdFromDB(productId);
        if (!product && sku) {
          const rows = await searchProductsInDB({ sku });
          if (rows.length) product = rows[0];
        }

        if (!product) {
          botReply = "Không tìm thấy sản phẩm.";
        } else {
          botReply = `Chi tiết sản phẩm: ${product.name}`;
          botData = product;
        }
        break;
      }

      // -----------------------------
      // INTENT KHÔNG XỬ LÝ ĐƯỢC
      // -----------------------------
      default:
        botReply =
          "Mình chưa hiểu câu hỏi. Bạn có thể thử hỏi: 'Tìm giày Nike dưới 2 triệu' hoặc 'Tư vấn size cho tôi cao 170 nặng 68'.";
    }

    // 5) lưu câu trả lời của bot vào lịch sử chat
    await saveChatMessage(uid, "bot", botReply);

    // 6) trả về client
    return res.json({
      reply: botReply,
      data: botData,
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ error: "Lỗi server khi xử lý chatbot" });
  }
}

// ==============================
// HÀM TƯ VẤN SIZE
// ==============================
function recommendShoeSize(heightCm, weightKg, gender) {
  const h = Number(heightCm);
  const w = Number(weightKg);

  if (isNaN(h) || isNaN(w)) return "không xác định";

  if (h < 160) return gender === "female" ? "36–37 (VN)" : "38–39 (VN)";
  if (h < 170) return gender === "female" ? "37–38 (VN)" : "39–40 (VN)";
  if (h < 180) return gender === "female" ? "38–39 (VN)" : "40–42 (VN)";
  return gender === "female" ? "40 (VN)" : "42–44 (VN)";
}
