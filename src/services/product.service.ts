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
};
