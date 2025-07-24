import { Request, Response } from "express";
import categoryService from "../services/category.service";

export default {
  async findAll(req: Request, res: Response) {
    try {
      const categories = await categoryService.getAll();
      res.status(200).json({
        message: "Successfully fetched all categories.",
        data: categories,
        totalCategory: categories.length,
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
