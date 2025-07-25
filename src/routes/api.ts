// routes/api.ts
import express from "express";
import authRoutes from "./auth.routes";
import productController from "../controllers/product.controller";
import categoryController from "../controllers/category.controller";

const router = express.Router();

router.use("/auth", authRoutes);

router.get("/products", productController.findAll);

router.get("/categories", categoryController.findAll);
router.get("/categories/:id", categoryController.findById);
router.post("/categories", categoryController.create);
router.put("/categories/:id", categoryController.update);
router.delete("/categories/:id", categoryController.delete);

export default router;
