/**
 * NLP PRO – phân tích intent, sở thích khách hàng, cảm xúc
 * Phục vụ training chatbot & tư vấn sản phẩm thông minh hơn
 */

const BRANDS = ["nike", "adidas", "puma", "new balance", "converse", "vans", "reebok"];
const CATEGORIES = ["sneaker", "chạy", "running", "boots", "sandals", "thoải mái", "tập", "thể thao", "đi học"];
const COLORS = ["trắng", "đen", "đỏ", "xanh", "be", "nâu", "hồng"];
const STYLES = ["năng động", "trẻ trung", "lịch sự", "đơn giản", "streetwear", "basic"];
const EMOTIONS = [
  { key: "positive", words: ["thích", "ưng", "đẹp", "ổn đấy"] },
  { key: "negative", words: ["xấu", "không thích", "không ổn", "tệ", "đắt"] },
  { key: "neutral",  words: ["được", "cũng được", "ok"] }
];

export function analyzeMessage(message) {
  const text = (message || "").toLowerCase().trim();
  if (!text) return { intent: "unknown" };

  // --------------------------------------------
  // 1. Small talk
  // --------------------------------------------
  if (/(chào|hi|hello)/.test(text)) {
    return { intent: "greeting" };
  }
  if (/cám ơn|thank/.test(text)) {
    return { intent: "thanks" };
  }
  if (/tạm biệt|bye/.test(text)) {
    return { intent: "goodbye" };
  }

  // --------------------------------------------
  // 2. Emotion detection
  // --------------------------------------------
  let emotion = "neutral";
  for (const emo of EMOTIONS) {
    if (emo.words.some(w => text.includes(w))) {
      emotion = emo.key;
      break;
    }
  }

  // --------------------------------------------
  // 3. Size calculation
  // --------------------------------------------
  const sizeEntities = extractSize(text);
  if (sizeEntities) {
    return {
      intent: "recommend_size",
      entities: { ...sizeEntities },
      emotion
    };
  }

  // --------------------------------------------
  // 4. Product detail request
  // --------------------------------------------
  const detailEntities = extractProductDetail(text);
  if (detailEntities) {
    return {
      intent: "get_product_detail",
      entities: detailEntities,
      emotion
    };
  }

  // --------------------------------------------
  // 5. Extract preference
  // --------------------------------------------
  const preferences = extractPreferences(text);

  // --------------------------------------------
  // 6. Search intent
  // --------------------------------------------
  const filters = extractFilters(text);
  const isSearchIntent =
    text.includes("giày") ||
    Object.keys(filters).length > 0 ||
    preferences.style.length > 0 ||
    preferences.color.length > 0;

  if (isSearchIntent) {
    return {
      intent: "find_product",
      filters,
      preferences,
      emotion
    };
  }

  // --------------------------------------------
  // 7. Unknown
  // --------------------------------------------
  return { intent: "unknown", emotion };
}

// =========================================================
// Helper functions
// =========================================================


//  Tách chiều cao / cân nặng
function extractSize(text) {
  let height = null, weight = null;
  const h = text.match(/cao\s*([0-9]{2,3})/);
  const w = text.match(/nặng\s*([0-9]{2,3})/);

  if (h) height = Number(h[1]);
  if (w) weight = Number(w[1]);
  if (!height && !weight) return null;

  return { height, weight };
}

//  Tách ID / SKU
function extractProductDetail(text) {
  const id = text.match(/id\s*([0-9]+)/);
  if (id) return { productId: Number(id[1]) };

  const sku = text.match(/sku[: ]?([a-z0-9]+)\b/);
  if (sku) return { sku: sku[1] };

  return null;
}

//  Tách sở thích khách hàng
function extractPreferences(text) {
  const style = STYLES.filter(s => text.includes(s));
  const color = COLORS.filter(c => text.includes(c));

  let purpose = null;
  if (/đi học|đi làm|chạy bộ|tập gym|đi chơi/.test(text)) {
    purpose = RegExp.lastMatch;
  }

  return { style, color, purpose };
}

//  Tách bộ lọc tìm kiếm
function extractFilters(text) {
  const filters = {};

  const brand = BRANDS.find(b => text.includes(b));
  if (brand) filters.brand = brand;

  const category = CATEGORIES.find(c => text.includes(c));
  if (category) filters.category = category;

  // price
  const price = parsePrice(text);
  if (price.min) filters.minPrice = price.min;
  if (price.max) filters.maxPrice = price.max;

  const keywords = extractKeywords(text);
  if (keywords.length) filters.keyword = keywords.join(" ");

  return filters;
}

//  Tách giá
function parsePrice(text) {
  const price = {};

  const under = text.match(/dưới\s*([0-9]+)k/);
  if (under) price.max = Number(under[1]) * 1000;

  const over = text.match(/trên\s*([0-9]+)k/);
  if (over) price.min = Number(over[1]) * 1000;

  const range = text.match(/([0-9]+)-([0-9]+)k/);
  if (range) {
    price.min = Number(range[1]) * 1000;
    price.max = Number(range[2]) * 1000;
  }

  return price;
}

// ✔ Extract keyword thông minh
function extractKeywords(text) {
  const stop = new Set(["tôi","muốn","cần","một","cho","với","giá","đến"]);
  return text
    .split(/\s+/)
    .filter(w => !stop.has(w) && w.length > 2);
}
