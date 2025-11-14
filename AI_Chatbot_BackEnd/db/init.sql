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
INSERT INTO products (sku, name, description, price, stock, brand, gender, size, color, category)
VALUES
('SP004', 'Giày Nike Revolution 6', 'Giày thể thao giá bình dân của Nike', 1200000, 15, 'Nike', 'Nam', '40-44', 'Đen', 'Giày thể thao'),
('SP005', 'Giày Adidas Runfalcon', 'Giày chạy bộ giá bình dân của Adidas', 1100000, 12, 'Adidas', 'Nữ', '36-40', 'Trắng', 'Giày thể thao'),
('SP006', 'Dép Crocs Classic', 'Dép unisex Crocs dễ chịu, casual', 500000, 20, 'Crocs', 'Unisex', '36-44', 'Xanh', 'Dép đi trong nhà'),
('SP007', 'Giày Puma Smash v2', 'Giày thể thao bình dân Puma', 900000, 18, 'Puma', 'Nam', '39-43', 'Đỏ', 'Giày thể thao'),
('SP008', 'Giày Gucci Ace', 'Giày cao cấp Gucci Ace sang trọng', 8500000, 4, 'Gucci', 'Nữ', '36-40', 'Trắng', 'Giày thời trang'),
('SP009', 'Dép Hermes Oran', 'Dép Hermes cao cấp, phong cách', 7200000, 3, 'Hermes', 'Nữ', '36-41', 'Nâu', 'Dép thời trang'),
('SP010', 'Sneaker Balenciaga Speed', 'Sneaker cao cấp Balenciaga Speed', 15000000, 2, 'Balenciaga', 'Nam', '40-44', 'Đen', 'Giày thể thao cao cấp'),
('SP011', 'Giày Converse Chuck Taylor', 'Giày thể thao bình dân Converse', 950000, 25, 'Converse', 'Unisex', '36-44', 'Trắng', 'Giày thể thao'),
('SP012', 'Giày New Balance 574', 'Giày chạy bộ bình dân New Balance', 1200000, 10, 'New Balance', 'Nam', '39-43', 'Xám', 'Giày thể thao'),
('SP013', 'Giày Prada Cloudbust', 'Giày cao cấp Prada Cloudbust', 12500000, 3, 'Prada', 'Nữ', '36-40', 'Đen', 'Giày thời trang cao cấp'),
('SP014', 'Dép Nike Kawa', 'Dép thể thao Nike giá bình dân', 350000, 30, 'Nike', 'Unisex', '36-44', 'Đen', 'Dép thể thao'),
('SP015', 'Giày Reebok Classic', 'Giày thể thao bình dân Reebok', 1000000, 20, 'Reebok', 'Nam', '39-43', 'Trắng', 'Giày thể thao'),
('SP016', 'Giày Dior B23', 'Giày cao cấp Dior B23', 14000000, 2, 'Dior', 'Unisex', '37-44', 'Trắng', 'Giày thời trang cao cấp'),
('SP017', 'Dép Adidas Adilette', 'Dép thể thao Adidas giá bình dân', 400000, 25, 'Adidas', 'Unisex', '36-44', 'Xanh', 'Dép thể thao'),
('SP018', 'Giày Jordan Air 1', 'Giày cao cấp Jordan Air 1', 9000000, 5, 'Jordan', 'Nam', '40-44', 'Đỏ', 'Giày thể thao cao cấp');

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
