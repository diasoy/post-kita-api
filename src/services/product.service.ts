import prisma from "../lib/prisma";

export default {
  async getAll() {
    const products = await prisma.products.findMany({
      include: {
        categories: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });
    return products;
  },

  async findById(id: number) {
    const product = await prisma.products.findUnique({
      where: { id },
      include: {
        categories: true,
      },
    });
    return product;
  },

  async findByName(name: string) {
    const products = await prisma.products.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
      include: {
        categories: true,
      },
    });
    return products;
  },

  async create(data: {
    name: string;
    price: number;
    category_id: number | null;
    description: string;
    image_url: string;
  }) {
    const product = await prisma.products.create({
      data,
    });
    return product;
  }
};
