import express from "express";
import productController from "../controllers/product.controller";
import categoryController from "../controllers/category.controller";

const router = express.Router();

// products
router.get("/products", productController.findAll);

// categories
router.get("/categories", categoryController.findAll);

export default router;
