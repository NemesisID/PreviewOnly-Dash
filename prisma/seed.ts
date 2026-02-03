import { PrismaClient, OrderSource, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

function randomTrackingCode(index: number) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRK-${Date.now()}-${index}-${rand}`;
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.outlet.deleteMany();

  const products = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.product.create({
        data: {
          name: `Product ${i + 1}`,
          description: `Tasty item number ${i + 1}`,
          price: 10000 + i * 1500,
          image_path: `https://placehold.co/600x400?text=Product+${i + 1}`,
          category: i % 2 === 0 ? "Food" : "Drink",
          is_active: true,
        },
      })
    )
  );

  await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.outlet.create({
        data: {
          name: `Outlet ${i + 1}`,
          type: i % 2 === 0 ? "Cafe" : "Kiosk",
          address: `Street ${i + 1}, Jakarta`,
          google_maps_link: "https://maps.google.com/?q=-6.200000,106.816666",
          latitude: -6.2 + i * 0.01,
          longitude: 106.816666 + i * 0.01,
          image_path: `https://placehold.co/600x400?text=Outlet+${i + 1}`,
        },
      })
    )
  );

  const sources: OrderSource[] = ["web", "shopee", "tiktok"];
  const statuses: OrderStatus[] = [
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ];

  for (let i = 0; i < 20; i += 1) {
    const source = sources[i % sources.length];
    const status = statuses[i % statuses.length];
    const itemsCount = 1 + (i % 3);
    const items = Array.from({ length: itemsCount }).map((_, idx) => {
      const product = products[(i + idx) % products.length];
      return {
        productId: product.id,
        quantity: 1 + ((i + idx) % 2),
        price: product.price,
      };
    });
    const total_price = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

      await prisma.order.create({
      data: {
        code: `ORD-${1000 + i}`,
        tracking_code: randomTrackingCode(i),
        receipt_number: `RCPT-${2000 + i}`,
        customer_name: `Customer ${i + 1}`,
        customer_phone: `0812-0000-${String(i).padStart(4, "0")}`,
        customer_email: `customer${i + 1}@example.com`,
        customer_address: `Jl. Melati No. ${i + 10}, Jakarta`,
        customer_city: "Jakarta",
        customer_province: "DKI Jakarta",
        customer_postal_code: `10${String(i).padStart(3, "0")}`,
        total_price,
        status,
        source,
        shipping_courier: i % 2 === 0 ? "JNE" : "J&T",
        items: {
          create: items,
        },
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
