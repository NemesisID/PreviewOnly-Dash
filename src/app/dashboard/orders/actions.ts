"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createOrder(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  const tracking_code = String(formData.get("tracking_code") || "").trim();
  const receipt_number = String(formData.get("receipt_number") || "").trim();
  const customer_name = String(formData.get("customer_name") || "").trim();
  const customer_phone = String(formData.get("customer_phone") || "").trim();
  const customer_email = String(formData.get("customer_email") || "").trim();
  const customer_address = String(formData.get("customer_address") || "").trim();
  const customer_city = String(formData.get("customer_city") || "").trim();
  const customer_province = String(
    formData.get("customer_province") || ""
  ).trim();
  const customer_postal_code = String(
    formData.get("customer_postal_code") || ""
  ).trim();
  const shipping_courier = String(
    formData.get("shipping_courier") || ""
  ).trim();
  const source = String(formData.get("source") || "shopee") as
    | "web"
    | "shopee"
    | "tiktok";
  const total_price = Number(formData.get("total_price") || 0);

  if (
    !code ||
    !tracking_code ||
    !receipt_number ||
    !customer_name ||
    !customer_phone ||
    !shipping_courier ||
    Number.isNaN(total_price)
  ) {
    throw new Error("Please complete the required fields.");
  }

  const safeSource = ["shopee", "tiktok"].includes(source)
    ? source
    : "shopee";

  await prisma.order.create({
    data: {
      code,
      tracking_code,
      receipt_number,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      customer_address: customer_address || null,
      customer_city: customer_city || null,
      customer_province: customer_province || null,
      customer_postal_code: customer_postal_code || null,
      total_price,
      status: "pending",
      source: safeSource,
      shipping_courier,
    },
  });

  revalidatePath("/dashboard/orders");
}

export async function updateOrderStatus(
  orderId: number,
  status: "processing" | "shipped" | "completed" | "cancelled"
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.status === "completed" || order.status === "cancelled") {
    throw new Error("Order status sudah final dan tidak bisa diubah.");
  }

  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/dashboard/orders");
}

export async function deleteOrder(orderId: number) {
  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/dashboard/orders");
}
