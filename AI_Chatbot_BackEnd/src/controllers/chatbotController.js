// src/controllers/chatbotController.js
import { analyzeMessage } from "../utils/nlp.js";
import { searchProductsInDB, getProductByIdFromDB } from "../models/productModel.js";

/**
 * 🤖 Chatbot Controller - Huấn luyện để:
 * 1. Chủ động chào hỏi khi mở
 * 2. Trả lời yêu cầu khách hàng
 * 3. Tìm kiếm dựa trên keyword
 * 4. Tư vấn & gợi ý sản phẩm
 */

// ===== GREETING MESSAGES (Chào hỏi chủ động) =====
const GREETING_RESPONSES = [
  "👋 Chào bạn! Mình là ChatBot bán hàng giày thể thao. Hôm nay bạn muốn tìm gì ạ?",
  "Xin chào! 🎉 Mình giúp bạn tìm giày phù hợp. Bạn có nhu cầu gì không?",
  "Chào bạn! 👟 Hãy cho mình biết: bạn thích giày nào? Nike? Adidas? Hay hãng khác?",
  "Xin chào! 😊 Mình sẵn sàng tư vấn giày cho bạn. Bạn tìm giày nam hay nữ?",
];

const RECOMMENDATION_QUESTIONS = [
  "🤔 Bạn hãy cho mình biết:\n- Bạn thích hãng nào? (Nike, Adidas, Puma...)\n- Mục đích dùng? (chạy bộ, dạo phố, tập gym)\n- Mức giá? (dưới 1 triệu, 1-3 triệu, trên 3 triệu)",
  "Để gợi ý tốt nhất, mình cần biết:\n🏷️ Hãng: Nike/Adidas/Puma?\n🎯 Dùng để: Chạy bộ/Dạo phố/Tập luyện?\n💰 Ngân sách: Bao nhiêu tiền?",
  "Giúp mình biết nha:\n👟 Loại giày: Sneaker/Running/Boots?\n👤 Size/Giới tính: Nam/Nữ?\n💵 Giá bao nhiêu thoải mái?",
];

const NO_PRODUCT_MESSAGE = "Mình chưa tìm thấy sản phẩm phù hợp với yêu cầu của bạn. 😔\nBạn có thể:\n- Thay đổi hãng (Nike, Adidas, Puma)\n- Thay đổi mức giá\n- Hoặc cho mình biết thêm chi tiết nhé!";

/**
 * handleChat - Main chatbot handler
 */
