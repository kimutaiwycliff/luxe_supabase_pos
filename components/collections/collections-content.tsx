"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Star, StarOff, Eye, EyeOff } from "lucide-react"
import { CollectionDialog } from "@/components/collections/collection-dialog"
import { CollectionProductsDialog } from "@/components/collections/collection-products-dialog"
import { deleteCollection, updateCollection, type Collection } from "@/lib/actions/collections"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CollectionsContentProps {
  initialCollections: Collection[]
}

export function CollectionsContent({ initialCollections }: CollectionsContentProps) {
  const [collections, setCollections] = useState(initialCollections)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [productsCollection, setProductsCollection] = useState<Collection | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null)

  function refresh(updated: Collection) {
    setCollections((prev) =>
      prev.some((c) => c.id === updated.id)
        ? prev.map((c) => (c.id === updated.id ? updated : c))
        : [...prev, updated]
    )
  }

  async function handleToggleFeatured(col: Collection) {
    const result = await updateCollection(col.id, { is_featured: !col.is_featured })
    if (result.error) { toast.error(result.error); return }
    if (result.collection) refresh(result.collection)
    toast.success(result.collection?.is_featured ? "Marked as featured" : "Removed from featured")
  }

  async function handleToggleActive(col: Collection) {
    const result = await updateCollection(col.id, { is_active: !col.is_active })
    if (result.error) { toast.error(result.error); return }
    if (result.collection) refresh(result.collection)
    toast.success(result.collection?.is_active ? "Collection activated" : "Collection hidden")
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const result = await deleteCollection(deleteTarget.id)
    if (result.error) { toast.error(result.error); return }
    setCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast.success("Collection deleted")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Curated product groups shown on the webshop
          </p>
        </div>
        <Button onClick={() => { setEditingCollection(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> New Collection
        </Button>
      </div>

      <div className="grid gap-3">
        {collections.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No collections yet.</p>
        )}
        {collections.map((col) => (
          <div
            key={col.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{col.name}</span>
                {col.is_featured && <Badge variant="secondary" className="text-xs shrink-0">Featured</Badge>}
                {!col.is_active && <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">Hidden</Badge>}
              </div>
              {col.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{col.description}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">/collections/{col.slug}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                title={col.is_featured ? "Remove from featured" : "Mark as featured"}
                onClick={() => handleToggleFeatured(col)}
              >
                {col.is_featured
                  ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  : <StarOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                title={col.is_active ? "Hide collection" : "Show collection"}
                onClick={() => handleToggleActive(col)}
              >
                {col.is_active
                  ? <Eye className="h-4 w-4 text-muted-foreground" />
                  : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                title="Manage products"
                onClick={() => setProductsCollection(col)}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                title="Edit collection"
                onClick={() => { setEditingCollection(col); setDialogOpen(true) }}
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive"
                title="Delete collection"
                onClick={() => setDeleteTarget(col)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collection={editingCollection}
        onSuccess={(col) => { refresh(col); setDialogOpen(false) }}
      />

      {productsCollection && (
        <CollectionProductsDialog
          collection={productsCollection}
          open={!!productsCollection}
          onOpenChange={(open) => !open && setProductsCollection(null)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the collection and all its product assignments. Products themselves are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
