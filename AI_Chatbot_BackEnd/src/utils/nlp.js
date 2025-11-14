// src/utils/nlp.js
/**
 * analyzeMessage(message)
 * Trả về object: { intent: string, filters?: {}, entities?: {} }
 *
 * Lưu ý: đây là NLU dạng rule-based, phù hợp cho MVP.
 * Sau này có thể thay bằng call tới model (OpenAI / Rasa).
 */

const BRANDS = ["Nike", "Adidas", "Puma", "New Balance", "Converse", "Vans", "Reebok", "Saucony"];
const CATEGORIES = ["sneaker", "sneakers", "running", "boots", "sandals", "loafer", "tập", "thể thao", "canvas", "chạy bộ"];
const COLORS = ["đen", "đỏ", "xanh", "trắng", "vàng", "nâu", "xám", "hồng", "tím", "cam"];
const SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

// Common aliases / shorthand to help fuzzy brand detection
const BRAND_ALIASES = {
  'nb': 'New Balance',
  'newbalance': 'New Balance',
  'nik': 'Nike'
};

// Greeting variants (include typos & natural ways to say hello)
const GREETINGS = [
  "hello", "hi", "helo", "hey", "yo",
  "chào", "chao", "xin chào", "chào bạn", "chào shop",
  "xin chào bạn"
];

// Terms that belong to product domain (prevent false positives)
const PRODUCT_TERMS = new Set([
  "giày", "giay", "nam", "nữ", "nu", "nữa",
  ...BRANDS,
  ...CATEGORIES,
  ...COLORS,
  "size", "cỡ", "màu", "hãng", "thương hiệu"
]);

// Recommendation trigger keywords
const RECOMMENDATION_TRIGGERS = [
  "gợi ý", "recommend", "tư vấn", "tư vấn size",
  "giới thiệu", "nên mua", "nên chọn", "chọn gì", "cái nào tốt"
];

