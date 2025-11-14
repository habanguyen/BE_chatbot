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

-- 6️⃣ Dữ liệu mẫu: sản phẩm (15 sản phẩm: 5 thương hiệu, 3 mức giá)

-- ========== NIKE - Bình dân (500k-1.5M) ==========
INSERT INTO products (sku, name, description, price, stock, brand, gender, category, color)
VALUES
('NK001', 'Nike Revolution 6 Nam', 'Giày chạy bộ nhẹ, thoáng khí, phù hợp tập luyện hàng ngày', 750000, 15, 'Nike', 'Nam', 'Giày thể thao', 'Xám'),
('NK002', 'Nike Court Legacy Nữ', 'Giày tennis cổ điển, dễ mặc, màu trắng thanh lịch', 850000, 12, 'Nike', 'Nữ', 'Giày thể thao', 'Trắng'),
('NK003', 'Nike Downshifter 12 Nam', 'Giày chạy bộ thoải mái, lót mềm mại, phù hợp mọi lứa tuổi', 650000, 20, 'Nike', 'Nam', 'Giày thể thao', 'Đen');

-- ========== NIKE - Trung bình (1.5M-3M) ==========
INSERT INTO products (sku, name, description, price, stock, brand, gender, category, color)
VALUES
('NK004', 'Nike Air Zoom Pegasus 39 Nam', 'Giày chạy bộ đáp ứng cao, công nghệ Air Zoom, phù hợp chạy bộ thường xuyên', 1800000, 10, 'Nike', 'Nam', 'Giày chạy bộ', 'Xanh đen'),
('NK005', 'Nike Metcon 9 Unisex', 'Giày tập luyện CrossFit, sự ổn định cực cao, thiết kế bền bỉ', 2200000, 8, 'Nike', 'Unisex', 'Giày thể thao', 'Đen trắng');

-- ========== NIKE - Cao cấp (3M+) ==========
INSERT INTO products (sku, name, description, price, stock, brand, gender, category, color)
VALUES
('NK006', 'Nike Air Max 90 Nam', 'Giày iconic Air Max, dễ mặc, phù hợp dạo phố và tập luyện', 3500000, 7, 'Nike', 'Nam', 'Giày thể thao', 'Trắng xám'),
('NK007', 'Nike Dunk High Nữ', 'Giày bóng rổ huyền thoại, thiết kế cao cấp, style thời trang', 3800000, 6, 'Nike', 'Nữ', 'Giày thể thao', 'Hồng trắng');

-- ========== ADIDAS - Bình dân (600k-1.5M) ==========
INSERT INTO products (sku, name, description, price, stock, brand, gender, category, color)
VALUES
('AD001', 'Adidas Runfalcon 3 Nam', 'Giày chạy bộ nhẹ nhàng, thoáng khí, phù hợp học sinh', 720000, 18, 'Adidas', 'Nam', 'Giày thể thao', 'Đen xám'),
('AD002', 'Adidas Duramo SL Nữ', 'Giày chạy bộ mỏng nhẹ, lót mềm, phù hợp tập luyện nhẹ', 780000, 14, 'Adidas', 'Nữ', 'Giày thể thao', 'Hồng trắng'),
('AD003', 'Adidas Lite Racer Rebold Unisex', 'Giày chạy bộ thoải mái, đệm mềm, phù hợp dạo phố', 850000, 16, 'Adidas', 'Unisex', 'Giày thể thao', 'Xanh đen');

-- ========== ADIDAS - Trung bình (1.5M-3M) ==========
INSERT INTO products (sku, name, description, price, stock, brand, gender, category, color)
VALUES
('AD004', 'Adidas Ultraboost 22 Nam', 'Giày chạy bộ cao cấp, công nghệ Boost, độ hồi phục cao', 2500000, 9, 'Adidas', 'Nam', 'Giày chạy bộ', 'Đen'),
('AD005', 'Adidas NMD_R1 Nữ', 'Giày sneaker trend, thiết kế futuristic, thoải mái cả ngày', 2000000, 11, 'Adidas', 'Nữ', 'Giày thể thao', 'Trắng');

-- ========== PUMA - Bình dân (500k-1.5M) ==========
INSERT INTO products (sku, name, description, price, stock, brand, gender, category, color)
VALUES
('PM001', 'Puma Flyer Runner Nam', 'Giày chạy bộ nhẹ, thiết kế modern, thoáng khí', 680000, 13, 'Puma', 'Nam', 'Giày thể thao', 'Đen đỏ'),
('PM002', 'Puma Wired Run Nữ', 'Giày chạy bộ thoải mái, đệm êm, phù hợp mọi lứa tuổi', 700000, 12, 'Puma', 'Nữ', 'Giày thể thao', 'Tím trắng');

-- ========== NEW BALANCE - Cao cấp (3M+) ==========
INSERT INTO products (sku, name, description, price, stock, brand, gender, category, color)
VALUES
('NB001', 'New Balance 990v6 Nam', 'Giày chạy bộ premium, thiết kế American classic, chất lượng cao', 4500000, 5, 'New Balance', 'Nam', 'Giày chạy bộ', 'Trắng xám');

-- ========== CONVERSE - Bình dân (600k-1.2M) ==========
INSERT INTO products (sku, name, description, price, stock, brand, gender, category, color)
VALUES
('CV001', 'Converse Chuck Taylor All Star Unisex', 'Giày canvas huyền thoại, dễ phối đồ, casual style', 950000, 25, 'Converse', 'Unisex', 'Giày vải', 'Trắng'),
('CV002', 'Converse Chuck Taylor High Top Nam', 'Giày canvas cổ cao, style skate, phù hợp dạo phố', 1050000, 20, 'Converse', 'Nam', 'Giày vải', 'Đen');

-- 7️⃣ Dữ liệu mẫu: đơn hàng và chi tiết
INSERT INTO orders (customer_name, total)
VALUES 
('Nguyễn Văn A', 5500000),
('Trần Thị B', 3500000);

INSERT INTO order_items (order_id, product_id, quantity, subtotal)
VALUES
(1, 1, 1, 750000),
(1, 4, 1, 1800000),
(1, 6, 1, 3500000),
(2, 5, 1, 2200000),
(2, 7, 1, 3500000);

-- 8️⃣ Dữ liệu mẫu: tài liệu chính sách / khuyến mãi
INSERT INTO qa_documents (doc_type, title, content)
VALUES
('policy', 'Chính sách đổi trả', 'Khách hàng có thể đổi sản phẩm trong 7 ngày nếu chưa qua sử dụng.'),
('promo', 'Giảm giá tháng 10', 'Tất cả sản phẩm Nike giảm 15% trong tháng 10.'),
('faq', 'Làm sao để đặt hàng?', 'Khách hàng có thể đặt hàng qua website hoặc chatbot.');

-- ✅ Hoàn tất khởi tạo
-- Không cần SELECT ở file init, Docker chỉ cần tạo dữ liệu xong là đủ.
