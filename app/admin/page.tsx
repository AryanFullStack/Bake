import Link from "next/link";
import {
  BarChart3, Cake, ChevronRight, ClipboardList, FolderPlus, FolderTree, Package,
  PackagePlus, ShieldCheck, ShoppingBag, Sparkles, Star, Tag, Users, UtensilsCrossed, Watch, Home, Wheat,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPKR } from "@/lib/catalog";

const liveStatuses = ["placed", "confirmed", "processing", "baking", "ready", "out_for_delivery", "delivered"];
const statusLabel = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [orders, customers, products, categories, cakes, reviews, payments, lowStock, recent, topItems, activeDeals] = await Promise.all([
    supabase.from("orders").select("id,total,status,customer_name,order_number,created_at,payment_method").order("created_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id,name,slug,parent_id").order("sort_order"),
    supabase.from("custom_cake_requests").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review", "quotation_prepared", "confirmation_required"]),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending_verification"),
    supabase.from("products").select("id,name,stock_quantity,low_stock_threshold").order("stock_quantity").limit(1000),
    supabase.from("orders").select("order_number,customer_name,total,status,payment_method,created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("order_items").select("product_name,quantity,line_total").limit(500),
    supabase.from("products").select("id,name,price,sale_price,is_published,featured_image,categories:category_id(name)").not("sale_price", "is", null).eq("is_published", true).order("sale_price").limit(5),
  ]);

  const saleTotal = (orders.data ?? []).filter((row: any) => liveStatuses.includes(row.status)).reduce((sum: number, row: any) => sum + Number(row.total), 0);
  const lowStockRows = (lowStock.data ?? []).filter((row: any) => row.stock_quantity <= row.low_stock_threshold).slice(0, 8);
  const itemTotals = new Map<string, { quantity: number; revenue: number }>();
  for (const item of topItems.data ?? []) {
    const current = itemTotals.get(item.product_name) ?? { quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += Number(item.line_total);
    itemTotals.set(item.product_name, current);
  }
  const top = [...itemTotals.entries()].sort((a, b) => b[1].quantity - a[1].quantity).slice(0, 5);

  const dealRows = activeDeals.data ?? [];

  const stats = [
    { label: "Sales in live orders", value: formatPKR(saleTotal), note: `${orders.data?.length ?? 0} recent orders`, color: "text-orange" },
    { label: "Total Catalog Items", value: String(products.count ?? 0), note: "Products in store database", color: "text-navy" },
    { label: "Active Deals", value: String(dealRows.length), note: "Products currently on sale", color: "text-green", href: "/admin/products?filter=deals" },
    { label: "Custom Cake Requests", value: String(cakes.count ?? 0), note: "Awaiting decorator review", color: "text-orange" },
  ];

  const parentCats = (categories.data ?? []).filter((c: any) => !c.parent_id);

  return (
    <div className="p-5 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Live Operations & Management</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-navy">Good morning, Admin.</h1>
          <p className="mt-2 text-sm text-muted">Complete control over your products, categories, orders and custom cake studio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/categories" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-extrabold text-navy hover:border-orange hover:text-orange shadow-xs">
            <FolderPlus size={15} className="text-orange" /> Manage Categories
          </Link>
          <Link href="/admin/products" className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-xs font-extrabold text-white hover:bg-orange-dark shadow-md">
            <PackagePlus size={15} /> Add Product
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat: any) => (
          stat.href ? (
            <Link key={stat.label} href={stat.href} className="border border-line bg-white p-5 shadow-[0_8px_24px_rgba(6,33,54,.04)] hover:border-orange/40 hover:shadow-md transition-all" style={{ borderRadius: "var(--radius-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">{stat.label}</p>
              <p className={`mt-4 font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-xs text-muted">{stat.note}</p>
            </Link>
          ) : (
            <div key={stat.label} className="border border-line bg-white p-5 shadow-[0_8px_24px_rgba(6,33,54,.04)]" style={{ borderRadius: "var(--radius-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">{stat.label}</p>
              <p className={`mt-4 font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-xs text-muted">{stat.note}</p>
            </div>
          )
        ))}
      </div>

      {/* Main Grid: Orders + Needs Attention */}
      <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 xl:col-span-7 border border-line bg-white p-5 shadow-[0_8px_24px_rgba(6,33,54,.04)] md:p-6" style={{ borderRadius: "var(--radius-card)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">The latest</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-navy">Recent orders</h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-extrabold text-orange flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-line text-[10px] font-extrabold uppercase tracking-[.13em] text-muted">
                <tr>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recent.data ?? []).map((order: any) => (
                  <tr key={order.order_number} className="border-b border-line/60 last:border-0">
                    <td className="py-4 font-extrabold text-navy">{order.order_number}</td>
                    <td className="py-4 text-muted">{order.customer_name}</td>
                    <td className="py-4 font-bold text-navy">{formatPKR(order.total)}</td>
                    <td className="py-4">
                      <span className="inline-flex rounded-md bg-green-light px-2.5 py-1 text-[11px] font-extrabold text-green">
                        {statusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recent.data?.length && <p className="p-8 text-center text-sm text-muted">No orders have been placed yet.</p>}
          </div>
        </section>

        <section className="lg:col-span-5 xl:col-span-5 pattern-navy-dots bg-navy p-6 md:p-7 text-white flex flex-col justify-between" style={{ borderRadius: "var(--radius-card)" }}>
          <div>
            <p className="eyebrow text-orange">Needs attention</p>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-tight">Keep things moving.</h2>
            <div className="mt-6 flex flex-col gap-3 min-w-0">
              <Alert icon={ClipboardList} title={`${payments.count ?? 0} bank transfers`} detail="Awaiting verification" href="/admin/orders" />
              <Alert icon={Package} title={`${lowStockRows.length} low-stock products`} detail="Review inventory levels" href="/admin/products?stock_status=low_stock" />
              <Alert icon={Star} title={`${reviews.count ?? 0} pending reviews`} detail="Ready for moderation" href="/admin/reviews" />
            </div>
          </div>
          <Link href="/admin/orders" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-orange hover:translate-x-1 transition-transform">
            Review queues <ChevronRight size={14} />
          </Link>
        </section>
      </div>

      {/* Category Overview & Quick Management Shortcuts */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 xl:col-span-7 border border-line bg-white p-5 shadow-[0_8px_24px_rgba(6,33,54,.04)] md:p-6" style={{ borderRadius: "var(--radius-card)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Store Categories</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-navy">Category Breakdown</h2>
            </div>
            <Link href="/admin/categories" className="text-xs font-extrabold text-orange flex items-center gap-1">
              Category Manager <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {parentCats.length ? parentCats.map((cat: any) => {
              const subs = (categories.data ?? []).filter((c: any) => c.parent_id === cat.id);
              return (
                <Link
                  key={cat.id}
                  href={`/admin/products?category_id=${cat.id}`}
                  className="p-4 rounded-xl border border-line bg-cream/30 hover:border-orange hover:bg-orange-light/20 transition-all group"
                >
                  <span className="block text-xs font-bold text-navy group-hover:text-orange transition-colors">{cat.name}</span>
                  <span className="block text-[11px] text-muted font-mono mt-0.5">/{cat.slug}</span>
                  <span className="inline-block mt-2 text-[10px] font-extrabold text-orange">
                    {subs.length} subcategories
                  </span>
                </Link>
              );
            }) : (
              <p className="text-sm text-muted col-span-3">No categories found. Click Category Manager to create or seed presets.</p>
            )}
          </div>
        </section>

        <section className="lg:col-span-5 xl:col-span-5 grid content-start gap-3">
          <Quick href="/admin/categories" icon={FolderTree} title="Category Management" detail="Add parent categories & subcategories" />
          <Quick href="/admin/products" icon={Package} title="Manage Products" detail="Catalog, pricing, stock and variations" />
          <Quick href="/admin/products?filter=deals" icon={Tag} title="Deals & Promotions" detail="Products with active sale prices" />
          <Quick href="/admin/orders" icon={ShoppingBag} title="Order Operations" detail="Statuses, tracking & payments" />
          <Quick href="/admin/custom-cakes" icon={Cake} title="Custom Cake Studio" detail="Requests, quotes and baking schedule" />
        </section>
      </div>

      {/* Current Deals Preview Table */}
      {dealRows.length > 0 && (
        <div className="mt-6">
          <section className="border border-line bg-white p-5 shadow-[0_8px_24px_rgba(6,33,54,.04)] md:p-6" style={{ borderRadius: "var(--radius-card)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="eyebrow">Live on Storefront</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-navy">Current Deals</h2>
              </div>
              <Link href="/admin/products?filter=deals" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange">
                Manage Deals <ChevronRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-[10px] font-extrabold uppercase tracking-[.13em] text-muted">
                  <tr>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Regular Price</th>
                    <th className="pb-3">Sale Price</th>
                    <th className="pb-3">Discount</th>
                    <th className="pb-3 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {dealRows.map((deal: any) => {
                    const discount = deal.price > 0 ? Math.round(((deal.price - deal.sale_price) / deal.price) * 100) : 0;
                    const catName = Array.isArray(deal.categories) ? deal.categories[0]?.name : deal.categories?.name;
                    return (
                      <tr key={deal.id} className="border-b border-line/60 last:border-0">
                        <td className="py-3.5 font-bold text-navy max-w-[180px] truncate">{deal.name}</td>
                        <td className="py-3.5 text-muted text-xs">{catName ?? "—"}</td>
                        <td className="py-3.5 text-muted line-through text-xs">{formatPKR(deal.price)}</td>
                        <td className="py-3.5 font-bold text-green">{formatPKR(deal.sale_price)}</td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center rounded-full bg-orange/10 px-2.5 py-0.5 text-[11px] font-extrabold text-orange">
                            -{discount}%
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <Link href={`/admin/products?search=${encodeURIComponent(deal.name)}`} className="text-[11px] font-extrabold text-orange hover:underline">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Alert({ icon: Icon, title, detail, href }: { icon: any; title: string; detail: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 rounded-xl bg-white/10 p-3.5 sm:p-4 hover:bg-white/15 hover:translate-x-1 transition-all group border border-white/5 min-w-0"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange/20 text-orange group-hover:bg-orange group-hover:text-white transition-colors">
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white group-hover:text-orange-light transition-colors">{title}</span>
        <span className="mt-0.5 block text-xs text-white/60">{detail}</span>
      </span>
      <ChevronRight size={15} className="ml-auto shrink-0 text-white/40 group-hover:text-orange group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function Quick({ href, icon: Icon, title, detail }: { href: string; icon: any; title: string; detail: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border border-line bg-white p-4 transition hover:border-orange hover:shadow-[0_8px_22px_rgba(6,33,54,.07)]"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-light text-orange">
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-sm font-extrabold text-navy">{title}</span>
        <span className="mt-1 block text-xs text-muted">{detail}</span>
      </span>
      <ChevronRight size={15} className="ml-auto text-muted" />
    </Link>
  );
}

export const dynamic = "force-dynamic";
