import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const statusConfig = [
  { key: "pending", label: "Pending", variant: "warning" },
  { key: "processing", label: "Di Proses", variant: "info" },
  { key: "shipped", label: "Dikirim", variant: "success" },
  { key: "completed", label: "Selesai", variant: "success" },
  { key: "cancelled", label: "Dibatalkan", variant: "danger" },
] as const;

export default async function DashboardPage() {
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const [
    productCount,
    outletCount,
    orderCount,
    pendingOrders,
    recentOrders,
    statusCounts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.outlet.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: "asc" },
    }),
    Promise.all(
      statusConfig.map((status) =>
        prisma.order.count({ where: { status: status.key } })
      )
    ),
  ]);

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const orders = recentOrders.filter(
      (order) => order.createdAt.toISOString().slice(0, 10) === key
    );
    const total = orders.reduce((sum, order) => sum + order.total_price, 0);
    return {
      label: date.toLocaleDateString("id-ID", { weekday: "short" }),
      count: orders.length,
      revenue: total,
    };
  });

  const maxCount = Math.max(...days.map((day) => day.count), 1);
  const maxRevenue = Math.max(...days.map((day) => day.revenue), 1);
  const maxStatus = Math.max(...statusCounts, 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Snapshot operasional KOJAIN hari ini.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Products
            </p>
            <div className="mt-3 text-3xl font-semibold">{productCount}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Active catalog items.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Outlets
            </p>
            <div className="mt-3 text-3xl font-semibold">{outletCount}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Live store locations.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Orders
            </p>
            <div className="mt-3 text-3xl font-semibold">{orderCount}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Total orders in system.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Order Volume (7 Hari)</h3>
                <p className="text-sm text-muted-foreground">
                  Jumlah order per hari.
                </p>
              </div>
              <Badge variant="info">{recentOrders.length} orders</Badge>
            </div>
            <div className="mt-6 grid grid-cols-7 items-end gap-2">
              {days.map((day) => (
                <div key={day.label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-primary/20"
                    style={{ height: `${(day.count / maxCount) * 120 + 8}px` }}
                  />
                  <div className="text-xs text-muted-foreground">
                    {day.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Revenue Trend</h3>
                <p className="text-sm text-muted-foreground">
                  Total revenue 7 hari terakhir.
                </p>
              </div>
              <Badge variant="success">Rp {maxRevenue.toLocaleString("id-ID")}</Badge>
            </div>
            <div className="mt-6 grid grid-cols-7 items-end gap-2">
              {days.map((day) => (
                <div key={day.label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-emerald-500/20"
                    style={{ height: `${(day.revenue / maxRevenue) * 120 + 8}px` }}
                  />
                  <div className="text-xs text-muted-foreground">
                    {day.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Order Status</h3>
                <p className="text-sm text-muted-foreground">
                  Distribusi status order.
                </p>
              </div>
              <Badge variant="neutral">{orderCount} total</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {statusConfig.map((status, idx) => {
                const value = statusCounts[idx];
                return (
                  <div key={status.key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{status.label}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(value / maxStatus) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pending Orders</h3>
                <p className="text-sm text-muted-foreground">
                  Antrian order yang butuh aksi cepat.
                </p>
              </div>
              <Badge variant="warning">{pendingOrders.length} items</Badge>
            </div>

            <div className="mt-4 space-y-2">
              {pendingOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tidak ada order pending.
                </p>
              ) : (
                pendingOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders?highlight=${order.code}&highlightId=${order.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div>
                      <div className="text-sm font-medium">{order.code}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.customer_name}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      Rp {order.total_price.toLocaleString("id-ID")}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
