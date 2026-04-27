"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { createCollection, updateCollection, type Collection } from "@/lib/actions/collections"
import { toast } from "sonner"

interface CollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Collection | null
  onSuccess: (col: Collection) => void
}

export function CollectionDialog({ open, onOpenChange, collection, onSuccess }: CollectionDialogProps) {
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_featured: false,
    sort_order: 0,
  })

  useEffect(() => {
    if (collection) {
      setForm({
        name: collection.name,
        description: collection.description ?? "",
        is_featured: collection.is_featured,
        sort_order: collection.sort_order,
      })
    } else {
      setForm({ name: "", description: "", is_featured: false, sort_order: 0 })
    }
  }, [collection, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setPending(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      is_featured: form.is_featured,
      sort_order: form.sort_order,
    }
    const result = collection
      ? await updateCollection(collection.id, payload)
      : await createCollection(payload)

    setPending(false)
    if (result.error) { toast.error(result.error); return }
    if (result.collection) { onSuccess(result.collection) }
    toast.success(collection ? "Collection updated" : "Collection created")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "New Collection"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Summer Picks"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description shown on the webshop…"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              min={0}
            />
            <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Featured on homepage</p>
              <p className="text-xs text-muted-foreground">Show in the Collections section</p>
            </div>
            <Switch
              checked={form.is_featured}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {collection ? "Save Changes" : "Create Collection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
