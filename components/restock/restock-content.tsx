"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Circle, Clock, CheckCircle2, Plus, Trash2, Search, Loader2,
  ListChecks, MoreHorizontal, ShoppingBag, PackageCheck, RefreshCw,
  ChevronDown, PencilLine, X,
} from "lucide-react"
import {
  getActiveRestockList, createRestockList, seedListFromLowStock,
  addItemToRestockList, updateRestockItem, removeRestockItem,
  setItemStatus, bulkSetStatus, completeRestockList, renameRestockList,
  type RestockList, type RestockListItem, type RestockItemStatus,
} from "@/lib/actions/restock-lists"
import { getProducts } from "@/lib/actions/products"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Status helpers ──────────────────────────────────────────────────────────

const STATUS_META: Record<RestockItemStatus, {
  label: string
  next: RestockItemStatus
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}> = {
  pending: {
    label: "Pending",
    next: "ordered",
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  ordered: {
    label: "Ordered",
    next: "received",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
  },
  received: {
    label: "Received",
    next: "pending",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
}

// ── Add-items sheet ─────────────────────────────────────────────────────────

function AddItemsSheet({
  open,
  onOpenChange,
  listId,
  existingProductIds,
  onAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  listId: string
  existingProductIds: Set<string>
  onAdded: () => void
}) {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
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
      .slice(0, 40)
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
      qty_requested: product.reorder_quantity || product.low_stock_threshold || 10,
      unit_cost: product.cost_price || 0,
    })
    if (error) toast.error(error)
    else { toast.success(`${product.name} added`); onAdded() }
    setAdding(null)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 py-4 border-b flex-shrink-0">
          <SheetTitle>Add Products</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-3 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
              {search ? "No products match your search" : "All products already in list"}
            </div>
          ) : (
            results.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.sku}{p.supplier?.name ? ` · ${p.supplier.name}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 h-8"
                  onClick={() => handleAdd(p)}
                  disabled={adding === p.id}
                >
                  {adding === p.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Plus className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Item row ────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onStatusChange,
  onQtyChange,
  onCostChange,
  onRemove,
  saving,
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

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 border-b border-border/50 transition-colors",
      meta.bg,
      isReceived && "opacity-60",
    )}>
      {/* Status toggle */}
      <button
        type="button"
        onClick={() => onStatusChange(item.id, meta.next)}
        disabled={saving}
        title={`Mark as ${STATUS_META[meta.next].label}`}
        className={cn(
          "flex-shrink-0 rounded-full p-0.5 transition-transform hover:scale-110 focus:outline-none",
          meta.color,
        )}
      >
        <StatusIcon className="h-6 w-6" />
      </button>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isReceived && "line-through")}>{item.product_name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
          {item.supplier_name
            ? <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">{item.supplier_name}</Badge>
            : <span className="text-[10px] text-amber-500 font-medium">No supplier</span>}
          <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>
        </div>
      </div>

      {/* Qty + cost */}
      {!isReceived && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Qty</p>
            <Input
              type="number"
              min="1"
              value={item.qty_requested}
              onChange={(e) => onQtyChange(item.id, parseInt(e.target.value) || 1)}
              className="w-16 h-8 text-center text-sm"
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Cost</p>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unit_cost}
              onChange={(e) => onCostChange(item.id, parseFloat(e.target.value) || 0)}
              className="w-24 h-8 text-right text-sm"
            />
          </div>
          <div className="text-right w-20 flex-shrink-0">
            <p className="text-[10px] text-muted-foreground mb-0.5">Total</p>
            <p className="text-sm font-medium">{formatCurrency(item.qty_requested * item.unit_cost)}</p>
          </div>
        </div>
      )}

      {isReceived && (
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-muted-foreground">Received</p>
          <p className="text-sm font-semibold text-green-600">{item.qty_received} units</p>
        </div>
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

type FilterStatus = "all" | RestockItemStatus

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

  // ── Counts ──
  const counts = useMemo(() => ({
    pending: items.filter((i) => i.status === "pending").length,
    ordered: items.filter((i) => i.status === "ordered").length,
    received: items.filter((i) => i.status === "received").length,
    total: items.length,
  }), [items])

  const progress = counts.total > 0 ? Math.round((counts.received / counts.total) * 100) : 0

  // ── Filtered items ──
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

  // ── Actions ──

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
    if (next === "pending" && items.find((i) => i.id === itemId)?.status === "received") {
      toast.error("Cannot undo a received item — inventory has already been updated.")
      return
    }
    setSavingItemId(itemId)
    // Optimistic update
    setList((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        items: (prev.items as RestockListItem[]).map((i) =>
          i.id === itemId ? { ...i, status: next } : i,
        ),
      }
    })
    const { error } = await setItemStatus(itemId, next)
    if (error) { toast.error(error); await load() }
    else if (next === "received") {
      toast.success("Stock updated!")
      await load()
    }
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

  const handleBulkStatus = async (fromStatus: RestockItemStatus, toStatus: RestockItemStatus) => {
    if (!list) return
    setBulkWorking(true)
    const { error } = await bulkSetStatus(list.id, toStatus, fromStatus)
    if (error) toast.error(error)
    else toast.success(`All ${fromStatus} items marked as ${toStatus}`)
    await load()
    setBulkWorking(false)
  }

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

  // ── Empty state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <div className="rounded-full bg-muted p-5">
          <ListChecks className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">No active restock list</h2>
          <p className="text-muted-foreground mt-1 text-sm max-w-xs">
            Start a new list and it will auto-fill with everything that's running low.
          </p>
        </div>
        <Button size="lg" onClick={handleCreateList}>
          <Plus className="h-4 w-4 mr-2" />
          Start Restock List
        </Button>
      </div>
    )
  }

  const grandTotal = items
    .filter((i) => i.status !== "received")
    .reduce((s, i) => s + i.qty_requested * i.unit_cost, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-8 text-lg font-semibold w-60"
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false) }}
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setNameInput(list.name); setEditingName(true) }}
              className="flex items-center gap-1.5 group"
            >
              <h1 className="text-xl font-semibold">{list.name}</h1>
              <PencilLine className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date(list.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-1.5" />
              Actions
              <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => handleBulkStatus("pending", "ordered")}
              disabled={bulkWorking || counts.pending === 0}
            >
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              Mark all as Ordered
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleBulkStatus("ordered", "received")}
              disabled={bulkWorking || counts.ordered === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Mark all as Received
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSeedLowStock}
              disabled={seeding}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", seeding && "animate-spin")} />
              Refresh low-stock items
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleComplete} className="text-muted-foreground">
              <PackageCheck className="h-4 w-4 mr-2" />
              Complete &amp; Archive List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Progress bar ── */}
      {counts.total > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}% received</span>
            <span>{counts.received} of {counts.total} items</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Circle className="h-3 w-3" />{counts.pending} pending
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <Clock className="h-3 w-3" />{counts.ordered} ordered
            </span>
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="h-3 w-3" />{counts.received} received
            </span>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
          {(["all", "pending", "ordered", "received"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md font-medium transition-colors capitalize",
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "all" ? `All (${counts.total})` : s === "pending" ? `Pending (${counts.pending})` : s === "ordered" ? `Ordered (${counts.ordered})` : `Received (${counts.received})`}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={() => setAddSheetOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add
        </Button>
      </div>

      {/* ── List body ── */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border">
        {counts.total === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">List is empty</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Add" to add products, or use "Refresh low-stock items" from the Actions menu.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            No items match your filter
          </div>
        ) : (
          filteredItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onQtyChange={handleQtyChange}
              onCostChange={handleCostChange}
              onRemove={handleRemove}
              saving={savingItemId === item.id}
            />
          ))
        )}
      </div>

      {/* ── Footer summary ── */}
      {counts.total > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm border-t pt-3">
          <span className="text-muted-foreground">
            {items.filter((i) => i.status !== "received").length} items remaining ·{" "}
            <strong className="text-foreground">{formatCurrency(grandTotal)}</strong> to spend
          </span>
          {counts.pending + counts.ordered === 0 && (
            <Button size="sm" onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
              <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
              Complete List
            </Button>
          )}
        </div>
      )}

      {/* ── Add items sheet ── */}
      <AddItemsSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        listId={list.id}
        existingProductIds={existingProductIds}
        onAdded={() => { load(); }}
      />
    </div>
  )
}
