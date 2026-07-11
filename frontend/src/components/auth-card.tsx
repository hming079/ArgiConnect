import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { PageShell } from "@/components/site-layout";

export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <PageShell hideHeader>
    <main className="grid min-h-screen place-items-center bg-hero-gradient px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-7 shadow-soft">
        <Link to="/" className="mb-6 flex items-center gap-2 font-bold text-primary"><Sprout className="h-6 w-6" /> AgriConnect</Link>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  </PageShell>;
}
