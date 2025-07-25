// routes/auth.routes.ts
import express from "express";
import authController from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Private routes - require authentication
router.get("/profile", authenticateToken, authController.profile);
router.post("/logout", authenticateToken, authController.logout);
router.post("/refresh", authenticateToken, authController.refresh);

export default router;
