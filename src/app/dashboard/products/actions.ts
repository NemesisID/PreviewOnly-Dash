"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/file-utils";

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") || "");
  const description = String(formData.get("description") || "");
  const price = Number(formData.get("price") || 0);
  const category = String(formData.get("category") || "");
  const is_active = formData.get("is_active") === "on";
  const image = formData.get("image") as File | null;

  if (!image || image.size === 0) {
    throw new Error("Image is required.");
  }

  const image_path = await saveFile(image, "uploads/products");

  await prisma.product.create({
    data: { name, description, price, category, is_active, image_path },
  });

  revalidatePath("/dashboard/products");
}

export async function updateProduct(id: number, formData: FormData) {
  const name = String(formData.get("name") || "");
  const description = String(formData.get("description") || "");
  const price = Number(formData.get("price") || 0);
  const category = String(formData.get("category") || "");
  const is_active = formData.get("is_active") === "on";
  const image = formData.get("image") as File | null;

  const data: {
    name: string;
    description: string;
    price: number;
    category: string;
    is_active: boolean;
    image_path?: string;
  } = { name, description, price, category, is_active };

  if (image && image.size > 0) {
    data.image_path = await saveFile(image, "uploads/products");
  }

  await prisma.product.update({ where: { id }, data });
  revalidatePath("/dashboard/products");
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/dashboard/products");
}
