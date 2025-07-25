import prisma from "../lib/prisma";

export default {
  async getAll() {
    const categories = await prisma.categories.findMany({
      orderBy: {
        created_at: "asc",
      },
    });
    return categories;
  },
  async findById(id: number) {
    const category = await prisma.categories.findUnique({
      where: { id },
    });
    return category;
  },
  async create(data: { name: string }) {
    const category = await prisma.categories.create({
      data,
    });
    return category;
  },
  async update(id: number, data: { name?: string }) {
    const category = await prisma.categories.update({
      where: { id },
      data,
    });
    return category;
  },
  async delete(id: number) {
    const category = await prisma.categories.delete({
      where: { id },
    });
    return category;
  },
};
