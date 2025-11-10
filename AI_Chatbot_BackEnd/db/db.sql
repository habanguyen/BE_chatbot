-- 1️⃣ Tạo database mới
CREATE DATABASE shopdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2️⃣ Sử dụng database vừa tạo
USE shopdb;

-- 3️⃣ Tạo bảng sản phẩm
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(64) UNIQUE,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    stock INT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4️⃣ Tạo bảng đơn hàng
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2)
);

-- 5️⃣ Tạo bảng chi tiết đơn hàng (mối quan hệ nhiều-nhiều)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 6️⃣ Thêm dữ liệu mẫu vào bảng sản phẩm
INSERT INTO products (sku, name, description, price, stock, category)
VALUES
('SP001', 'Giày Nike Air Zoom', 'Giày thể thao Nike Air Zoom chính hãng', 2500000, 10, 'Giày thể thao'),
('SP002', 'Giày Adidas Ultraboost', 'Giày chạy bộ Adidas Ultraboost', 3000000, 8, 'Giày thể thao'),
('SP003', 'Dép Gucci nam', 'Dép thời trang cao cấp Gucci', 4500000, 5, 'Dép thời trang');

-- 7️⃣ Tạo đơn hàng mẫu
INSERT INTO orders (customer_name, total)
VALUES ('Nguyễn Văn A', 5500000);

-- 8️⃣ Thêm chi tiết đơn hàng
INSERT INTO order_items (order_id, product_id, quantity, subtotal)
VALUES
(1, 1, 1, 2500000),
(1, 2, 1, 3000000);

-- 9️⃣ Truy vấn thử xem dữ liệu
SELECT * FROM products;
SELECT * FROM orders;
SELECT * FROM order_items;
