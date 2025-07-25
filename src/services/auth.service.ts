import { Request, Response } from "express";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export default {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      const user = await prisma.users.findFirst({
        where: { email: email },
      });

      if (!user || !user.encrypted_password) {
        return res.status(404).json({
          message: "User not found or password not set",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.encrypted_password
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid password",
        });
      }

      if (!JWT_SECRET) {
        return res.status(500).json({
          message: "JWT secret is not configured",
        });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        JWT_SECRET as string,
        { expiresIn: "24h" }
      );

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        message: "Internal server error during login",
      });
    }
  },
};
