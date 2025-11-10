import connection from "./db.js";

connection.query("SELECT 1 + 1 AS result", (err, results) => {
  if (err) {
    console.error("❌ Lỗi truy vấn MySQL:", err.message);
  } else {
    console.log("✅ Kết quả truy vấn:", results[0].result);
  }
  connection.end();
});
