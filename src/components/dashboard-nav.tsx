"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/outlets", label: "Outlets" },
  { href: "/dashboard/orders", label: "Orders" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-col gap-1 text-sm">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 transition",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span className="font-medium">{item.label}</span>
            {isActive ? (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
