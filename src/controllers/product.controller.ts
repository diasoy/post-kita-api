import { Request, Response } from "express";
import productService from "../services/product.service";



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

  // async create(req: MulterRequest, res: Response) {
  //   try {
  //     const { name, price, category_id, description } = req.body;
  //     if (!name || !price) {
  //       return res.status(400).json({ message: "Name and price are required" });
  //     }
  //     if (isNaN(Number(price)) || Number(price) < 0) {
  //       return res.status(400).json({ message: "Price must be a non-negative number" });
  //     }

  //     const file = req.file;
  //     if (!file) {
  //       return res.status(400).json({ message: "Image file is required" });
  //     }
  //     const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  //     if (!allowedTypes.includes(file.mimetype)) {
  //       return res.status(400).json({ message: "Only jpg, jpeg, png files are allowed" });
  //     }

  //     let imageBuffer = file.buffer;
  //     let imageSize = file.size;
  //     // Kompres jika > 1MB
  //     if (imageSize > 1024 * 1024) {
  //       const sharp = require("sharp");
  //       imageBuffer = await sharp(file.buffer)
  //         .jpeg({ quality: 70 })
  //         .toBuffer();
  //     }

  //     // Upload ke Supabase Storage
  //     const { createClient } = require("@supabase/supabase-js");
  //     const supabaseUrl = process.env.SUPABASE_URL;
  //     const supabaseKey = process.env.SUPABASE_KEY;
  //     const supabase = createClient(supabaseUrl, supabaseKey);
  //     const fileName = `products/${Date.now()}_${file.originalname}`;
  //     const { data, error: uploadError } = await supabase.storage
  //       .from("product-images")
  //       .upload(fileName, imageBuffer, {
  //         contentType: file.mimetype,
  //         upsert: true,
  //       });
  //     if (uploadError) {
  //       return res.status(500).json({ message: "Failed to upload image", error: uploadError.message });
  //     }
  //     const { publicUrl } = supabase.storage.from("product-images").getPublicUrl(fileName).data;

  //     const product = await productService.create({
  //       name,
  //       price: Number(price),
  //       category_id: category_id ? Number(category_id) : null,
  //       description,
  //       image_url: publicUrl,
  //     });
  //     res.status(201).json({
  //       message: "Product created successfully",
  //       data: product,
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       message: "Internal Server Error",
  //       error: error instanceof Error ? error.message : "An unknown error occurred",
  //     });
  //   }
  // }

};