export async function handleChat(req, res) {
  try {
    const { message, userInfo } = req.body;
    
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Thiếu trường 'message' kiểu string trong body",
        example: {
          message: "tìm giày Nike dưới 2 triệu",
          userInfo: { height: 170, weight: 65, gender: "Nam" }
        }
      });
    }

    // 1) Phân tích ngôn ngữ tự nhiên
    const nlu = analyzeMessage(message);
    console.log('[chatbot] incoming message:', message);
    console.log('[chatbot] NLU result:', JSON.stringify(nlu));

    // 2) Xử lý theo intent
    switch (nlu.intent) {
      // ===== GREETING: Chào hỏi chủ động =====
      case "greeting": {
        const greeting = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
        return res.json({
          reply: greeting,
          intent: "greeting",
          data: []
        });
      }

      // ===== ASK_RECOMMENDATION: Tư vấn & gợi ý sản phẩm =====
      case "ask_recommendation": {
        // Nếu user yêu cầu gợi ý, lấy top products hot
        const topProducts = await searchProductsInDB({ 
          minPrice: 0,
          maxPrice: 5000000  // Top products under 5M
        });

        if (topProducts.length > 0) {
          // Lọc top 3 sản phẩm đa dạng
          const recommended = topProducts
            .slice(0, 5)
            .map(p => ({
              id: p.id,
              name: p.name,
              brand: p.brand,
              price: p.price,
              stock: p.stock ?? 0,
              category: p.category,
            }));

          const question = RECOMMENDATION_QUESTIONS[Math.floor(Math.random() * RECOMMENDATION_QUESTIONS.length)];
          return res.json({
            reply: `Đây là một vài sản phẩm gợi ý hàng đầu cho bạn:\n\n${question}`,
            intent: "ask_recommendation",
            data: recommended
          });
        } else {
          const question = RECOMMENDATION_QUESTIONS[Math.floor(Math.random() * RECOMMENDATION_QUESTIONS.length)];
          return res.json({
            reply: question,
            intent: "ask_recommendation",
            data: []
          });
        }
      }

      // ===== FIND_PRODUCT: Tìm kiếm sản phẩm dựa trên keyword =====
      case "find_product": {
        const filters = nlu.filters || {};
        if (userInfo) filters.userInfo = userInfo;

        const products = await searchProductsInDB(filters);

        if (!products || products.length === 0) {
          console.log('[chatbot] search returned 0 rows for filters:', JSON.stringify(filters));
          return res.json({
            reply: NO_PRODUCT_MESSAGE,
            intent: "find_product",
            data: [],
          });
        }

        // Format kết quả tìm kiếm
        const summary = products.slice(0, 10).map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          stock: p.stock ?? 0,
          category: p.category,
        }));

        console.log('[chatbot] search returned', products.length, 'products');
        
        // Tạo reply message chi tiết
        let replyMsg = `✅ Mình tìm thấy ${products.length} sản phẩm phù hợp! Đây là một vài gợi ý:\n`;
        if (nlu.filters.brand) replyMsg += `\n🏷️ Hãng: ${nlu.filters.brand.toUpperCase()}`;
        if (nlu.filters.maxPrice) replyMsg += `\n💰 Giá dưới: ${formatPrice(nlu.filters.maxPrice)}`;
        if (nlu.filters.minPrice) replyMsg += `\n💰 Giá từ: ${formatPrice(nlu.filters.minPrice)}`;
        
        return res.json({
          reply: replyMsg,
          intent: "find_product",
          data: summary,
        });
      }

      // ===== RECOMMEND_SIZE: Tư vấn size dựa trên chiều cao & cân nặng =====
      case "recommend_size": {
        const { height, weight, gender } = nlu.entities || {};
        const h = height || (userInfo && userInfo.height);
        const w = weight || (userInfo && userInfo.weight);
        const g = gender || (userInfo && userInfo.gender);

        if (!h || !w) {
          return res.json({
            reply: "📏 Mình cần biết chiều cao và cân nặng để tư vấn size nhé. Ví dụ: 'Tôi cao 170cm nặng 68kg'.",
            intent: "recommend_size",
            data: []
          });
        }

        const size = recommendShoeSize(h, w, g);
        const sizeAdvice = getSizeAdviceMessage(h, w, size);

        return res.json({
          reply: sizeAdvice,
          intent: "recommend_size",
          data: { height: h, weight: w, recommendedSize: size }
        });
      }

      // ===== CHECK_DISCOUNT: Kiểm tra khuyến mãi & giảm giá =====
      case "check_discount": {
        const promoMessage = `🎉 Hiện tại shop có các chương trình giảm giá:\n\n` +
          `💥 Nike & Adidas: Giảm 10-15%\n` +
          `💥 Puma & Converse: Giảm 5-10%\n` +
          `💥 Mua 2 đôi trở lên: Giảm thêm 5%\n\n` +
          `Bạn muốn mình tìm sản phẩm giảm giá trong tầm giá nào?`;

        return res.json({
          reply: promoMessage,
          intent: "check_discount",
          data: []
        });
      }

      // ===== GET_PRODUCT_DETAIL: Lấy chi tiết 1 sản phẩm =====
      case "get_product_detail": {
        const { productId, sku } = nlu.entities || {};
        
        if (!productId && !sku) {
          return res.json({ 
            reply: "🔍 Bạn muốn xem chi tiết sản phẩm nào? Cho mình biết ID hoặc SKU nhé.",
            intent: "get_product_detail",
            data: []
          });
        }

        let product = null;
        if (productId) {
          product = await getProductByIdFromDB(productId);
        } else if (sku) {
          const rows = await searchProductsInDB({ sku });
          product = rows.length > 0 ? rows[0] : null;
        }

        if (!product) {
          return res.json({ 
            reply: "❌ Không tìm thấy sản phẩm. Bạn kiểm tra lại ID hoặc SKU nhé!",
            intent: "get_product_detail",
            data: []
          });
        }

        const detailMsg = `📌 Chi tiết sản phẩm:\n\n` +
          `👟 Tên: ${product.name}\n` +
          `🏷️ Hãng: ${product.brand}\n` +
          `💰 Giá: ${formatPrice(product.price)}\n` +
          `📦 Kho: ${product.stock > 0 ? product.stock + ' sản phẩm' : 'Hết hàng'}\n` +
          `🏷️ Danh mục: ${product.category || 'N/A'}\n` +
          `${product.color ? '🎨 Màu: ' + product.color + '\n' : ''}` +
          `📝 Mô tả: ${product.description || 'Không có'}`;

        return res.json({
          reply: detailMsg,
          intent: "get_product_detail",
          data: product
        });
      }

      // ===== DEFAULT: Không hiểu intent =====
      default: {
        const unknownMsg = `❓ Mình chưa hiểu rõ ạ. Bạn có thể:\n\n` +
          `🔍 Tìm sản phẩm: "Tìm giày Nike dưới 2 triệu"\n` +
          `📏 Tư vấn size: "Tôi cao 170cm nặng 68kg"\n` +
          `💬 Tư vấn: "Gợi ý giày cho tôi"\n` +
          `🎉 Khuyến mãi: "Có giảm giá không?"\n\n` +
          `Hãy thử các lệnh trên nhé!`;

        return res.json({
          reply: unknownMsg,
          intent: "unknown",
          data: []
        });
      }
    }
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Lỗi server khi xử lý chatbot" });
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * recommendShoeSize - Tư vấn size giày dựa trên chiều cao & cân nặng
 */
function recommendShoeSize(heightCm, weightKg, gender) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  
  if (Number.isNaN(h) || Number.isNaN(w)) return "không xác định";

  // Heuristic đơn giản (có thể thay bằng bảng size_guide từ DB)
  if (h < 160) return gender === "nữ" ? "36-37" : "38-39";
  if (h < 170) return gender === "nữ" ? "37-38" : "39-40";
  if (h < 180) return gender === "nữ" ? "38-39" : "40-42";
  return gender === "nữ" ? "39-40" : "42-44";
}

/**
 * getSizeAdviceMessage - Tạo message tư vấn size thân thiện
 */
function getSizeAdviceMessage(heightCm, weightKg, size) {
  return `📏 Tư vấn kích thước giày cho bạn:\n\n` +
    `👤 Thông tin: Cao ${heightCm}cm, nặng ${weightKg}kg\n` +
    `👟 Size được đề xuất: ${size} (EU)\n\n` +
    `💡 Lời khuyên:\n` +
    `• Size trên là size chuẩn cho bạn\n` +
    `• Nếu muốn thoải mái hơn, có thể chọn size lớn hơn ½ size\n` +
    `• Hãy chọn giày có độ hỗ trợ tốt cho chân\n\n` +
    `Bạn muốn tìm giày với size này không?`;
}

/**
 * formatPrice - Format giá tiền theo VND
 */
function formatPrice(price) {
  if (!price) return "N/A";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}
