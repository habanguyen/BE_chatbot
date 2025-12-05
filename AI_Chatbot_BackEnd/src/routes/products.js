// ================================
//  PRODUCT ROUTES
// Chức năng: định nghĩa endpoint RESTful cho bảng `products`
// ================================

import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,         //  tìm kiếm qua query string
  askProductSuggestion,   //  chatbot hiểu ngôn ngữ tự nhiên
} from "../controllers/productController.js";

const router = express.Router();

// ================================
//  CÁC ROUTE CHÍNH
// ================================

//  Lấy danh sách sản phẩm
router.get("/", getAllProducts);

//  Lấy chi tiết 1 sản phẩm theo ID
// NOTE: đặt các route cụ thể (search) trước route động 
// để tránh '/search/...' bị bắt bởi '/:id'

//   Tìm kiếm sản phẩm qua query string
router.get("/search/filter", searchProducts);

//   Tìm kiếm bằng ngôn ngữ tự nhiên
router.post("/search/ask", askProductSuggestion);

//  Lấy chi tiết 1 sản phẩm theo ID
router.get("/:id", getProductById);

//  Thêm sản phẩm mới
router.post("/", createProduct);

//  Cập nhật sản phẩm
router.put("/:id", updateProduct);

//  Xóa sản phẩm
router.delete("/:id", deleteProduct);

// ================================
//  ROUTE TÌM KIẾM
// (đã đặt trước route động `/ :id`)
// ================================

export default router;
