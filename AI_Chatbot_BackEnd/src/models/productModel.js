// ================================
//  PRODUCT MODEL
// Chức năng: xử lý truy vấn DB cho bảng `products` với Promise Pool
// ================================

import pool from "../db.js"; // Pool connection từ db.js

// ================================
//  LẤY DANH SÁCH SẢN PHẨM
// ================================
export async function getProductsFromDB() {
    try {
        const [rows] = await pool.query("SELECT * FROM products ORDER BY id DESC");
        return rows;
    } catch (error) {
        console.error("Lỗi getProductsFromDB:", error.message);
        throw new Error("Không thể lấy danh sách sản phẩm");
    }
}

// ================================
//  LẤY CHI TIẾT 1 SẢN PHẨM THEO ID
// ================================
export async function getProductByIdFromDB(id) {
    try {
        const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
        return rows[0];
    } catch (error) {
        console.error(`Lỗi getProductByIdFromDB(${id}):`, error.message);
        throw new Error("Không thể lấy chi tiết sản phẩm");
    }
}

// ================================
//  THÊM SẢN PHẨM MỚI
// ================================
export async function createProductInDB(product) {
    try {
        const { sku, name, description, price, brand, gender, size, color, category } = product;

        // Kiểm tra trường dữ liệu
        if (!sku || !name) {
            throw new Error("SKU và tên sản phẩm là bắt buộc");
        }

        const [result] = await pool.query(
            `INSERT INTO products (sku, name, description, price, brand, gender, size, color, category)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sku, name, description || "", price || 0, brand || "", gender || "Unisex", size || "", color || "", category || ""]
        );

        return { id: result.insertId, ...product };
    } catch (error) {
        console.error("Lỗi createProductInDB:", error.message);
        throw new Error("Không thể tạo sản phẩm mới");
    }
}

// ================================
//  CẬP NHẬT SẢN PHẨM
// ================================
export async function updateProductInDB(id, product) {
    try {
        const { name, description, price, brand, gender, size, color, category } = product;

        const [result] = await pool.query(
            `UPDATE products 
             SET name = ?, description = ?, price = ?, brand = ?, gender = ?, size = ?, color = ?, category = ?
             WHERE id = ?`,
            [name, description, price, brand, gender, size, color, category, id]
        );

        // Nếu không có dòng nào bị ảnh hưởng => không tồn tại ID đó
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`Lỗi updateProductInDB(${id}):`, error.message);
        throw new Error("Không thể cập nhật sản phẩm");
    }
}

// ================================
//  XÓA SẢN PHẨM
// ================================
export async function deleteProductInDB(id) {
    try {
        const [result] = await pool.query(`DELETE FROM products WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`Lỗi deleteProductInDB(${id}):`, error.message);
        throw new Error("Không thể xóa sản phẩm");
    }
}

// ================================
//  TÌM KIẾM SẢN PHẨM LINH HOẠT (cho chatbot)
// ================================
export async function searchProductsInDB(filters) {
    try {
        // Log tổng số sản phẩm trong DB (debug)
        const [totalRows] = await pool.query("SELECT COUNT(*) as count FROM products");
        console.log('[productModel] total products in DB:', totalRows[0]?.count || 0);

        const { name, brand, gender, size, color, category, minPrice, maxPrice, keyword } = filters;

        const conditions = [];
        const values = [];

        // KEYWORD-BASED SEARCH: nếu có keyword, tìm kiếm bằng FULLTEXT hoặc split từ khoá
        if (keyword) {
          // Tách keyword thành các từ và tìm kiếm nếu bất kỳ từ nào khớp
          const keywords = keyword.split(/\s+/).filter(Boolean); // split by spaces, loại bỏ rỗng
          if (keywords.length > 0) {
            // Tìm sản phẩm chứa bất kỳ từ khoá nào trong name hoặc description
            const keywordConditions = keywords.map(() => "(name LIKE ? OR description LIKE ?)").join(" OR ");
            const keywordValues = keywords.flatMap(k => [`%${k}%`, `%${k}%`]);
            conditions.push(`(${keywordConditions})`);
            values.push(...keywordValues);
          }
        }

        // Các filter khác (brand, gender, size, color, category)
        if (name && !keyword) {
          conditions.push("name LIKE ?");
          values.push(`%${name}%`);
        }
        if (brand) {
          conditions.push("brand LIKE ?");
          values.push(`%${brand}%`);
        }
        if (gender) {
          conditions.push("gender = ?");
          values.push(gender);
        }
        if (size) {
          conditions.push("size LIKE ?");
          values.push(`%${size}%`);
        }
        if (color) {
          conditions.push("color LIKE ?");
          values.push(`%${color}%`);
        }
        if (category) {
          conditions.push("category LIKE ?");
          values.push(`%${category}%`);
        }
        if (minPrice) {
          conditions.push("price >= ?");
          values.push(minPrice);
        }
        if (maxPrice) {
          conditions.push("price <= ?");
          values.push(maxPrice);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const query = `SELECT * FROM products ${whereClause} ORDER BY price ASC`;

        // debug: log query and values for troubleshooting
        console.log('[productModel] search query:', query);
        console.log('[productModel] values:', values);

        let [rows] = await pool.query(query, values);
        console.log('[productModel] rows returned:', rows.length);

        return rows;
    } catch (error) {
        console.error("Lỗi searchProductsInDB:", error.message);
        throw new Error("Không thể tìm kiếm sản phẩm");
    }
}
