"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageField } from "@/components/ui/image-field"
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
    image_path: "",
    hero_tagline: "",
    story_text: "",
    story_image_path: "",
    is_featured: false,
    sort_order: 0,
  })

  useEffect(() => {
    setForm(
      collection
        ? {
            name: collection.name,
            description: collection.description ?? "",
            image_path: collection.image_path ?? "",
            hero_tagline: collection.hero_tagline ?? "",
            story_text: collection.story_text ?? "",
            story_image_path: collection.story_image_path ?? "",
            is_featured: collection.is_featured,
            sort_order: collection.sort_order,
          }
        : { name: "", description: "", image_path: "", hero_tagline: "", story_text: "", story_image_path: "", is_featured: false, sort_order: 0 }
    )
  }, [collection, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setPending(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      image_path: form.image_path || undefined,
      hero_tagline: form.hero_tagline.trim() || undefined,
      story_text: form.story_text.trim() || undefined,
      story_image_path: form.story_image_path || undefined,
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
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "New Collection"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Core */}
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
            <Label>Short description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description shown below the hero on the webshop…"
              rows={2}
            />
          </div>

          {/* Images */}
          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Images</p>

            <ImageField
              label="Hero / card image"
              value={form.image_path}
              onChange={(url) => setForm((f) => ({ ...f, image_path: url }))}
              bucket="collections"
              path="hero"
              hint="Full-bleed banner on the collection page and thumbnail on the collections grid."
            />

            <ImageField
              label="Story image"
              value={form.story_image_path}
              onChange={(url) => setForm((f) => ({ ...f, story_image_path: url }))}
              bucket="collections"
              path="story"
              hint="Lifestyle shot shown beside the editorial paragraph below the hero."
            />
          </div>

          {/* Editorial copy */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editorial copy</p>

            <div className="space-y-1.5">
              <Label>Hero tagline</Label>
              <Input
                value={form.hero_tagline}
                onChange={(e) => setForm((f) => ({ ...f, hero_tagline: e.target.value }))}
                placeholder="e.g. Where heritage meets modern elegance"
              />
              <p className="text-xs text-muted-foreground">Short punchy line overlaid on the hero image. ~50 chars max.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Story paragraph</Label>
              <Textarea
                value={form.story_text}
                onChange={(e) => setForm((f) => ({ ...f, story_text: e.target.value }))}
                placeholder="Tell the story behind this collection…"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Shown beside the story image below the hero. 2–4 sentences works well.</p>
            </div>
          </div>

          {/* Settings */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</p>

            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                min={0}
                className="w-28"
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
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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
