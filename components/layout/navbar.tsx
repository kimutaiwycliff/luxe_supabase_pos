"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Truck,
  Settings,
  Tags,
  Users,
  AlertTriangle,
  Store,
  ClipboardList,
  Bell,
  Menu,
  ReceiptText,
  CalendarClock,
  Sparkles,
  RefreshCw,
  Warehouse,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AuthUser, signOut } from "@/lib/actions/auth"
import { GlobalSearch } from "@/components/search/global-search"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface NavbarProps {
  user: AuthUser | null
  outOfStockCount?: number
}

// Desktop top-bar: only the two highest-traffic destinations
const primaryNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "POS", href: "/pos", icon: ShoppingCart },
]

// Full navigation shown in the mobile slide-out sheet
const navGroups = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "POS Terminal", href: "/pos", icon: ShoppingCart },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Products", href: "/products", icon: Package },
      { title: "Categories", href: "/categories", icon: Tags },
      { title: "Collections", href: "/collections", icon: Sparkles },
      { title: "Inventory", href: "/inventory", icon: Warehouse },
      { title: "Low Stock", href: "/low-stock", icon: AlertTriangle },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Orders", href: "/orders", icon: ReceiptText },
      { title: "Layaways", href: "/layaways", icon: CalendarClock },
      { title: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { title: "Suppliers", href: "/suppliers", icon: Truck },
      { title: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
      { title: "Smart Reorder", href: "/reorder", icon: RefreshCw },
    ],
  },
  {
    label: "Reports",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

// Staff only sees POS
const staffNav = [
  { title: "POS Terminal", href: "/pos", icon: ShoppingCart },
]

export function Navbar({ user, outOfStockCount = 0 }: NavbarProps) {
  const pathname = usePathname()
  const isAdmin = user?.role === "admin"

  const checkIsActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href))

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-2 sm:px-4">

        {/* Mobile hamburger — triggers the Sheet opened by the parent Sheet wrapper */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2 shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b shrink-0">
              <SheetTitle>
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Store className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Luxe Collections</span>
                    <span className="truncate text-xs text-muted-foreground">Store Manager</span>
                  </div>
                </Link>
              </SheetTitle>
              <SheetDescription className="sr-only">Main navigation</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
              {(isAdmin ? navGroups : [{ label: "Main", items: staffNav }]).map((group) => (
                <nav key={group.label}>
                  <p className="mb-1 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = checkIsActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground/70 hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {active && (
                            <span className="absolute left-3 h-5 w-1 rounded-r-full bg-primary" />
                          )}
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.title}
                        </Link>
                      )
                    })}
                  </div>
                </nav>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo + desktop primary nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4" />
            </div>
            <span className="font-semibold">Luxe Collections</span>
          </Link>

          <nav className="flex items-center gap-1">
            {(isAdmin ? primaryNav : staffNav).map((item) => {
              const active = checkIsActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side: search, alerts, avatar */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {isAdmin && (
            <>
              <GlobalSearch />

              <Button variant="ghost" size="icon" className="relative shrink-0" asChild>
                <Link href="/low-stock">
                  <Bell className="h-5 w-5" />
                  {outOfStockCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                      {outOfStockCount > 9 ? "9+" : outOfStockCount}
                    </span>
                  )}
                </Link>
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                <Avatar className="h-8 w-8">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.fullName || user.email} />
                  )}
                  <AvatarFallback>{user?.initials || "?"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.fullName || "Guest"}</p>
                  <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  Sign out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/auth/login">Sign in</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export { Sheet }
