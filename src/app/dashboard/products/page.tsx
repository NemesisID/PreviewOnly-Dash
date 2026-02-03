import { prisma } from "@/lib/prisma";
import ProductsView from "./view";

export default async function ProductPage() {
  const products = await prisma.product.findMany({ orderBy: { id: "desc" } });

  return <ProductsView products={products} />;
}
