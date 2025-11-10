// src/utils/nlp.js
/**
 * analyzeMessage(message)
 * Trả về object: { intent: string, filters?: {}, entities?: {} }
 *
 * Lưu ý: đây là NLU dạng rule-based, phù hợp cho MVP.
 * Sau này có thể thay bằng call tới model (OpenAI / Rasa).
 */

const BRANDS = ["nike", "adidas", "puma", "new balance", "converse", "vans", "reebok"];
const CATEGORIES = ["sneaker", "sneakers", "sneaker", "running", "boots", "sandals", "loafer", "tập", "thể thao", "canvas"];

export function analyzeMessage(message) {
  const text = (message || "").toLowerCase().trim();

  // quick guard
  if (!text) return { intent: "unknown" };

  // 1) Detect explicit size advice requests (height + weight)
  // matches: "cao 170 nặng 68", "tôi cao 1m70 nặng 68kg", "cao 170cm nặng 68kg"
  let height = null;
  let weight = null;
  const hMatch = text.match(/cao\s*([0-9]{2,3}(?:\.\d+)?)(cm|m)?/);
  const hMatch2 = text.match(/([0-9]{2,3}(?:\.\d+)?)\s*cm/);
  const mMatch = text.match(/([0-9]\.?[0-9])m/); // 1.7m, 1m70
  if (hMatch) {
    height = Number(hMatch[1]);
    // if unit is m (or missing) and value < 3, assume meters -> convert to cm if in meters
    if (hMatch[2] === "m" && height < 3) height = Math.round(height * 100);
  } else if (mMatch) {
    let v = Number(mMatch[1]);
    if (v < 3) height = Math.round(v * 100);
  } else if (hMatch2) {
    height = Number(hMatch2[1]);
  }

  const wMatch = text.match(/nặng\s*([0-9]{2,3}(?:\.\d+)?)\s*(kg)?/);
  if (wMatch) weight = Number(wMatch[1]);

  if (height || weight) {
    return {
      intent: "recommend_size",
      entities: { height, weight },
    };
  }

  // 2) Detect discount / promotion requests
  if (text.includes("giảm giá") || text.includes("khuyến mãi") || text.includes("sale")) {
    return { intent: "check_discount" };
  }

  // 3) Detect product detail request (e.g., "cho mình xem giày id 12" or "sku P001")
  const idMatch = text.match(/(?:id|#)\s*([0-9]+)/);
  if (idMatch) {
    return { intent: "get_product_detail", entities: { productId: Number(idMatch[1]) } };
  }
  const skuMatch = text.match(/\bsku[:#]?\s*([a-z0-9\-]+)\b/);
  if (skuMatch) {
    return { intent: "get_product_detail", entities: { sku: skuMatch[1] } };
  }

  // 4) Detect search product intent + extract filters (brand, price, category, keywords)
  // brand
  const foundBrand = BRANDS.find(b => text.includes(b));
  const filters = {};
  if (foundBrand) filters.brand = foundBrand;

  // category
  const foundCategory = CATEGORIES.find(c => text.includes(c));
  if (foundCategory) filters.category = foundCategory;

  // price parsing: patterns like "dưới 2 triệu", "trên 500k", "từ 500k đến 1 triệu", "500-1000k"
  // normalize: k -> *1000, triệu -> *1_000_000
  const priceRange = {};
  // "dưới X"
  const underMatch = text.match(/dưới\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|nghìn|triệu|tr)/);
  if (underMatch) {
    priceRange.max = parsePriceNumber(underMatch[1], underMatch[2]);
  }
  // "trên X"
  const overMatch = text.match(/trên\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|nghìn|triệu|tr)/);
  if (overMatch) {
    priceRange.min = parsePriceNumber(overMatch[1], overMatch[2]);
  }
  // "từ X đến Y"
  const betweenMatch = text.match(/từ\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|triệu|nghìn)?\s*(?:đến|-)\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|triệu|nghìn)?/);
  if (betweenMatch) {
    priceRange.min = parsePriceNumber(betweenMatch[1], betweenMatch[2]);
    priceRange.max = parsePriceNumber(betweenMatch[3], betweenMatch[4]);
  }
  // "500-1000k"
  const rangeDash = text.match(/([0-9]+)\s*-\s*([0-9]+)\s*(k|triệu|nghìn)?/);
  if (rangeDash) {
    priceRange.min = parsePriceNumber(rangeDash[1], rangeDash[3]);
    priceRange.max = parsePriceNumber(rangeDash[2], rangeDash[3]);
  }
  if (priceRange.min) filters.minPrice = priceRange.min;
  if (priceRange.max) filters.maxPrice = priceRange.max;

  // keyword fallback: try to extract important words after stripping stopwords
  const keywords = extractKeywords(text);
  if (keywords.length) filters.keyword = keywords.join(" ");

  // If at least 'giày' present or keywords > 0 -> treat as search product
  if (text.includes("giày") || filters.brand || filters.category || filters.maxPrice || filters.minPrice || filters.keyword) {
    return { intent: "find_product", filters };
  }

  // default fallback
  return { intent: "unknown" };
}

// Helpers
function parsePriceNumber(numStr, unit) {
  if (!numStr) return null;
  // replace comma with dot
  const n = parseFloat(numStr.replace(",", "."));
  if (Number.isNaN(n)) return null;
  if (!unit) {
    // heuristic: if > 1000 => assume VND, else if <= 1000 maybe in 'k'?
    if (n >= 1000) return n; // assume already VND
    // default assume k if small
    return Math.round(n * 1000);
  }
  unit = (unit || "").toLowerCase();
  if (unit.includes("tri")) return Math.round(n * 1_000_000);
  if (unit === "k" || unit.includes("nghìn") || unit === "tr") return Math.round(n * 1000);
  // default
  return Math.round(n);
}

function extractKeywords(text) {
  // very simple tokenizer, remove common stopwords Vietnamese/English
  const stopwords = new Set(["tôi", "muốn", "cần", "một", "cho", "với", "giá", "trong", "đến", "tìm", "xem", "của", "có", "còn", "không", "những", "các", "là", "đang"]);
  const tokens = text.split(/[\s,.-/]+/).map(t => t.trim()).filter(Boolean);
  const result = tokens.filter(t => !stopwords.has(t) && t.length > 1);
  return result;
}
