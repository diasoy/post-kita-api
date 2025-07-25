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
  async findById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const category = await categoryService.findById(Number(id));
      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }
      res.status(200).json({
        message: "Successfully fetched category.",
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  },
  async create(req: Request, res: Response) {
    const { name } = req.body;
    try {
      if (!name) {
        return res.status(400).json({
          message: "Category name is required",
        });
      }
      const category = await categoryService.create({ name });
      res.status(201).json({
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  },
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name } = req.body;
    try {
      if (!name) {
        return res.status(400).json({
          message: "Category name is required",
        });
      }
      const category = await categoryService.update(Number(id), { name });
      res.status(200).json({
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  },
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const category = await categoryService.delete(Number(id));
      res.status(200).json({
        message: "Category deleted successfully",
        data: category,
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
