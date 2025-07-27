import express from "express";
import authRoutes from "./auth.routes";
import productController from "../controllers/product.controller";
import categoryController from "../controllers/category.controller";
import multer from "multer";
import { authenticateToken } from "../middlewares/auth.middleware"; 

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Rute Autentikasi ---
router.use("/auth", authRoutes);

// --- Rute Produk ---
router.get("/products/search", productController.findByName);
router.get("/products", productController.findAll);
router.get("/products/:id", productController.findById);
router.post(
  "/products",
  authenticateToken,
  upload.single("image"),
  productController.create
);

// Uncomment jika sudah diimplementasikan
// router.post("/products", upload.single("image"), productController.create);
// router.put("/products/:id", productController.update);
// router.delete("/products/:id", productController.delete);


// --- Rute Kategori ---
router.get("/categories", categoryController.findAll);
router.get("/categories/:id", categoryController.findById);
router.post("/categories", categoryController.create);
router.put("/categories/:id", categoryController.update);
router.delete("/categories/:id", categoryController.delete);

export default router;
