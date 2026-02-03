"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOutlet, deleteOutlet, updateOutlet } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type Outlet = {
  id: number;
  name: string;
  type: string;
  address: string;
  google_maps_link: string;
  latitude: number;
  longitude: number;
  image_path: string;
};

type DeleteState = { id: number; name: string } | null;

export default function OutletsView({ outlets }: { outlets: Outlet[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOutlet, setDetailOutlet] = useState<Outlet | null>(null);
  const [editOutlet, setEditOutlet] = useState<Outlet | null>(null);
  const [deleteOutletState, setDeleteOutletState] =
    useState<DeleteState>(null);
  const [view, setView] = useState<"table" | "grid">("grid");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const types = useMemo(() => {
    const values = Array.from(
      new Set(outlets.map((outlet) => outlet.type).filter(Boolean))
    );
    return values;
  }, [outlets]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return outlets.filter((outlet) => {
      const matchesQuery =
        !term ||
        `${outlet.name} ${outlet.type} ${outlet.address}`
          .toLowerCase()
          .includes(term);
      const matchesType = type === "all" || outlet.type === type;
      return matchesQuery && matchesType;
    });
  }, [outlets, query, type]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Outlets</h2>
          <p className="text-sm text-muted-foreground">
            Pantau lokasi outlet dan data koordinatnya.
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
          <Button onClick={() => setCreateOpen(true)}>Create Outlet</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_auto]">
          <Input
            placeholder="Search by name, type, address"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Types</option>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuery("");
              setType("all");
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((outlet) => (
            <Card key={outlet.id} className="border-border/70 bg-card">
              <CardContent className="p-4">
                <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={outlet.image_path}
                    alt={outlet.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{outlet.name}</h3>
                    <Badge variant="info">{outlet.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {outlet.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {outlet.latitude.toFixed(4)}, {outlet.longitude.toFixed(4)}
                  </p>
                  <a
                    href={outlet.google_maps_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary"
                  >
                    Open in Maps
                  </a>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetailOutlet(outlet)}
                    >
                      Detail
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditOutlet(outlet)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        setDeleteOutletState({ id: outlet.id, name: outlet.name })
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
              Tidak ada outlet yang cocok dengan filter.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length} outlet ditemukan
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Outlet</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Coordinates</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((outlet) => (
                  <tr key={outlet.id} className="border-t border-border/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border bg-muted">
                          <Image
                            src={outlet.image_path}
                            alt={outlet.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{outlet.name}</div>
                          <a
                            href={outlet.google_maps_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary"
                          >
                            Open in Maps
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{outlet.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {outlet.address}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {outlet.latitude.toFixed(4)}, {outlet.longitude.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailOutlet(outlet)}
                        >
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditOutlet(outlet)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            setDeleteOutletState({ id: outlet.id, name: outlet.name })
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
                Tidak ada outlet yang cocok dengan filter.
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Outlet"
        description="Tambahkan lokasi outlet baru beserta tautan Google Maps."
        size="lg"
      >
        <form
          action={createOutlet}
          className="grid gap-4 md:grid-cols-2"
          onSubmit={() => setCreateOpen(false)}
        >
          <Input name="name" placeholder="Outlet Name" required />
          <Input name="type" placeholder="Type" required />
          <Input name="image" type="file" accept="image/*" required />
          <Input
            name="google_maps_link"
            placeholder="Google Maps Link"
            required
            className="md:col-span-2"
          />
          <Textarea
            name="address"
            placeholder="Address"
            required
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
        open={Boolean(detailOutlet)}
        onOpenChange={(open) => {
          if (!open) setDetailOutlet(null);
        }}
        title={detailOutlet ? detailOutlet.name : "Outlet Detail"}
        description="Detail outlet."
        size="lg"
      >
        {detailOutlet ? (
          <div className="space-y-3 text-sm">
            <div className="relative h-48 w-full overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={detailOutlet.image_path}
                alt={detailOutlet.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium">{detailOutlet.type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p>{detailOutlet.address}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Coordinates</p>
              <p>
                {detailOutlet.latitude.toFixed(4)}, {detailOutlet.longitude.toFixed(4)}
              </p>
            </div>
            <a
              href={detailOutlet.google_maps_link}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary"
            >
              Open in Maps
            </a>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(editOutlet)}
        onOpenChange={(open) => {
          if (!open) setEditOutlet(null);
        }}
        title={editOutlet ? `Edit ${editOutlet.name}` : "Edit Outlet"}
        description="Perbarui data outlet."
        size="lg"
      >
        {editOutlet ? (
          <form
            action={updateOutlet.bind(null, editOutlet.id)}
            className="grid gap-4 md:grid-cols-2"
            onSubmit={() => setEditOutlet(null)}
          >
            <Input
              name="name"
              placeholder="Outlet Name"
              defaultValue={editOutlet.name}
              required
            />
            <Input
              name="type"
              placeholder="Type"
              defaultValue={editOutlet.type}
              required
            />
            <Input name="image" type="file" accept="image/*" />
            <Input
              name="google_maps_link"
              placeholder="Google Maps Link"
              defaultValue={editOutlet.google_maps_link}
              required
              className="md:col-span-2"
            />
            <Textarea
              name="address"
              placeholder="Address"
              defaultValue={editOutlet.address}
              required
              className="md:col-span-2"
            />
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOutlet(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteOutletState)}
        onOpenChange={(open) => {
          if (!open) setDeleteOutletState(null);
        }}
        title={
          deleteOutletState
            ? `Hapus outlet ${deleteOutletState.name}?`
            : "Hapus outlet"
        }
        description="Outlet akan dihapus permanen dari sistem."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!deleteOutletState) return;
          startTransition(async () => {
            await deleteOutlet(deleteOutletState.id);
            router.refresh();
            setDeleteOutletState(null);
          });
        }}
      />
    </div>
  );
}
