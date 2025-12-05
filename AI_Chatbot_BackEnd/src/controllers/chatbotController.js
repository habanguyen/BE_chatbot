// ==========================================
// src/controllers/chatbotController.js
// HYBRID CHATBOT (Rule-based NLP + ChatGPT AI)
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

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Thiếu trường 'message' (string).",
      });
    }

    // USER
    const uid = await saveUserIfNotExists(userId || "guest", userInfo);

    // NLP → intent
    const nlu = analyzeMessage(message);

    await saveChatMessage(uid, "user", message);

    let botReply = "";
    let botData = null;

    // ==============================
    // ❗ 1. Xử lý SMALL TALK → Đưa cho AI
    // ==============================
    if (["greeting", "thanks", "goodbye"].includes(nlu.intent)) {
      botReply = await askGPT(message);
      await saveChatMessage(uid, "bot", botReply);
      return res.json({ reply: botReply });
    }

    // ==============================
    // ❗ 2. Intent: FIND PRODUCT
    // ==============================
    if (nlu.intent === "find_product") {
      const filters = nlu.filters || {};

      if (userInfo) {
        filters.userInfo = {
          height: userInfo.height,
          weight: userInfo.weight,
          gender: userInfo.gender,
        };
      }

      const products = await searchProductsInDB(filters);

      if (!products || products.length === 0) {
        // Không tìm được sản phẩm - kiểm tra xem có phải thực sự là câu hỏi về sản phẩm không
        const textLower = (message || "").toLowerCase();
        const hasProductKeyword = /giay|shoe|sneaker|boots|sandal|adidas|nike|puma|converse|vans|reebok|brand|sku|size|price/.test(textLower);
        
        if (!hasProductKeyword) {
          // Không phải câu hỏi về sản phẩm → gọi askGPT
          botReply = await askGPT(message);
          await saveChatMessage(uid, "bot", botReply);
          return res.json({ reply: botReply });
        }
        
        // Là câu hỏi về sản phẩm nhưng chưa tìm thấy
        botReply =
          "Mình chưa tìm thấy sản phẩm phù hợp. Bạn mô tả thêm hãng, mức giá hoặc nhu cầu nhé!";
        await saveChatMessage(uid, "bot", botReply);
        return res.json({ reply: botReply });
      }

      botReply = `Mình tìm thấy ${products.length} sản phẩm phù hợp, gợi ý như sau:`;

      botData = products.slice(0, 10).map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        price: p.price,
        stock: p.stock || 0,
        category: p.category,
      }));

      await saveChatMessage(uid, "bot", botReply);

      return res.json({
        reply: botReply,
        data: botData,
      });
    }

    // ==============================
    // ❗ 3. Intent: recommend_size
    // ==============================
    if (nlu.intent === "recommend_size") {
      const { height, weight, gender } = nlu.entities || {};

      const h = height || userInfo.height;
      const w = weight || userInfo.weight;
      const g = gender || userInfo.gender || "male";

      if (!h || !w) {
        botReply =
          "Bạn cần nói rõ chiều cao + cân nặng. Ví dụ: 'tôi cao 170 nặng 68'.";
        await saveChatMessage(uid, "bot", botReply);
        return res.json({ reply: botReply });
      }

      const size = recommendShoeSize(h, w, g);
      botReply = `Với chiều cao ${h}cm và cân nặng ${w}kg, size phù hợp là: ${size}`;

      await saveChatMessage(uid, "bot", botReply);
      return res.json({ reply: botReply });
    }

    // ==============================
    // ❗ 4. Intent: get_product_detail
    // ==============================
    if (nlu.intent === "get_product_detail") {
      const { productId, sku } = nlu.entities || {};

      let product = null;

      if (productId) product = await getProductByIdFromDB(productId);
      if (!product && sku) {
        const found = await searchProductsInDB({ sku });
        if (found.length) product = found[0];
      }

      if (!product) {
        botReply = "Không tìm thấy sản phẩm.";
      } else {
        botReply = `Chi tiết sản phẩm: ${product.name}`;
        botData = product;
      }

      await saveChatMessage(uid, "bot", botReply);

      return res.json({
        reply: botReply,
        data: botData,
      });
    }

    // ==============================
    // ❗ 5. Intent: check_discount
    // ==============================
    if (nlu.intent === "check_discount") {
      botReply = "Shop hiện đang giảm 10% cho một số mẫu sneaker hot. Bạn muốn xem theo hãng hay theo giá ạ?";
      await saveChatMessage(uid, "bot", botReply);
      return res.json({ reply: botReply });
    }

    // ==============================
    // ❗ 6. Không hiểu → đưa cho ChatGPT xử lý
    // ==============================
    botReply = await askGPT(message);

    await saveChatMessage(uid, "bot", botReply);

    return res.json({
      reply: botReply,
    });

  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ error: "Lỗi server khi xử lý chatbot" });
  }
}

