"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Circle, Clock, CheckCircle2, Plus, Search, Loader2,
  ListChecks, MoreVertical, ShoppingBag, PackageCheck,
  RefreshCw, PencilLine, X, ChevronDown, RotateCcw, History, Trash2,
} from "lucide-react"
import {
  getActiveRestockList, createRestockList, seedListFromLowStock,
  addItemToRestockList, updateRestockItem, removeRestockItem,
  setItemStatus, bulkSetStatus, bulkSetStatusForItems,
  completeRestockList, renameRestockList, deleteRestockList,
  getArchivedRestockLists, getRestockListById,
  type RestockList, type RestockListItem, type RestockItemStatus,
} from "@/lib/actions/restock-lists"
import { getProducts } from "@/lib/actions/products"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_META: Record<RestockItemStatus, {
  next: RestockItemStatus
  icon: React.ComponentType<{ className?: string }>
  color: string
  rowBg: string
  pillClass: string
}> = {
  pending: {
    next: "ordered",
    icon: Circle,
    color: "text-muted-foreground",
    rowBg: "",
    pillClass: "bg-muted text-muted-foreground",
  },
  ordered: {
    next: "received",
    icon: Clock,
    color: "text-amber-500",
    rowBg: "bg-amber-50/60 dark:bg-amber-950/20",
    pillClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  received: {
    next: "received",
    icon: CheckCircle2,
    color: "text-green-500",
    rowBg: "bg-green-50/60 dark:bg-green-950/20",
    pillClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  },
}

// ── Add-items sheet ──────────────────────────────────────────────────────────

function AddItemsSheet({
  open, onOpenChange, listId, existingProductIds, onAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  listId: string
  existingProductIds: Set<string>
  onAdded: () => void
}) {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSearch("")
    getProducts().then((r) => setProducts(r.products || []))
  }, [open])

  const results = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products
      .filter(
        (p) =>
          !existingProductIds.has(p.id) &&
          (!q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q)),
      )
      .slice(0, 50)
  }, [products, search, existingProductIds])

  const handleAdd = async (product: any) => {
    setAdding(product.id)
    const supplier = product.supplier ?? null
    const { error } = await addItemToRestockList(listId, {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku ?? "",
      supplier_id: supplier?.id ?? null,
      supplier_name: supplier?.name ?? null,
      qty_requested: product.reorder_quantity || product.low_stock_threshold || 2,
      unit_cost: product.cost_price || 0,
    })
    if (error) toast.error(error)
    else { toast.success(`${product.name} added`); onAdded() }
    setAdding(null)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0" side="right">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle>Add Products</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 text-base"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm px-4 text-center">
              {search ? "No products match your search" : "All products already in list"}
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 text-left"
                onClick={() => handleAdd(p)}
                disabled={adding === p.id}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.sku}{p.supplier?.name ? ` · ${p.supplier.name}` : ""}
                  </p>
                </div>
                {adding === p.id
                  ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-muted-foreground" />
                  : <Plus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item, onStatusChange, onQtyChange, onCostChange, onRemove, saving,
}: {
  item: RestockListItem
  onStatusChange: (id: string, next: RestockItemStatus) => void
  onQtyChange: (id: string, qty: number) => void
  onCostChange: (id: string, cost: number) => void
  onRemove: (id: string) => void
  saving: boolean
}) {
  const meta = STATUS_META[item.status]
  const StatusIcon = meta.icon
  const isReceived = item.status === "received"
  const isOrdered = item.status === "ordered"

  return (
    <div className={cn(
      "px-4 py-3 border-b border-border/50 last:border-0 transition-colors",
      meta.rowBg,
      isReceived && "opacity-70",
    )}>
      {/* Row 1 — status button + name + context menu */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => !isReceived && onStatusChange(item.id, meta.next)}
          disabled={saving || isReceived}
          className={cn(
            "mt-0.5 flex-shrink-0 rounded-full transition-transform active:scale-95",
            meta.color,
            !isReceived && "hover:scale-110",
          )}
        >
          {saving
            ? <Loader2 className="h-6 w-6 animate-spin" />
            : <StatusIcon className="h-6 w-6" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold leading-snug", isReceived && "line-through text-muted-foreground")}>
            {item.product_name}
          </p>
          {item.sku && (
            <span className="text-xs text-muted-foreground/60 font-mono">{item.sku}</span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex-shrink-0 p-1.5 -mr-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isOrdered && (
              <>
                <DropdownMenuItem onClick={() => onStatusChange(item.id, "pending")}>
                  <RotateCcw className="h-4 w-4 mr-2 text-muted-foreground" />
                  Revert to Pending
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => onRemove(item.id)}
              className="text-destructive focus:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Row 2 — inputs or received summary */}
      {isReceived ? (
        <div className="mt-2 ml-9 flex items-center gap-2">
          <span className="text-xs text-green-600 font-medium">
            ✓ {item.qty_received} unit{item.qty_received !== 1 ? "s" : ""} received
          </span>
          <span className="text-xs text-muted-foreground">· {formatCurrency(item.qty_received * item.unit_cost)}</span>
        </div>
      ) : (
        <div className="mt-2.5 ml-9 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-6">Qty</span>
            <Input
              type="number"
              min="1"
              inputMode="numeric"
              value={item.qty_requested}
              onChange={(e) => onQtyChange(item.id, parseInt(e.target.value) || 1)}
              className="w-16 h-9 text-center text-sm"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">KES</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={item.unit_cost}
              onChange={(e) => onCostChange(item.id, parseFloat(e.target.value) || 0)}
              className="w-24 h-9 text-right text-sm"
            />
          </div>
          <span className="text-sm font-semibold text-foreground ml-auto">
            {formatCurrency(item.qty_requested * item.unit_cost)}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Supplier group ────────────────────────────────────────────────────────────

function SupplierGroup({
  supplierName, items,
  onStatusChange, onQtyChange, onCostChange, onRemove,
  savingItemId, onBulkOrdered, bulkWorking,
}: {
  supplierName: string
  items: RestockListItem[]
  onStatusChange: (id: string, next: RestockItemStatus) => void
  onQtyChange: (id: string, qty: number) => void
  onCostChange: (id: string, cost: number) => void
  onRemove: (id: string) => void
  savingItemId: string | null
  onBulkOrdered: (itemIds: string[]) => void
  bulkWorking: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)

  const pending = items.filter((i) => i.status === "pending").length
  const ordered = items.filter((i) => i.status === "ordered").length
  const received = items.filter((i) => i.status === "received").length
  const pendingIds = items.filter((i) => i.status === "pending").map((i) => i.id)

  return (
    <div className="border-b border-border last:border-0">
      {/* Supplier header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
            collapsed && "-rotate-90",
          )} />
          <span className="font-semibold text-sm truncate">
            {supplierName || "No Supplier"}
          </span>
          <div className="flex items-center gap-2 ml-1 flex-shrink-0">
            {pending > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
                <Circle className="h-2.5 w-2.5" />{pending}
              </span>
            )}
            {ordered > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                <Clock className="h-2.5 w-2.5" />{ordered}
              </span>
            )}
            {received > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-green-500 font-medium">
                <CheckCircle2 className="h-2.5 w-2.5" />{received}
              </span>
            )}
          </div>
        </button>

        {pending > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 flex-shrink-0 bg-background"
            onClick={() => onBulkOrdered(pendingIds)}
            disabled={bulkWorking}
          >
            {bulkWorking
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Clock className="h-3 w-3 mr-1 text-amber-500" />}
            Order all
          </Button>
        )}
      </div>

      {/* Items */}
      {!collapsed && items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          onStatusChange={onStatusChange}
          onQtyChange={onQtyChange}
          onCostChange={onCostChange}
          onRemove={onRemove}
          saving={savingItemId === item.id}
        />
      ))}
    </div>
  )
}

// ── Filter pill strip ─────────────────────────────────────────────────────────

type FilterStatus = "all" | RestockItemStatus

function FilterStrip({
  filter, setFilter, counts,
}: {
  filter: FilterStatus
  setFilter: (f: FilterStatus) => void
  counts: { all: number; pending: number; ordered: number; received: number }
}) {
  const pills: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "ordered", label: "Ordered", count: counts.ordered },
    { key: "received", label: "Done", count: counts.received },
  ]

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      {pills.map(({ key, label, count }) => (
        <button
          key={key}
          type="button"
          onClick={() => setFilter(key)}
          className={cn(
            "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            filter === key
              ? "bg-primary text-primary-foreground"
              : "bg-muted/80 text-muted-foreground hover:bg-muted",
          )}
        >
          {label}
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center",
            filter === key ? "bg-primary-foreground/20" : "bg-background/60",
          )}>
            {count}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Archived list items (read-only, grouped by supplier) ─────────────────────

function ArchivedListItems({ list }: { list: RestockList }) {
  const items = (list.items ?? []) as RestockListItem[]

  const groups = useMemo(() => {
    const map = new Map<string, RestockListItem[]>()
    for (const item of items) {
      const key = item.supplier_name || ""
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (!a) return 1
      if (!b) return -1
      return a.localeCompare(b)
    })
  }, [items])

  return (
    <div className="border-t border-border">
      {groups.map(([supplierName, groupItems]) => (
        <div key={supplierName || "__none__"}>
          <div className="px-4 py-1.5 bg-muted/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {supplierName || "No Supplier"}
            </span>
          </div>
          {groupItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "px-4 py-2.5 border-b border-border/40 last:border-0 flex items-center gap-3",
                item.status === "received" && "bg-green-50/30 dark:bg-green-950/10",
              )}
            >
              {item.status === "received"
                ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", item.status !== "received" && "text-muted-foreground")}>
                  {item.product_name}
                </p>
                {item.sku && <p className="text-xs font-mono text-muted-foreground/50">{item.sku}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium">
                  {item.status === "received" ? item.qty_received : item.qty_requested} units
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    (item.status === "received" ? item.qty_received : item.qty_requested) * item.unit_cost,
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── History tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  const { data, isLoading, mutate } = useSWR("archived-restock-lists", getArchivedRestockLists)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const { data: expandedData, isLoading: expandedLoading } = useSWR(
    expandedId ? ["restock-list-detail", expandedId] : null,
    () => getRestockListById(expandedId!),
  )

  const lists = data?.lists ?? []

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    setDeleteTarget(null)
    const { error } = await deleteRestockList(deleteTarget.id)
    if (error) toast.error(error)
    else {
      toast.success("List deleted")
      if (expandedId === deleteTarget.id) setExpandedId(null)
      mutate()
    }
    setDeletingId(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6 gap-3">
        <History className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">No completed lists yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Completed restock lists will appear here for reference.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lists.map((list) => {
        const summaryItems = (list.items ?? []) as any[]
        const total = summaryItems.length
        const received = summaryItems.filter((i) => i.status === "received").length
        const totalCost = summaryItems.reduce(
          (s: number, i: any) => s + (i.qty_received ?? i.qty_requested) * i.unit_cost,
          0,
        )
        const isExpanded = expandedId === list.id
        const isDeleting = deletingId === list.id

        return (
          <div key={list.id} className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-1 px-4 py-3.5">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : list.id)}
                className="flex-1 flex items-center gap-3 text-left min-w-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{list.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {list.completed_at
                      ? new Date(list.completed_at).toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                      : new Date(list.created_at).toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                    {total > 0 && <> · {received}/{total} received</>}
                    {totalCost > 0 && <> · {formatCurrency(totalCost)}</>}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-180",
                )} />
              </button>

              <button
                type="button"
                onClick={() => setDeleteTarget({ id: list.id, name: list.name })}
                disabled={isDeleting}
                className="flex-shrink-0 p-1.5 text-muted-foreground/50 hover:text-destructive active:text-destructive transition-colors ml-1"
              >
                {isDeleting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
              </button>
            </div>

            {isExpanded && (
              expandedLoading ? (
                <div className="flex justify-center py-6 border-t border-border">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : expandedData?.list ? (
                <ArchivedListItems list={expandedData.list} />
              ) : null
            )}
          </div>
        )
      })}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This list and all its items will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RestockContent() {
  const [list, setList] = useState<RestockList | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [search, setSearch] = useState("")
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [bulkWorking, setBulkWorking] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")

  const items: RestockListItem[] = (list?.items ?? []) as RestockListItem[]

  const load = useCallback(async () => {
    const { list: active } = await getActiveRestockList()
    setList(active)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    ordered: items.filter((i) => i.status === "ordered").length,
    received: items.filter((i) => i.status === "received").length,
  }), [items])

  const progress = counts.all > 0 ? Math.round((counts.received / counts.all) * 100) : 0

  const filteredItems = useMemo(() => {
    let result = items
    if (filter !== "all") result = result.filter((i) => i.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.product_name.toLowerCase().includes(q) ||
          (i.sku ?? "").toLowerCase().includes(q) ||
          (i.supplier_name ?? "").toLowerCase().includes(q),
      )
    }
    return result
  }, [items, filter, search])

  // Group filtered items by supplier
  const groupedItems = useMemo(() => {
    const map = new Map<string, RestockListItem[]>()
    for (const item of filteredItems) {
      const key = item.supplier_name || ""
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (!a) return 1
      if (!b) return -1
      return a.localeCompare(b)
    })
  }, [filteredItems])

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleCreateList = async () => {
    setLoading(true)
    const { list: newList, error } = await createRestockList()
    if (error || !newList) { toast.error(error ?? "Failed"); setLoading(false); return }
    setList(newList)
    setLoading(false)
  }

  const handleSeedLowStock = async () => {
    if (!list) return
    setSeeding(true)
    const { added, error } = await seedListFromLowStock(list.id)
    if (error) toast.error(error)
    else if (added === 0) toast.info("No new low-stock items to add")
    else toast.success(`Added ${added} low-stock item${added !== 1 ? "s" : ""}`)
    await load()
    setSeeding(false)
  }

  const handleStatusChange = async (itemId: string, next: RestockItemStatus) => {
    setSavingItemId(itemId)
    setList((prev) => prev ? {
      ...prev,
      items: (prev.items as RestockListItem[]).map((i) => i.id === itemId ? { ...i, status: next } : i),
    } : prev)
    const { error } = await setItemStatus(itemId, next)
    if (error) { toast.error(error); await load() }
    else if (next === "received") { toast.success("Stock updated!"); await load() }
    setSavingItemId(null)
  }

  const handleQtyChange = async (itemId: string, qty: number) => {
    setList((prev) => prev ? {
      ...prev,
      items: (prev.items as RestockListItem[]).map((i) => i.id === itemId ? { ...i, qty_requested: qty } : i),
    } : prev)
    await updateRestockItem(itemId, { qty_requested: qty })
  }

  const handleCostChange = async (itemId: string, cost: number) => {
    setList((prev) => prev ? {
      ...prev,
      items: (prev.items as RestockListItem[]).map((i) => i.id === itemId ? { ...i, unit_cost: cost } : i),
    } : prev)
    await updateRestockItem(itemId, { unit_cost: cost })
  }

  const handleRemove = async (itemId: string) => {
    setList((prev) => prev ? {
      ...prev,
      items: (prev.items as RestockListItem[]).filter((i) => i.id !== itemId),
    } : prev)
    const { error } = await removeRestockItem(itemId)
    if (error) { toast.error(error); await load() }
  }

  const handleBulkStatus = async (from: RestockItemStatus, to: RestockItemStatus) => {
    if (!list) return
    setBulkWorking(true)
    const { error } = await bulkSetStatus(list.id, to, from)
    if (error) toast.error(error)
    else toast.success(`All ${from} items marked as ${to}`)
    await load()
    setBulkWorking(false)
  }

  const handleBulkOrderedForSupplier = useCallback(async (itemIds: string[]) => {
    setBulkWorking(true)
    const { error } = await bulkSetStatusForItems(itemIds, "ordered")
    if (error) toast.error(error)
    else toast.success(`${itemIds.length} item${itemIds.length !== 1 ? "s" : ""} marked as ordered`)
    await load()
    setBulkWorking(false)
  }, [load])

  const handleComplete = async () => {
    if (!list) return
    if (!confirm("Complete this restock list? It will be archived.")) return
    const { error } = await completeRestockList(list.id)
    if (error) toast.error(error)
    else { toast.success("Restock list completed"); setList(null) }
  }

  const handleSaveName = async () => {
    if (!list || !nameInput.trim()) return
    const { error } = await renameRestockList(list.id, nameInput.trim())
    if (!error) setList((prev) => prev ? { ...prev, name: nameInput.trim() } : prev)
    setEditingName(false)
  }

  const existingProductIds = useMemo(() => new Set(items.map((i) => i.product_id)), [items])
  const grandTotal = items
    .filter((i) => i.status !== "received")
    .reduce((s, i) => s + i.qty_requested * i.unit_cost, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active" className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" />
            Active List
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ── Active tab ── */}
        <TabsContent value="active" className="mt-0">
          {!list ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-5 text-center px-6">
              <div className="rounded-2xl bg-muted p-6">
                <ListChecks className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">No active restock list</h2>
                <p className="text-muted-foreground mt-2 text-sm max-w-xs leading-relaxed">
                  Start a new list — it'll auto-fill with everything running low.
                </p>
              </div>
              <Button size="lg" className="w-full max-w-xs h-12 text-base" onClick={handleCreateList}>
                <Plus className="h-5 w-5 mr-2" />
                Start Restock List
              </Button>
            </div>
          ) : (
            <div className="flex flex-col min-h-[calc(100dvh-9rem)]">

              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="h-9 font-semibold flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName()
                          if (e.key === "Escape") setEditingName(false)
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveName}>Save</Button>
                      <Button size="sm" variant="ghost" className="px-2" onClick={() => setEditingName(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setNameInput(list.name); setEditingName(true) }}
                      className="flex items-center gap-1.5 group text-left"
                    >
                      <h1 className="text-lg font-bold leading-tight">{list.name}</h1>
                      <PencilLine className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Started {new Date(list.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => handleBulkStatus("pending", "ordered")}
                      disabled={bulkWorking || counts.pending === 0}
                    >
                      <Clock className="h-4 w-4 mr-2 text-amber-500" />
                      Mark all pending → ordered
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkStatus("ordered", "received")}
                      disabled={bulkWorking || counts.ordered === 0}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Mark all ordered → received
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSeedLowStock} disabled={seeding}>
                      <RefreshCw className={cn("h-4 w-4 mr-2", seeding && "animate-spin")} />
                      Sync low-stock items
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleComplete} className="text-muted-foreground">
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Complete &amp; archive list
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progress bar */}
              {counts.all > 0 && (
                <div className="mb-3 space-y-1.5">
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        progress === 100 ? "bg-green-500" : "bg-primary",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Circle className="h-3 w-3" />{counts.pending}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <Clock className="h-3 w-3" />{counts.ordered}
                      </span>
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="h-3 w-3" />{counts.received}
                      </span>
                    </div>
                    <span className="font-medium">{progress}% done</span>
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  <Button onClick={() => setAddSheetOpen(true)} className="h-10 px-4 flex-shrink-0">
                    <Plus className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </div>
                <FilterStrip filter={filter} setFilter={setFilter} counts={counts} />
              </div>

              {/* Grouped list */}
              <div className="flex-1 rounded-xl border border-border overflow-hidden">
                {counts.all === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">List is empty</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tap Add, or use "Sync low-stock items" from the ⋮ menu.
                    </p>
                  </div>
                ) : groupedItems.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                    No items match this filter
                  </div>
                ) : (
                  groupedItems.map(([supplierName, groupItems]) => (
                    <SupplierGroup
                      key={supplierName || "__none__"}
                      supplierName={supplierName}
                      items={groupItems}
                      onStatusChange={handleStatusChange}
                      onQtyChange={handleQtyChange}
                      onCostChange={handleCostChange}
                      onRemove={handleRemove}
                      savingItemId={savingItemId}
                      onBulkOrdered={handleBulkOrderedForSupplier}
                      bulkWorking={bulkWorking}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              {counts.all > 0 && (
                <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>
                    {" "}left to spend
                  </p>
                  {counts.pending + counts.ordered === 0 && (
                    <Button size="sm" onClick={handleComplete} className="bg-green-600 hover:bg-green-700 text-white">
                      <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
                      Complete
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── History tab ── */}
        <TabsContent value="history" className="mt-0">
          <HistoryTab />
        </TabsContent>
      </Tabs>

      <AddItemsSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        listId={list?.id ?? ""}
        existingProductIds={existingProductIds}
        onAdded={load}
      />
    </div>
  )
}
