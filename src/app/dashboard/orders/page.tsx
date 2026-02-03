import { prisma } from "@/lib/prisma";
import OrdersView from "./view";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  const serialized = orders.map((order) => ({
    id: order.id,
    code: order.code,
    tracking_code: order.tracking_code,
    receipt_number: order.receipt_number,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    customer_address: order.customer_address,
    customer_city: order.customer_city,
    customer_province: order.customer_province,
    customer_postal_code: order.customer_postal_code,
    total_price: order.total_price,
    status: order.status,
    source: order.source,
    shipping_courier: order.shipping_courier,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.product.id,
        name: item.product.name,
        category: item.product.category,
      },
    })),
  }));

  return <OrdersView orders={serialized} />;
}
