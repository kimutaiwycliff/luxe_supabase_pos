import Link from "next/link"
import {
  ShoppingCart,
  Package,
  ClipboardList,
  Sparkles,
  Layers,
  Users,
  BarChart2,
  Boxes,
} from "lucide-react"

const ACTIONS = [
  { href: "/pos",         label: "New Sale",       sub: "Open the POS",           icon: ShoppingCart, color: "text-emerald-500" },
  { href: "/orders",      label: "Orders",          sub: "View & manage",          icon: ClipboardList, color: "text-blue-500" },
  { href: "/products",    label: "Products",        sub: "Add or edit products",   icon: Package,      color: "text-orange-500" },
  { href: "/collections", label: "Collections",     sub: "Curate & edit",          icon: Sparkles,     color: "text-violet-500" },
  { href: "/categories",  label: "Categories",      sub: "Organise taxonomy",      icon: Layers,       color: "text-pink-500" },
  { href: "/inventory",   label: "Inventory",       sub: "Stock levels",           icon: Boxes,        color: "text-amber-500" },
  { href: "/customers",   label: "Customers",       sub: "Customer records",       icon: Users,        color: "text-cyan-500" },
  { href: "/analytics",   label: "Analytics",       sub: "Sales & trends",         icon: BarChart2,    color: "text-indigo-500" },
] as const

export function QuickActions() {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Access</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {ACTIONS.map(({ href, label, sub, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className={`rounded-lg bg-muted p-2 group-hover:scale-110 transition-transform duration-200`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
