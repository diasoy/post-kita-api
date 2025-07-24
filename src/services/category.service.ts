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
};
