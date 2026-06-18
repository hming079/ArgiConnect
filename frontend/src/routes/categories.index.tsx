import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { categoryList, categoryGroups } from "@/lib/mock-data";

export const Route = createFileRoute("/categories/")({
  head: () => ({ meta: [{ title: "Danh mục nông sản – AgriConnect" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [group, setGroup] = useState<string>("Tất cả");
  const filtered = group === "Tất cả" ? categoryList : categoryList.filter((c) => c.group === group);

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Danh mục</div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Loại nông sản</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Khám phá các nhóm nông sản theo trái cây, rau củ, cây công nghiệp, lúa gạo và thủy sản.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {categoryGroups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                group === g ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-primary-soft"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/categories/$id"
              params={{ id: c.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={c.image} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                  {c.group}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{c.name}</h3>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" /> {c.itemCount}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
