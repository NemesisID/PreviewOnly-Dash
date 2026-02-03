"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createOrder, deleteOrder, updateOrderStatus } from "./actions";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    category: string;
  };
};

type Order = {
  id: number;
  tracking_code: string;
  code: string;
  receipt_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  customer_city: string | null;
  customer_province: string | null;
  customer_postal_code: string | null;
  total_price: number;
  status: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  source: "web" | "shopee" | "tiktok";
  shipping_courier: string;
  createdAt: string;
  items: OrderItem[];
};

type DeleteState = { id: number; code: string } | null;

type HighlightState = { id?: number; code?: string } | null;

const statusLabel: Record<Order["status"], string> = {
  pending: "Pending",
  processing: "Di Proses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const statusVariant: Record<
  Order["status"],
  "warning" | "info" | "success" | "danger" | "neutral"
> = {
  pending: "warning",
  processing: "info",
  shipped: "success",
  completed: "success",
  cancelled: "danger",
};

const sourceLabel: Record<Order["source"], string> = {
  web: "Website",
  shopee: "Shopee",
  tiktok: "TikTok",
};

export default function OrdersView({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [view, setView] = useState<"table" | "grid">("table");
  const [highlight, setHighlight] = useState<HighlightState>(null);
  const [deleteOrderState, setDeleteOrderState] = useState<DeleteState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [exportStatus, setExportStatus] = useState("all");
  const [exportSource, setExportSource] = useState("all");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("highlight");
    const idParam = searchParams.get("highlightId");
    const id = idParam ? Number(idParam) : null;
    if (!code && !id) return;

    setQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
    setView("table");

    setHighlight({ id: id ?? undefined, code: code ?? undefined });

    const timer = setTimeout(() => setHighlight(null), 2000);
    const scrollTimer = setTimeout(() => {
      const target = id
        ? document.querySelector(`[data-order-id="${id}"]`)
        : code
          ? document.querySelector(`[data-order-code="${code}"]`)
          : null;
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(scrollTimer);
    };
  }, [searchParams]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !term ||
        `${order.code} ${order.customer_name} ${order.customer_phone} ${order.tracking_code} ${order.receipt_number}`
          .toLowerCase()
          .includes(term);
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesSource =
        sourceFilter === "all" || order.source === sourceFilter;
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [orders, query, statusFilter, sourceFilter]);

  const copyTracking = async (tracking: string) => {
    const link = `https://kojain.store/track/${tracking}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Copied", description: link });
  };

  const handleStatusChange = async (
    id: number,
    status: "processing" | "shipped" | "completed" | "cancelled",
    reset: () => void
  ) => {
    try {
      await updateOrderStatus(id, status);
      toast({ title: "Status updated" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update status.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      reset();
    }
  };

  const isHighlighted = (order: Order) => {
    if (!highlight) return false;
    if (highlight.id && order.id === highlight.id) return true;
    if (highlight.code && order.code === highlight.code) return true;
    return false;
  };

  const filteredForExport = useMemo(() => {
    const startDate = exportStart ? new Date(exportStart) : null;
    const endDate = exportEnd ? new Date(exportEnd) : null;
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }
    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      const matchesStart = !startDate || createdAt >= startDate;
      const matchesEnd = !endDate || createdAt <= endDate;
      const matchesStatus =
        exportStatus === "all" || order.status === exportStatus;
      const matchesSource =
        exportSource === "all" || order.source === exportSource;
      return matchesStart && matchesEnd && matchesStatus && matchesSource;
    });
  }, [orders, exportStart, exportEnd, exportStatus, exportSource]);

  const exportExcel = () => {
    const rows = filteredForExport.map((order) => ({
      Code: order.code,
      Customer: order.customer_name,
      Phone: order.customer_phone,
      Total: order.total_price,
      Status: statusLabel[order.status],
      Source: sourceLabel[order.source],
      Created: new Date(order.createdAt).toLocaleString("id-ID"),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(
      workbook,
      `orders-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const exportPdf = async () => {
    const { PDFDocument, StandardFonts } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const titleSize = 16;
    const margin = 40;
    const lineHeight = 14;
    let { height } = page.getSize();
    let y = height - margin;

    page.drawText("Orders Recap", {
      x: margin,
      y,
      size: titleSize,
      font,
    });
    y -= titleSize + 10;

    const lines = filteredForExport.map((order) =>
      `${order.code} | ${order.customer_name} | ${statusLabel[order.status]} | Rp ${order.total_price.toLocaleString("id-ID")} | ${new Date(order.createdAt).toLocaleDateString("id-ID")}`
    );

    for (const line of lines) {
      if (y < margin) {
        page = pdfDoc.addPage([595.28, 841.89]);
        ({ height } = page.getSize());
        y = height - margin;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font });
      y -= lineHeight;
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Monitor order masuk, status pengiriman, dan detail customer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.refresh()}
            disabled={isPending}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setView(view === "grid" ? "table" : "grid")}
          >
            {view === "grid" ? "Table View" : "Grid View"}
          </Button>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            Export
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            Create Shopee/TikTok Order
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
          <Input
            placeholder="Search by code, customer, phone, tracking"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Di Proses</option>
            <option value="shipped">Dikirim</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Sources</option>
            <option value="web">Website</option>
            <option value="shopee">Shopee</option>
            <option value="tiktok">TikTok</option>
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setSourceFilter("all");
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order) => {
            const isFinal =
              order.status === "completed" || order.status === "cancelled";
            const highlightActive = isHighlighted(order);
            return (
              <div
                key={order.id}
                data-order-id={order.id}
                data-order-code={order.code}
                className={
                  "rounded-xl border border-border bg-card p-4 shadow-sm transition " +
                  (highlightActive
                    ? "ring-2 ring-primary/50 bg-primary/10 animate-pulse"
                    : "")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{order.code}</p>
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer_phone}
                    </p>
                  </div>
                  <Badge variant={statusVariant[order.status]}>
                    {statusLabel[order.status]}
                  </Badge>
                </div>
                <div className="mt-3 text-sm">
                  <p className="text-muted-foreground">
                    Total:{" "}
                    <span className="font-semibold text-foreground">
                      Rp {order.total_price.toLocaleString("id-ID")}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="mt-3">
                  <Badge variant="neutral">{sourceLabel[order.source]}</Badge>
                </div>
                <div className="mt-4 grid gap-2">
                  <select
                    defaultValue=""
                    disabled={isFinal}
                    onChange={(event) => {
                      const target = event.currentTarget;
                      const value = event.target.value as
                        | "processing"
                        | "shipped"
                        | "completed"
                        | "cancelled";
                      handleStatusChange(order.id, value, () => {
                        if (target) {
                          target.value = "";
                        }
                      });
                    }}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="" disabled>
                      Update Status
                    </option>
                    <option value="processing">Di Proses</option>
                    <option value="shipped">Dikirim</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                  <div className="grid gap-2">
                    <Button variant="outline" onClick={() => setDetailOrder(order)}>
                      Detail
                    </Button>
                    <Button onClick={() => copyTracking(order.tracking_code)}>
                      Copy Tracking
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open("/dummy-resi.pdf", "_blank")}
                    >
                      Print Resi
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        setDeleteOrderState({ id: order.id, code: order.code })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Tidak ada order yang cocok dengan filter.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length} order ditemukan
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const isFinal =
                    order.status === "completed" || order.status === "cancelled";
                  const highlightActive = isHighlighted(order);

                  return (
                    <tr
                      key={order.id}
                      data-order-id={order.id}
                      data-order-code={order.code}
                      className={
                        "border-t border-border/70 transition " +
                        (highlightActive
                          ? "bg-primary/10 ring-2 ring-primary/40 ring-inset animate-pulse"
                          : "")
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.code}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.customer_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        Rp {order.total_price.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[order.status]}>
                          {statusLabel[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">
                          {sourceLabel[order.source]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <select
                            defaultValue=""
                            disabled={isFinal}
                            onChange={(event) => {
                              const target = event.currentTarget;
                              const value = event.target.value as
                                | "processing"
                                | "shipped"
                                | "completed"
                                | "cancelled";
                              handleStatusChange(order.id, value, () => {
                                if (target) {
                                  target.value = "";
                                }
                              });
                            }}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            <option value="" disabled>
                              Update Status
                            </option>
                            <option value="processing">Di Proses</option>
                            <option value="shipped">Dikirim</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailOrder(order)}
                          >
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => copyTracking(order.tracking_code)}
                          >
                            Copy Tracking
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open("/dummy-resi.pdf", "_blank")}
                          >
                            Print Resi
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              setDeleteOrderState({ id: order.id, code: order.code })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Tidak ada order yang cocok dengan filter.
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Shopee/TikTok Order"
        description="Input order manual dari Shopee atau TikTok."
        size="xl"
      >
        <form
          action={createOrder}
          className="grid gap-4 md:grid-cols-2"
          onSubmit={() => setCreateOpen(false)}
        >
          <Input name="code" placeholder="Order Code" required />
          <Input name="tracking_code" placeholder="Tracking Code" required />
          <Input name="receipt_number" placeholder="Receipt Number" required />
          <Input name="shipping_courier" placeholder="Courier" required />
          <Input name="customer_name" placeholder="Customer Name" required />
          <Input name="customer_phone" placeholder="Customer Phone" required />
          <Input name="customer_email" placeholder="Customer Email" />
          <Input name="customer_city" placeholder="City" />
          <Input name="customer_province" placeholder="Province" />
          <Input name="customer_postal_code" placeholder="Postal Code" />
          <Input
            name="total_price"
            type="number"
            placeholder="Total Price"
            required
          />
          <select
            name="source"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="shopee"
          >
            <option value="shopee">Shopee</option>
            <option value="tiktok">TikTok</option>
          </select>
          <Textarea
            name="customer_address"
            placeholder="Customer Address"
            className="md:col-span-2"
          />
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Orders"
        description="Atur range tanggal dan filter sebelum export."
        size="lg"
      >
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={exportStart}
                onChange={(event) => setExportStart(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={exportEnd}
                onChange={(event) => setExportEnd(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={exportStatus}
                onChange={(event) => setExportStatus(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Di Proses</option>
                <option value="shipped">Dikirim</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <select
                value={exportSource}
                onChange={(event) => setExportSource(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Sources</option>
                <option value="web">Website</option>
                <option value="shopee">Shopee</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            {filteredForExport.length} order akan diexport.
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={exportPdf}>
              Download PDF
            </Button>
            <Button onClick={exportExcel}>Download Excel</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(detailOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailOrder(null);
          }
        }}
        title={detailOrder ? `Order ${detailOrder.code}` : "Order Detail"}
        description="Detail lengkap pesanan dan alamat pengiriman customer."
        size="xl"
      >
        {detailOrder ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold">Customer</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Nama</p>
                    <p className="font-medium">{detailOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telepon</p>
                    <p>{detailOrder.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p>{detailOrder.customer_email ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alamat</p>
                    <p>{detailOrder.customer_address ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        detailOrder.customer_city,
                        detailOrder.customer_province,
                        detailOrder.customer_postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold">Items</h3>
                <div className="mt-3 space-y-3">
                  {detailOrder.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada item pada order ini.
                    </p>
                  ) : (
                    detailOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.product.category} · {item.quantity} pcs
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold">Shipping</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Courier</p>
                    <p>{detailOrder.shipping_courier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receipt</p>
                    <p>{detailOrder.receipt_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tracking</p>
                    <p>{detailOrder.tracking_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p>{sourceLabel[detailOrder.source]}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold">Summary</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusVariant[detailOrder.status]}>
                      {statusLabel[detailOrder.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">
                      Rp {detailOrder.total_price.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>
                      {new Date(detailOrder.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteOrderState)}
        onOpenChange={(open) => {
          if (!open) setDeleteOrderState(null);
        }}
        title={
          deleteOrderState
            ? `Hapus order ${deleteOrderState.code}?`
            : "Hapus order"
        }
        description="Order akan dihapus permanen dari sistem."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!deleteOrderState) return;
          startTransition(async () => {
            await deleteOrder(deleteOrderState.id);
            router.refresh();
            setDeleteOrderState(null);
          });
        }}
      />
    </div>
  );
}
