"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, deleteProduct, updateProduct } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_path: string;
  is_active: boolean;
};

type DeleteState = { id: number; name: string } | null;

export default function ProductsView({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductState, setDeleteProductState] =
    useState<DeleteState>(null);
  const [view, setView] = useState<"table" | "grid">("grid");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean))
    );
    return values;
  }, [products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !term ||
        `${product.name} ${product.category} ${product.description}`
          .toLowerCase()
          .includes(term);
      const matchesCategory =
        category === "all" || product.category === category;
      const matchesStatus =
        status === "all" ||
        (status === "active" ? product.is_active : !product.is_active);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, category, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            Kelola katalog produk dan visibilitas menu.
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
          <Button onClick={() => setCreateOpen(true)}>Create Product</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.6fr_auto]">
          <div className="relative">
            <Input
              placeholder="Search by name, category, description"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setStatus("all");
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id} className="border-border/70 bg-card">
              <CardContent className="p-4">
                <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={product.image_path}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <Badge variant={product.is_active ? "success" : "neutral"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.category}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-sm font-semibold">
                    Rp {product.price.toLocaleString("id-ID")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetailProduct(product)}
                    >
                      Detail
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditProduct(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        setDeleteProductState({
                          id: product.id,
                          name: product.name,
                        })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Tidak ada produk yang cocok dengan filter.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length} produk ditemukan
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-t border-border/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border bg-muted">
                          <Image
                            src={product.image_path}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3 font-medium">
                      Rp {product.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.is_active ? "success" : "neutral"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailProduct(product)}
                        >
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditProduct(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            setDeleteProductState({
                              id: product.id,
                              name: product.name,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Tidak ada produk yang cocok dengan filter.
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Product"
        description="Tambahkan produk baru ke katalog."
        size="lg"
      >
        <form
          action={createProduct}
          className="grid gap-4 md:grid-cols-2"
          onSubmit={() => setCreateOpen(false)}
        >
          <Input name="name" placeholder="Name" required />
          <Input name="category" placeholder="Category" required />
          <Input name="price" type="number" placeholder="Price" required />
          <Input name="image" type="file" accept="image/*" required />
          <Textarea
            name="description"
            placeholder="Description"
            required
            className="md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input name="is_active" type="checkbox" defaultChecked />
            Active
          </label>
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
        open={Boolean(detailProduct)}
        onOpenChange={(open) => {
          if (!open) setDetailProduct(null);
        }}
        title={detailProduct ? detailProduct.name : "Product Detail"}
        description="Detail produk."
        size="lg"
      >
        {detailProduct ? (
          <div className="space-y-3 text-sm">
            <div className="relative h-48 w-full overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={detailProduct.image_path}
                alt={detailProduct.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium">{detailProduct.category}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p>{detailProduct.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={detailProduct.is_active ? "success" : "neutral"}>
                {detailProduct.is_active ? "Active" : "Inactive"}
              </Badge>
              <span className="font-semibold">
                Rp {detailProduct.price.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(editProduct)}
        onOpenChange={(open) => {
          if (!open) setEditProduct(null);
        }}
        title={editProduct ? `Edit ${editProduct.name}` : "Edit Product"}
        description="Perbarui data produk."
        size="lg"
      >
        {editProduct ? (
          <form
            action={updateProduct.bind(null, editProduct.id)}
            className="grid gap-4 md:grid-cols-2"
            onSubmit={() => setEditProduct(null)}
          >
            <Input
              name="name"
              placeholder="Name"
              defaultValue={editProduct.name}
              required
            />
            <Input
              name="category"
              placeholder="Category"
              defaultValue={editProduct.category}
              required
            />
            <Input
              name="price"
              type="number"
              placeholder="Price"
              defaultValue={editProduct.price}
              required
            />
            <Input name="image" type="file" accept="image/*" />
            <Textarea
              name="description"
              placeholder="Description"
              defaultValue={editProduct.description}
              required
              className="md:col-span-2"
            />
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editProduct.is_active}
              />
              Active
            </label>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditProduct(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteProductState)}
        onOpenChange={(open) => {
          if (!open) setDeleteProductState(null);
        }}
        title={
          deleteProductState
            ? `Hapus produk ${deleteProductState.name}?`
            : "Hapus produk"
        }
        description="Produk akan dihapus permanen dari sistem."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!deleteProductState) return;
          startTransition(async () => {
            await deleteProduct(deleteProductState.id);
            router.refresh();
            setDeleteProductState(null);
          });
        }}
      />
    </div>
  );
}
