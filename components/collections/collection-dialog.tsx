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
    image_path: "",
    hero_tagline: "",
    story_text: "",
    story_image_path: "",
    is_featured: false,
    sort_order: 0,
  })

  useEffect(() => {
    if (collection) {
      setForm({
        name: collection.name,
        description: collection.description ?? "",
        image_path: collection.image_path ?? "",
        hero_tagline: collection.hero_tagline ?? "",
        story_text: collection.story_text ?? "",
        story_image_path: collection.story_image_path ?? "",
        is_featured: collection.is_featured,
        sort_order: collection.sort_order,
      })
    } else {
      setForm({ name: "", description: "", image_path: "", hero_tagline: "", story_text: "", story_image_path: "", is_featured: false, sort_order: 0 })
    }
  }, [collection, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setPending(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      image_path: form.image_path.trim() || undefined,
      hero_tagline: form.hero_tagline.trim() || undefined,
      story_text: form.story_text.trim() || undefined,
      story_image_path: form.story_image_path.trim() || undefined,
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

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "New Collection"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">

          {/* Core */}
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={field("name")} placeholder="e.g. Summer Picks" required />
          </div>

          <div className="space-y-1.5">
            <Label>Short description</Label>
            <Textarea value={form.description} onChange={field("description")} placeholder="Shown below the title on the webshop…" rows={2} />
          </div>

          {/* Media */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Media</p>

            <div className="space-y-1.5">
              <Label>Hero / card image URL</Label>
              <Input value={form.image_path} onChange={field("image_path")} placeholder="https://images.unsplash.com/…" />
              <p className="text-xs text-muted-foreground">Used for the hero banner and the homepage card.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Story image URL</Label>
              <Input value={form.story_image_path} onChange={field("story_image_path")} placeholder="https://images.unsplash.com/…" />
              <p className="text-xs text-muted-foreground">Lifestyle shot shown in the editorial story block.</p>
            </div>
          </div>

          {/* Editorial copy */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Editorial copy</p>

            <div className="space-y-1.5">
              <Label>Hero tagline</Label>
              <Input value={form.hero_tagline} onChange={field("hero_tagline")} placeholder="e.g. Where heritage meets style" />
              <p className="text-xs text-muted-foreground">Short punchy line overlaid on the hero image.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Story paragraph</Label>
              <Textarea value={form.story_text} onChange={field("story_text")} placeholder="Tell the story behind this collection…" rows={4} />
              <p className="text-xs text-muted-foreground">Shown in the editorial block below the hero.</p>
            </div>
          </div>

          {/* Settings */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Settings</p>

            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={form.sort_order} onChange={field("sort_order")} min={0} />
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
