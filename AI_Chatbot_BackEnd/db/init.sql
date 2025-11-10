-- ============================================================
-- 🧠 INIT.SQL - Khởi tạo cơ sở dữ liệu cho chatbot backend
-- Tác giả: Hà Nguyễn Bá
-- Mục đích: Dùng cho môi trường khởi tạo tự động (Docker, setup lần đầu)
-- ============================================================

-- 1️⃣ Xóa database cũ (nếu có) và tạo mới
DROP DATABASE IF EXISTS shopdb;
CREATE DATABASE shopdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopdb;

-- 2️⃣ Bảng sản phẩm
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    brand VARCHAR(100),
    gender ENUM('Nam', 'Nữ', 'Unisex') DEFAULT 'Unisex',
    size VARCHAR(20),
    color VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_brand_category (brand, category),
    INDEX idx_price (price),
    FULLTEXT INDEX ft_name_desc (name, description)
);

-- 3️⃣ Bảng đơn hàng
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2)
);

-- 4️⃣ Bảng chi tiết đơn hàng (quan hệ N-N)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5️⃣ Bảng tài liệu FAQ / Chính sách (phục vụ chatbot)
CREATE TABLE qa_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doc_type ENUM('policy','faq','promo'),
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6️⃣ Dữ liệu mẫu: sản phẩm
INSERT INTO products (sku, name, description, price, stock, category)
VALUES
('SP001', 'Giày Nike Air Zoom', 'Giày thể thao Nike Air Zoom chính hãng', 2500000, 10, 'Giày thể thao'),
('SP002', 'Giày Adidas Ultraboost', 'Giày chạy bộ Adidas Ultraboost', 3000000, 8, 'Giày thể thao'),
('SP003', 'Dép Gucci nam', 'Dép thời trang cao cấp Gucci', 4500000, 5, 'Dép thời trang');

-- 7️⃣ Dữ liệu mẫu: đơn hàng và chi tiết
INSERT INTO orders (customer_name, total)
VALUES ('Nguyễn Văn A', 5500000);

INSERT INTO order_items (order_id, product_id, quantity, subtotal)
VALUES
(1, 1, 1, 2500000),
(1, 2, 1, 3000000);

-- 8️⃣ Dữ liệu mẫu: tài liệu chính sách / khuyến mãi
INSERT INTO qa_documents (doc_type, title, content)
VALUES
('policy', 'Chính sách đổi trả', 'Khách hàng có thể đổi sản phẩm trong 7 ngày nếu chưa qua sử dụng.'),
('promo', 'Giảm giá tháng 10', 'Tất cả sản phẩm Nike giảm 15% trong tháng 10.'),
('faq', 'Làm sao để đặt hàng?', 'Khách hàng có thể đặt hàng qua website hoặc chatbot.');

-- ✅ Hoàn tất khởi tạo
-- Không cần SELECT ở file init, Docker chỉ cần tạo dữ liệu xong là đủ.
