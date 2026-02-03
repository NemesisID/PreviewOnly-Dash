import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        success:
          "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
        warning:
          "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
        info: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
        danger:
          "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
        neutral:
          "bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
