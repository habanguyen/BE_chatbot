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
        const { name, brand, gender, size, color, category, minPrice, maxPrice, keyword } = filters;

        const conditions = [];
        const values = [];

        // KEYWORD search: if keyword provided, split into words and match any term in name OR description
        if (keyword) {
            const keywords = keyword.split(/\s+/).filter(Boolean);
            if (keywords.length > 0) {
                const keywordConditions = keywords.map(() => `(name LIKE ? OR description LIKE ? )`).join(" OR ");
                conditions.push(`(${keywordConditions})`);
                const keywordValues = keywords.flatMap(k => [`%${k}%`, `%${k}%`]);
                values.push(...keywordValues);
            }
        }

        // Ghép điều kiện linh hoạt
        if (name) {
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

        // debug logs to help troubleshooting
        console.log('[productModel] search query:', query);
        console.log('[productModel] values:', values);

        const [rows] = await pool.query(query, values);
        console.log('[productModel] rows returned:', rows.length);
        return rows;
    } catch (error) {
        console.error("Lỗi searchProductsInDB:", error.message);
        throw new Error("Không thể tìm kiếm sản phẩm");
    }
}
