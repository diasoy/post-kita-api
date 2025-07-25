// controllers/auth.controller.ts
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  JwtPayload,
} from "../types/auth.types";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../utils/validation";

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = 12;

if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined in .env file");
}

export default {
  /**
   * @desc Register a new user
   * @route POST /api/auth/register
   * @access Public
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name }: RegisterRequest = req.body || {};

      // Input validation
      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          message: "Email, password, and name are required",
        });
        return;
      }

      // Validate email format
      if (!validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
        return;
      }

      // Validate name
      if (!validateName(name)) {
        res.status(400).json({
          success: false,
          message: "Name must be between 2 and 50 characters",
        });
        return;
      }

      // Check for existing user
      const existingUser = await prisma.users.findFirst({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "User with this email already exists",
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Generate user ID
      const userId = uuidv4();

      // Create new user
      const newUser = await prisma.users.create({
        data: {
          id: userId,
          email: email.toLowerCase(),
          encrypted_password: hashedPassword,
          raw_user_meta_data: {
            name: name.trim(),
          },
          email_confirmed_at: new Date(), // Auto-confirm for this implementation
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Generate JWT token
      const tokenPayload: JwtPayload = {
        userId: newUser.id,
        email: newUser.email!,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "7d", // 7 days
        issuer: "your-app-name",
        audience: "your-app-users",
      });

      const response: AuthResponse = {
        message: "User registered successfully",
        token,
        user: {
          id: newUser.id,
          email: newUser.email!,
          name: (newUser.raw_user_meta_data as any)?.name || name,
        },
      };

      res.status(201).json({
        success: true,
        ...response,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during registration",
      });
    }
  },

  /**
   * @desc Login an existing user
   * @route POST /api/auth/login
   * @access Public
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Input validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
        return;
      }

      // Validate email format
      if (!validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
        return;
      }

      // Find user by email
      const user = await prisma.users.findFirst({
        where: { email: email.toLowerCase() },
      });

      // Check if user exists and has a password
      if (!user || !user.encrypted_password) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Check if user account is not deleted
      if (user.deleted_at) {
        res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
        return;
      }

      // Check if user is banned
      if (user.banned_until && user.banned_until > new Date()) {
        res.status(403).json({
          success: false,
          message: "Account is temporarily suspended",
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.encrypted_password
      );

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Update last sign-in time
      await prisma.users.update({
        where: { id: user.id },
        data: {
          last_sign_in_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Generate JWT token
      const tokenPayload: JwtPayload = {
        userId: user.id,
        email: user.email!,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "7d", // 7 days
        issuer: "your-app-name",
        audience: "your-app-users",
      });

      const response: AuthResponse = {
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email!,
          name: (user.raw_user_meta_data as any)?.name,
        },
      };

      res.status(200).json({
        success: true,
        ...response,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during login",
      });
    }
  },

  /**
   * @desc Get current user's profile
   * @route GET /api/auth/profile
   * @access Private
   */
  async profile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User ID not found in token",
        });
        return;
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          raw_user_meta_data: true,
          created_at: true,
          last_sign_in_at: true,
          email_confirmed_at: true,
          phone: true,
          phone_confirmed_at: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Check if user account is deleted
      const fullUser = await prisma.users.findUnique({
        where: { id: userId },
        select: { deleted_at: true },
      });

      if (fullUser?.deleted_at) {
        res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        user: {
          id: user.id,
          email: user.email,
          name: (user.raw_user_meta_data as any)?.name,
          phone: user.phone,
          emailVerified: !!user.email_confirmed_at,
          phoneVerified: !!user.phone_confirmed_at,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at,
        },
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  /**
   * @desc Logout user (invalidate token on client side)
   * @route POST /api/auth/logout
   * @access Private
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // In a stateless JWT implementation, logout is typically handled client-side
      // by removing the token from storage. However, you can add server-side logic here
      // such as adding the token to a blacklist if needed.

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during logout",
      });
    }
  },

  /**
   * @desc Refresh JWT token
   * @route POST /api/auth/refresh
   * @access Private
   */
  async refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const userEmail = req.userEmail;

      if (!userId || !userEmail) {
        res.status(401).json({
          success: false,
          message: "Invalid token data",
        });
        return;
      }

      // Verify user still exists and is active
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          deleted_at: true,
          banned_until: true,
        },
      });

      if (
        !user ||
        user.deleted_at ||
        (user.banned_until && user.banned_until > new Date())
      ) {
        res.status(401).json({
          success: false,
          message: "User account is no longer active",
        });
        return;
      }

      // Generate new token
      const tokenPayload: JwtPayload = {
        userId: user.id,
        email: user.email!,
      };

      const newToken = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "7d",
        issuer: "your-app-name",
        audience: "your-app-users",
      });

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        token: newToken,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during token refresh",
      });
    }
  },
};
