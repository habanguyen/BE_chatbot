// src/controllers/chatbotController.js
import { analyzeMessage } from "../utils/nlp.js";
import { searchProductsInDB, getProductByIdFromDB } from "../models/productModel.js";

/**
 * handleChat - controller chính cho chatbot
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

    // 1) Phân tích ngôn ngữ -> intent + entities/filters
    const nlu = analyzeMessage(message);    // 2) Xử lý theo intent
    switch (nlu.intent) {
      case "find_product": {
        // filters từ NLU
  const filters = nlu.filters || {};
        // Nếu userInfo (height/weight) được gửi, gộp vào filters để có thể dùng
        if (userInfo) filters.userInfo = userInfo;

  // Nếu NLU trả về keyword, map sang name để model có thể tìm kiếm theo name
  const dbFilters = { ...filters };
  if (!dbFilters.name && dbFilters.keyword) dbFilters.name = dbFilters.keyword;

  const products = await searchProductsInDB(dbFilters);

        if (!products || products.length === 0) {
          return res.json({
            reply: "Mình chưa tìm thấy sản phẩm phù hợp. Bạn thử mô tả thêm (hãng, mức giá, mục đích sử dụng) nhé.",
            data: [],
          });
        }

        // Format trả về ngắn gọn + link/price/stock
        const summary = products.slice(0, 10).map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          stock: p.stock ?? 0,
          category: p.category,
        }));

        return res.json({
          reply: `Mình tìm thấy ${products.length} sản phẩm phù hợp. Hiện đây là một vài gợi ý:`,
          data: summary,
        });
      }

      case "recommend_size": {
        // NLU cố gắng parse height/weight; nếu không có, dùng userInfo
        const { height, weight, gender } = nlu.entities || {};
        const h = height || (userInfo && userInfo.height);
        const w = weight || (userInfo && userInfo.weight);
        const g = gender || (userInfo && userInfo.gender);

        if (!h || !w) {
          return res.json({
            reply: "Mình cần biết chiều cao và cân nặng để tư vấn size. Ví dụ: 'Tôi cao 170cm nặng 68kg'.",
          });
        }

        // simple heuristic; bạn có thể thay bằng bảng size_guide chi tiết
        const size = recommendShoeSize(h, w, g);

        return res.json({
          reply: `Với chiều cao ${h}cm và cân nặng ${w}kg, mình gợi ý bạn thử size ${size}.`,
        });
      }

      case "check_discount": {
        // Có thể mở rộng: tìm program trong DB; hiện demo trả lời cứng
        return res.json({
          reply: "Hiện shop có chương trình giảm 10% cho một số mẫu sneaker. Bạn muốn mình tìm mẫu giảm giá trong tầm giá bao nhiêu?",
        });
      }

      case "get_product_detail": {
        // Nếu user hỏi chi tiết 1 sản phẩm: NLU nên gửi id hoặc sku
        const { productId, sku } = nlu.entities || {};
        if (!productId && !sku) {
          return res.json({ reply: "Bạn muốn xem sản phẩm nào? gửi id hoặc sku nhé." });
        }
        const product = productId ? await getProductByIdFromDB(productId) : null;
        // fallback tìm theo sku (nếu bạn implement)
        if (!product && sku) {
          // tìm theo sku qua searchProductsInDB
          const rows = await searchProductsInDB({ sku });
          if (rows.length) return res.json({ reply: "Đây là thông tin sản phẩm:", data: rows[0] });
        }

        if (!product) return res.json({ reply: "Không tìm thấy sản phẩm." });

        return res.json({
          reply: `Chi tiết sản phẩm: ${product.name}`,
          data: product,
        });
      }

      default:
        return res.json({
          reply: "Mình chưa hiểu rõ. Bạn có thể hỏi ví dụ: 'Tìm giày Nike dưới 2 triệu', hoặc 'Tư vấn size cho tôi cao 170 nặng 68'.",
        });
    }
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Lỗi server khi xử lý chatbot" });
  }
}

/**
 * recommendShoeSize - heuristic đơn giản dựa chiều cao/cân nặng
 * Bạn có thể thay bằng truy vấn bảng size_guide chi tiết.
 */
function recommendShoeSize(heightCm, weightKg, gender) {
  // Đây là ví dụ heuristic — điều chỉnh cho phù hợp data shop
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (Number.isNaN(h) || Number.isNaN(w)) return "không xác định";

  // Simple mapping (EU sizes approximate)
  if (h < 160) return gender === "female" ? "36-37 (VN)" : "38-39 (VN)";
  if (h < 170) return gender === "female" ? "37-38 (VN)" : "39-40 (VN)";
  if (h < 180) return gender === "female" ? "38-39 (VN)" : "40-42 (VN)";
  return gender === "female" ? "40 (VN)" : "42-44 (VN)";
}
