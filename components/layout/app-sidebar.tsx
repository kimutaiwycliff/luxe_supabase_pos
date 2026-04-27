"use client"

import type React from "react"
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
  ChevronUp,
  LogOut,
  UserCircle,
  ReceiptText,
  CalendarClock,
  Sparkles,
  RefreshCw,
  Warehouse,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AuthUser, signOut } from "@/lib/actions/auth"

interface AppSidebarProps {
  user: AuthUser | null
}

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

const staffNavGroups = [
  {
    label: "Main",
    items: [
      { title: "POS Terminal", href: "/pos", icon: ShoppingCart },
    ],
  },
]

function NavItem({
  item,
  isActive,
}: {
  item: { title: string; href: string; icon: React.ComponentType<{ className?: string }> }
  isActive: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={cn("relative", isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium")}
      >
        <Link href={item.href}>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
          )}
          <item.icon className={cn("ml-1 shrink-0", isActive && "text-primary")} />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = user?.role === "admin"

  const checkIsActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href))

  const handleSignOut = async () => {
    await signOut()
  }

  const groups = isAdmin ? navGroups : staffNavGroups

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Luxe Collections</span>
                  <span className="truncate text-xs text-muted-foreground">Store Manager</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItem key={item.href} item={item} isActive={checkIsActive(item.href)} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {user?.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt={user.fullName || user.email} />
                    )}
                    <AvatarFallback className="rounded-lg">{user?.initials || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.fullName || "Guest"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email || "Not signed in"}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                {user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Account Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login" className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign in</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
