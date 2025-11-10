// ================================
//  PRODUCT CONTROLLER
// Chức năng: xử lý logic nghiệp vụ giữa route và model
// ================================

import {
  getProductsFromDB,
  getProductByIdFromDB,
  createProductInDB,
  updateProductInDB,
  deleteProductInDB,
  searchProductsInDB, //  thêm hàm tìm kiếm trong DB
} from "../models/productModel.js";

// ================================
//  LẤY TOÀN BỘ SẢN PHẨM
// ================================
export async function getAllProducts(req, res) {
  try {
    const products = await getProductsFromDB();
    res.status(200).json(products);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error.message);
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm" });
  }
}

// ================================
//  LẤY CHI TIẾT SẢN PHẨM THEO ID
// ================================
export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await getProductByIdFromDB(id);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(product);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error.message);
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm" });
  }
}

// ================================
//  THÊM SẢN PHẨM MỚI
// ================================
export async function createProduct(req, res) {
  try {
    const { sku, name, description, price, brand, gender, size, color, category } = req.body;

    const newProduct = await createProductInDB({
      sku,
      name,
      description,
      price,
      brand,
      gender,
      size,
      color,
      category,
    });

    res.status(201).json({
      message: "Thêm sản phẩm thành công",
      data: newProduct,
    });
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error.message);
    res.status(500).json({ message: "Không thể thêm sản phẩm" });
  }
}

// ================================
//  CẬP NHẬT SẢN PHẨM
// ================================
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const updated = await updateProductInDB(id, req.body);

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm cần cập nhật" });
    }

    res.json({ message: "Cập nhật sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật:", error.message);
    res.status(500).json({ message: "Không thể cập nhật sản phẩm" });
  }
}

// ================================
//  XÓA SẢN PHẨM
// ================================
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteProductInDB(id);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm cần xóa" });
    }

    res.json({ message: "Đã xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error.message);
    res.status(500).json({ message: "Không thể xóa sản phẩm" });
  }
}

// ================================
//  TÌM KIẾM SẢN PHẨM LINH HOẠT
// ================================
// Ví dụ: /api/products/search?brand=NIKE&gender=Nam&size=42&color=xanh
export async function searchProducts(req, res) {
  try {
    const filters = {
      name: req.query.name || "",
      brand: req.query.brand || "",
      gender: req.query.gender || "",
      size: req.query.size || "",
      color: req.query.color || "",
      category: req.query.category || "",
      minPrice: req.query.minPrice || "",
      maxPrice: req.query.maxPrice || "",
    };

    const products = await searchProductsInDB(filters);

    if (!products.length) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm phù hợp yêu cầu" });
    }

    res.status(200).json({
      message: `Tìm thấy ${products.length} sản phẩm phù hợp`,
      data: products,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error.message);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm sản phẩm" });
  }
}

// ================================
//   PHÂN TÍCH CÂU HỎI NGƯỜI DÙNG (AI-PARSER)
// ================================
// Ví dụ: "Tôi cần mẫu giày Nike cho nam size 42 màu xanh"
function parseSearchText(queryText) {
  const lower = queryText.toLowerCase();
  const brands = ["nike", "adidas", "puma", "vans", "converse"];
  const brand = brands.find(b => lower.includes(b)) || "";

  const colors = ["đen", "trắng", "đỏ", "xanh", "vàng", "nâu", "xám"];
  const color = colors.find(c => lower.includes(c)) || "";

  const sizeMatch = lower.match(/size\s*(\d{2})/);
  const size = sizeMatch ? sizeMatch[1] : "";

  const gender = lower.includes("nam") ? "Nam" : lower.includes("nữ") ? "Nữ" : "";

  return { brand, color, size, gender };
}

// ================================
//  API: /api/products/ask → chatbot phân tích và gợi ý
// ================================
export async function askProductSuggestion(req, res) {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung tìm kiếm" });
    }

    //  Phân tích câu hỏi
    const { brand, color, size, gender } = parseSearchText(query);

    //  Gọi tìm kiếm trong DB
    const filters = { brand, color, size, gender };
    const results = await searchProductsInDB(filters);

    //  Trả kết quả chi tiết
    res.json({
      user_query: query,
      extracted_filters: filters,
      total_found: results.length,
      suggestions: results.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        color: p.color,
        size: p.size,
        gender: p.gender,
        price: p.price,
        description: p.description,
      })),
    });
  } catch (error) {
    console.error("Lỗi khi xử lý yêu cầu chatbot:", error);
    res.status(500).json({ message: "Lỗi server khi gợi ý sản phẩm" });
  }
}
