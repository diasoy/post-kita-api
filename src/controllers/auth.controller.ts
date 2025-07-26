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
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name }: RegisterRequest = req.body || {};

      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          message: "Email, password, and name are required",
        });
        return;
      }

      if (!validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
        return;
      }

      if (!validateName(name)) {
        res.status(400).json({
          success: false,
          message: "Name must be between 2 and 50 characters",
        });
        return;
      }

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

      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const userId = uuidv4();

      const newUser = await prisma.users.create({
        data: {
          id: userId,
          email: email.toLowerCase(),
          encrypted_password: hashedPassword,
          raw_user_meta_data: {
            name: name.trim(),
          },
          email_confirmed_at: new Date(), 
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      const tokenPayload: JwtPayload = {
        userId: newUser.id,
        email: newUser.email!,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "7d", 
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

  
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
        return;
      }

      if (!validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
        return;
      }

      const user = await prisma.users.findFirst({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.encrypted_password) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      if (user.deleted_at) {
        res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
        return;
      }

      if (user.banned_until && user.banned_until > new Date()) {
        res.status(403).json({
          success: false,
          message: "Account is temporarily suspended",
        });
        return;
      }

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

      await prisma.users.update({
        where: { id: user.id },
        data: {
          last_sign_in_at: new Date(),
          updated_at: new Date(),
        },
      });

      const tokenPayload: JwtPayload = {
        userId: user.id,
        email: user.email!,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "7d", 
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


  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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