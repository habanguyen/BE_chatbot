import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import db, { initializeDatabase } from "./db.js"; // pool và hàm khởi tạo

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Chờ DB sẵn sàng trước khi lắng nghe
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Khởi động server thất bại do không kết nối được DB:", err.message);
    process.exit(1);
  }
})();
