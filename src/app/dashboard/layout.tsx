import DashboardNav from "@/components/dashboard-nav";
import ThemeToggle from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-border bg-card/80 px-4 py-6 lg:w-64 lg:border-b-0 lg:border-r lg:px-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">KOJAIN Dashboard</h1>
            </div>
            <DashboardNav />
          </div>
        </aside>
        <main className="flex-1 bg-[radial-gradient(70%_40%_at_0%_0%,rgba(59,130,246,0.08),transparent_60%)]">
          <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Dashboard
                </div>
                <div className="text-lg font-semibold">KOJAIN Operations</div>
              </div>
              <ThemeToggle />
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
