"use client"

import { useState, useEffect, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, X, Search, Plus } from "lucide-react"
import {
  getCollectionWithProducts,
  addProductToCollection,
  removeProductFromCollection,
  type Collection,
  type CollectionProduct,
} from "@/lib/actions/collections"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

interface CollectionProductsDialogProps {
  collection: Collection
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CollectionProductsDialog({ collection, open, onOpenChange }: CollectionProductsDialogProps) {
  const [items, setItems] = useState<CollectionProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; selling_price: number }[]>([])
  const [searching, setSearching] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getCollectionWithProducts(collection.id).then(({ items: i }) => {
      setItems(i)
      setLoading(false)
    })
  }, [open, collection.id])

  async function handleSearch(q: string) {
    setSearch(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&limit=8`)
    const data = await res.json()
    setSearchResults(data.products ?? [])
    setSearching(false)
  }

  async function handleAdd(productId: string) {
    const result = await addProductToCollection(collection.id, productId)
    if (result.error) { toast.error(result.error); return }
    const { items: fresh } = await getCollectionWithProducts(collection.id)
    setItems(fresh)
    setSearch("")
    setSearchResults([])
    toast.success("Product added")
  }

  async function handleRemove(productId: string) {
    startTransition(async () => {
      const result = await removeProductFromCollection(collection.id, productId)
      if (result.error) { toast.error(result.error); return }
      setItems((prev) => prev.filter((i) => i.product_id !== productId))
      toast.success("Product removed")
    })
  }

  const assignedIds = new Set(items.map((i) => i.product_id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Products — {collection.name}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products to add…"
            className="pl-9"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {searchResults.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-card text-sm">
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground ml-2">{formatCurrency(p.selling_price)}</span>
                </div>
                <Button
                  size="sm" variant="ghost" className="h-7 text-xs gap-1"
                  disabled={assignedIds.has(p.id)}
                  onClick={() => handleAdd(p.id)}
                >
                  {assignedIds.has(p.id) ? "Added" : <><Plus className="h-3 w-3" /> Add</>}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Current products */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No products yet. Search above to add some.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{item.product?.name ?? "Unknown"}</span>
                  {item.product && (
                    <span className="text-muted-foreground ml-2">{formatCurrency(item.product.selling_price)}</span>
                  )}
                </div>
                <Button
                  size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive"
                  disabled={isPending}
                  onClick={() => handleRemove(item.product_id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{items.length} product{items.length !== 1 ? "s" : ""}</span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
