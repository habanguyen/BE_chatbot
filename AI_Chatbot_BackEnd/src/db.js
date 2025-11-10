// src/db.js
// Sử dụng mysql2/promise và pool để hỗ trợ async/await và quản lý kết nối tốt hơn.
import mysql from "mysql2/promise";
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "shopdb",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// initializeDatabase: thử kết nối với retry để chờ MySQL container sẵn sàng
async function initializeDatabase({ retries = 10, delay = 3000 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await pool.getConnection();
      // Ping để đảm bảo kết nối sống
      await conn.ping();
      conn.release();
      console.log("Đã kết nối MySQL thành công!");
      return;
    } catch (err) {
      console.error(`Kết nối DB thất bại (lần ${i + 1}/${retries}): ${err.message}`);
      if (i === retries - 1) {
        console.error("Không thể kết nối tới MySQL sau nhiều lần thử.");
        throw err;
      }
      // chờ và thử lại
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export default pool;
export { initializeDatabase };
