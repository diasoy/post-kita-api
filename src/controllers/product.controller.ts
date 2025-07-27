import { Request, Response } from "express";
import productService from "../services/product.service";
import sharp from "sharp";
import { MulterRequest } from "../types/multer.types";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export default {
  async findAll(req: Request, res: Response) {
    try {
      const products = await productService.getAll();
      res.status(200).json({
        message: "Successfully fetched all products.",
        data: products,
        totalProduct: products.length,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  },

  async findById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const product = await productService.findById(Number(id));
      if (!product) {
        return res.status(404).json({
          message: "Product not found!",
        });
      }
      res.status(200).json({
        message: "Successfully fetched product.",
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  },

  async findByName(req: Request, res: Response) {
    const { name } = req.query;
    try {
      if (!name || typeof name !== "string") {
        return res.status(400).json({
          message: "Product name is required and must be a string",
        });
      }
      const products = await productService.findByName(name);
      res.status(200).json({
        message: "Successfully fetched products by name.",
        data: products,
        totalProduct: products.length,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, price, category_id, description } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: User ID not found" });
      }

      // Validate input (existing validation)
      if (!name || !price) {
        return res.status(400).json({ message: "Name and price are required" });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // File type validation
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          message: "Only jpg, jpeg, png files are allowed",
        });
      }

      // Image processing
      let imageBuffer = file.buffer;
      if (file.size > 1024 * 1024) {
        imageBuffer = await sharp(file.buffer).jpeg({ quality: 70 }).toBuffer();
      }

      // Generate unique filename with user ID
      const fileName = `products/${userId}/${Date.now()}_${file.originalname}`;

      // Supabase Storage Upload with Service Role Key
      const { data, error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, imageBuffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload Error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image",
          error: uploadError.message,
        });
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(fileName);

      // Create product with image URL
      const product = await productService.create({
        name,
        price: Number(price),
        category_id: category_id ? Number(category_id) : null,
        description,
        image_url: publicUrl,
      });

      res.status(201).json({
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      console.error("Product Creation Error:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