export function analyzeMessage(message) {
  // preserve original and build a normalized version (remove diacritics)
  const original = (message || "").toString().trim();
  const normalized = removeDiacritics(original).toLowerCase().replace(/\s+/g, ' ').trim();

  if (!original) return { intent: "unknown", confidence: 0 };

  // ===== PRIORITY 1: Greeting Detection =====
  for (const g of GREETINGS) {
    if (normalized.includes(removeDiacritics(g).toLowerCase())) {
      return { intent: 'greeting', confidence: 0.98 };
    }
  }

  // ===== PRIORITY 2: Recommendation Request =====
  for (const trigger of RECOMMENDATION_TRIGGERS) {
    if (normalized.includes(removeDiacritics(trigger).toLowerCase())) {
      return { intent: 'ask_recommendation', confidence: 0.92 };
    }
  }

  // ===== PRIORITY 3: Size Advice Request =====
  let height = null;
  let weight = null;
  // SIZE / HEIGHT parsing (use normalized for units)
  const hMatch = normalized.match(/cao\s*([0-9]{2,3}(?:\.\d+)?)(cm|m)?/);
  const hMatch2 = normalized.match(/([0-9]{2,3}(?:\.\d+)?)\s*cm/);
  const mMatch = normalized.match(/([0-9]{2,3}(?:\.\d+)?)\s*m/);
  
  if (hMatch) {
    height = Number(hMatch[1]);
    if (hMatch[2] === "m" && height < 3) height = Math.round(height * 100);
  } else if (mMatch) {
    let v = Number(mMatch[1]);
    if (v < 3) height = Math.round(v * 100);
  } else if (hMatch2) {
    height = Number(hMatch2[1]);
  }

  const wMatch = normalized.match(/nặng\s*([0-9]{2,3}(?:\.\d+)?)\s*(kg)?/);
  if (wMatch) weight = Number(wMatch[1]);

  if (height || weight) {
    return {
      intent: "recommend_size",
      entities: { height, weight },
      confidence: 0.9
    };
  }

  // ===== PRIORITY 4: Discount / Promo Request =====
  if (normalized.includes(removeDiacritics("giảm giá").toLowerCase()) || normalized.includes(removeDiacritics("khuyến mãi").toLowerCase()) || normalized.includes("sale") || normalized.includes("promo")) {
    return { intent: "check_discount", confidence: 0.88 };
  }

  // ===== PRIORITY 5: Product Detail by ID/SKU =====
  const idMatch = normalized.match(/(?:id|#)\s*([0-9]+)/);
  if (idMatch) {
    return { intent: "get_product_detail", entities: { productId: Number(idMatch[1]) }, confidence: 0.95 };
  }
  const skuMatch = normalized.match(/\bsku[:#]?\s*([a-z0-9\-]+)\b/);
  if (skuMatch) {
    return { intent: "get_product_detail", entities: { sku: skuMatch[1] }, confidence: 0.95 };
  }

  // ===== PRIORITY 6: Product Search (Brand, Price, Keyword) =====
  const filters = {};
  let confidence = 0;

  // Extract brand (robust): try exact normalized match, aliases, n-gram and fuzzy fallback
  const normalizedBrands = BRANDS.map(b => removeDiacritics(b).toLowerCase());
  let foundBrand = null;
  // exact include
  for (let i = 0; i < normalizedBrands.length; i++) {
    if (normalized.includes(normalizedBrands[i])) {
      foundBrand = BRANDS[i];
      break;
    }
  }
  // alias map
  if (!foundBrand) {
    for (const alias in BRAND_ALIASES) {
      if (normalized.includes(alias)) { foundBrand = BRAND_ALIASES[alias]; break; }
    }
  }
  // token fuzzy
  if (!foundBrand) {
    const tks = normalized.split(/\s+/).filter(Boolean);
    for (let tk of tks) {
      for (let i = 0; i < normalizedBrands.length; i++) {
        const b = normalizedBrands[i];
        if (levenshtein(tk, b) <= 1) { foundBrand = BRANDS[i]; break; }
      }
      if (foundBrand) break;
    }
  }
  if (foundBrand) { filters.brand = foundBrand; confidence += 0.35; }

  // Extract category & color using normalized lists
  const normalizedCategories = CATEGORIES.map(c => removeDiacritics(c).toLowerCase());
  const catIdx = normalizedCategories.findIndex(c => normalized.includes(c));
  if (catIdx !== -1) { filters.category = CATEGORIES[catIdx]; confidence += 0.18; }
  const normalizedColors = COLORS.map(c => removeDiacritics(c).toLowerCase());
  const colorIdx = normalizedColors.findIndex(c => normalized.includes(c));
  if (colorIdx !== -1) { filters.color = COLORS[colorIdx]; confidence += 0.12; }

  // Parse price range
  const priceRange = {};
  const underMatch = normalized.match(/dưới\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|nghìn|triệu|tr)/);
  if (underMatch) {
    priceRange.max = parsePriceNumber(underMatch[1], underMatch[2]);
    confidence += 0.25;
  }
  const overMatch = normalized.match(/trên\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|nghìn|triệu|tr)/);
  if (overMatch) {
    priceRange.min = parsePriceNumber(overMatch[1], overMatch[2]);
    confidence += 0.25;
  }
  const betweenMatch = normalized.match(/từ\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|triệu|nghìn)?\s*(?:đến|-)\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|triệu|nghìn)?/);
  if (betweenMatch) {
    priceRange.min = parsePriceNumber(betweenMatch[1], betweenMatch[2]);
    priceRange.max = parsePriceNumber(betweenMatch[3], betweenMatch[4]);
    confidence += 0.3;
  }
  const rangeDash = normalized.match(/([0-9]+)\s*-\s*([0-9]+)\s*(k|triệu|nghìn)?/);
  if (rangeDash) {
    priceRange.min = parsePriceNumber(rangeDash[1], rangeDash[3]);
    priceRange.max = parsePriceNumber(rangeDash[2], rangeDash[3]);
    confidence += 0.25;
  }

  if (priceRange.min) filters.minPrice = priceRange.min;
  if (priceRange.max) filters.maxPrice = priceRange.max;

  // Extract keywords (original & normalized). We exclude generic tokens like 'giày'/'nam' from keyword
  const keywordsOrig = extractKeywords(original);
  const keywordsNorm = extractKeywords(normalized);
  // gender detection
  if (keywordsNorm.includes('nam')) { filters.gender = 'Nam'; confidence += 0.05; }
  if (keywordsNorm.includes('nu')) { filters.gender = 'Nữ'; confidence += 0.05; }

  const GENERIC_TOKENS = new Set(['giày','giay','nam','nu','nữ','cái','các','một','mot']);
  const nonGeneric = keywordsOrig.filter(k => !GENERIC_TOKENS.has(removeDiacritics(k).toLowerCase()));
  if (nonGeneric.length) {
    // prefer original tokens (preserve accents for DB LIKE) but also collapse short tokens
    filters.keyword = nonGeneric.join(' ');
    confidence += 0.22;
  }

  // Nếu chứa "giày" → là product search intent
  if (normalized.includes("giay") || normalized.includes("giày") || filters.brand || filters.category || filters.color || filters.maxPrice || filters.minPrice || filters.keyword) {
    confidence = Math.min(confidence + 0.15, 1.0);
    return { intent: "find_product", filters, confidence };
  }

  // Default: unknown intent
  return { intent: "unknown", confidence: 0 };
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
  const tokens = text.split(/[\s,\.\-\/]+/).map(t => t.trim()).filter(Boolean);
  const result = tokens.filter(t => !stopwords.has(t) && t.length > 1);
  return result;
}

// Remove diacritics (accents) from a string
function removeDiacritics(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Small Levenshtein implementation for fuzzy matching
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}