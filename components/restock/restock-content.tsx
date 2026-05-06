"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Circle, Clock, CheckCircle2, Plus, Search, Loader2,
  ListChecks, MoreVertical, ShoppingBag, PackageCheck,
  RefreshCw, PencilLine, X,
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

// ── Status config ───────────────────────────────────────────────────────────

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
    next: "pending",
    icon: CheckCircle2,
    color: "text-green-500",
    rowBg: "bg-green-50/60 dark:bg-green-950/20",
    pillClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  },
}

// ── Add-items sheet ─────────────────────────────────────────────────────────

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
      qty_requested: product.reorder_quantity || product.low_stock_threshold || 10,
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

// ── Item row (mobile-first) ─────────────────────────────────────────────────

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

  return (
    <div className={cn(
      "px-4 py-3 border-b border-border/50 transition-colors",
      meta.rowBg,
      isReceived && "opacity-70",
    )}>
      {/* Row 1 — status tap target + name + remove */}
      <div className="flex items-start gap-3">
        {/* Big tap target for mobile */}
        <button
          type="button"
          onClick={() => onStatusChange(item.id, meta.next)}
          disabled={saving || isReceived}
          title={isReceived ? "Received" : `Tap to mark as ${STATUS_META[meta.next].icon}`}
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
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
            {item.supplier_name
              ? <span className="text-xs text-muted-foreground">{item.supplier_name}</span>
              : <span className="text-xs text-amber-500 font-medium">No supplier</span>}
            {item.sku && <span className="text-xs text-muted-foreground/60 font-mono">{item.sku}</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="flex-shrink-0 p-1.5 -mr-1 text-muted-foreground/50 hover:text-destructive active:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Row 2 — inputs (below on all screen sizes) */}
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

// ── Filter pill strip ───────────────────────────────────────────────────────

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

// ── Main component ──────────────────────────────────────────────────────────

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
  const grandTotal = items.filter((i) => i.status !== "received").reduce((s, i) => s + i.qty_requested * i.unit_cost, 0)

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Empty state (no active list) ──
  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-6">
        <div className="rounded-2xl bg-muted p-6">
          <ListChecks className="h-12 w-12 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">No active restock list</h2>
          <p className="text-muted-foreground mt-2 text-sm max-w-xs leading-relaxed">
            Start a new list — it'll auto-fill with everything running low so you know exactly what to buy.
          </p>
        </div>
        <Button size="lg" className="w-full max-w-xs h-12 text-base" onClick={handleCreateList}>
          <Plus className="h-5 w-5 mr-2" />
          Start Restock List
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-5rem)] max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-9 font-semibold flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false) }}
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

      {/* ── Progress bar ── */}
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

      {/* ── Toolbar ── */}
      <div className="space-y-2 mb-3">
        {/* Search + Add */}
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

        {/* Filter pills — horizontally scrollable on mobile */}
        <FilterStrip filter={filter} setFilter={setFilter} counts={counts} />
      </div>

      {/* ── List ── */}
      <div className="flex-1 rounded-xl border border-border overflow-hidden">
        {counts.all === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <ShoppingBag className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">List is empty</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap Add, or use "Sync low-stock items" from the ⋮ menu.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            No items match this filter
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

      {/* ── Footer ── */}
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

      <AddItemsSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        listId={list.id}
        existingProductIds={existingProductIds}
        onAdded={load}
      />
    </div>
  )
}
