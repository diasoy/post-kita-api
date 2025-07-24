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
};