// ==============================
// Hàm trả lời thông minh (rule-based fallback)
// Xử lý cả câu hỏi về sản phẩm và ngoài lề
// ==============================
async function askGPT(message) {
  const text = (message || "").toLowerCase().trim();
  const textNorm = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // ===== SMALL-TALK =====
  if (/(chao|hi|hello)/.test(textNorm)) {
    return "Chào bạn! 👋 Mình là trợ lý tư vấn giày. Bạn cần tìm giày nào hôm nay? (Nike, Adidas, Puma...)";
  }
  if (/(cam on|thank)/.test(textNorm)) {
    return "Không có gì! 😊 Nếu còn câu hỏi nào về giày, hãy cứ hỏi nhé.";
  }
  if (/(tam biet|bye)/.test(textNorm)) {
    return "Tạm biệt bạn! 👋 Chúc bạn mua được giày ưng ý. Hẹn gặp lại!";
  }
  
  // ===== WEATHER / TIME / GENERAL KNOWLEDGE =====
  if (/(thoi tiet|weather|mua)/.test(textNorm)) {
    return "Để biết thời tiết chính xác, bạn nên check app thời tiết hoặc web! 😊 Còn mình focus vào tư vấn giày thôi. Bạn cần tìm giày không?";
  }
  if (/(may man|trung thuong|xo so)/.test(textNorm)) {
    return "Mình không có thông tin về điều này! 😄 Nhưng nếu bạn mua giày ở shop mình, chắc bạn sẽ cảm thấy may mắn vì tìm được đôi giày đẹp! 👟";
  }
  if (/(hom nay|hom qua|ngay mai|gio may)/.test(textNorm)) {
    return "Mình không theo dõi thời gian như vậy, nhưng shop mình mở cửa hàng ngày để bạn mua giày! 😊 Cần tư vấn gì không?";
  }
  
  // ===== OPINION QUESTIONS =====
  if (/(giay nao|san pham nao)/.test(textNorm) && /(tot|dep|chat luong|recommend|nen)/.test(textNorm)) {
    return "Nike và Adidas là hai thương hiệu uy tín, chất lượng rất tốt. Bạn thích style nào? (năng động, trẻ trung, lịch sự...)";
  }
  
  // ===== GENERAL FEEDBACK ABOUT SHOP =====
  if (/(chat luong|gia ca|the nao|sao|nhieu tien|bao nhieu)/.test(textNorm)) {
    return "Shop mình cung cấp những đôi giày chính hãng, chất lượng tốt với giá cạnh tranh. Bạn tìm giày với mục đích gì nhé? (chạy bộ, đi học, dạo phố...)";
  }
  
  // ===== SHOP INFO =====
  if (/(shop o dau|dia chi|gio mo cua|lien he|sdt|phone)/.test(textNorm)) {
    return "Shop mình online nên bạn có thể đặt hàng qua app này! 🛍️ Chúng mình giao hàng nhanh chóng. Cần tìm giày nào không?";
  }
  
  // ===== RANDOM CHAT / JOKE =====
  if (/(tro choi|tro chuyen|ban la ai|ten ban la gi)/.test(textNorm)) {
    return "Mình là Chatbot tư vấn giày! 🤖 Chuyên nghiệp, thân thiện và luôn sẵn lòng giúp bạn tìm đôi giày hoàn hảo. Bạn muốn tìm giày gì?";
  }
  
  // ===== DEFAULT FALLBACK =====
  return "Haha, câu hỏi hay đấy! 😄 Nhưng mình chuyên tư vấn giày, còn vấn đề khác thì bạn hỏi người khác nhé. Còn về giày, mình giúp được gì cho bạn? 👟";
}

// ==============================
// Hàm tư vấn size cũ – giữ nguyên
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
