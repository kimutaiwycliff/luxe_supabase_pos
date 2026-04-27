"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageField } from "@/components/ui/image-field"
import { MultiImageField } from "@/components/ui/multi-image-field"

import { createCategory, updateCategory } from "@/lib/actions/categories"
import type { Category } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  categories: Category[]
  prefillParentId?: string | null
  onSuccess: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  categories,
  prefillParentId = null,
  onSuccess,
}: CategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    description: "",
    parent_id: null as string | null,
    is_active: true,
    sort_order: 0,
    image_path: "",
    hero_image_path: "",
    hero_image_paths: [] as string[],
    hero_tagline: "",
  })

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        description: category.description ?? "",
        parent_id: category.parent_id ?? null,
        is_active: category.is_active,
        sort_order: category.sort_order,
        image_path: category.image_path ?? "",
        hero_image_path: category.hero_image_path ?? "",
        hero_image_paths: category.hero_image_paths ?? [],
        hero_tagline: category.hero_tagline ?? "",
      })
    } else {
      setForm({
        name: "",
        description: "",
        parent_id: prefillParentId,
        is_active: true,
        sort_order: 0,
        image_path: "",
        hero_image_path: "",
        hero_image_paths: [],
        hero_tagline: "",
      })
    }
    setError(null)
  }, [category, open, prefillParentId])

  const set = (key: keyof typeof form) =>
    (val: string | boolean | number | null) =>
      setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setIsLoading(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      parent_id: form.parent_id || undefined,
      is_active: form.is_active,
      sort_order: form.sort_order,
      image_path: form.image_path || undefined,
      hero_image_path: form.hero_image_path || undefined,
      hero_image_paths: form.hero_image_paths,
      hero_tagline: form.hero_tagline.trim() || undefined,
    }

    const result = category
      ? await updateCategory(category.id, payload)
      : await createCategory(payload)

    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast.success(category ? "Category updated" : "Category created")
    onSuccess()
  }

  const parentOptions = categories.filter(
    (c) => c.parent_id === null && c.id !== category?.id,
  )

  const isSubcategory = !!form.parent_id
  const parentName = parentOptions.find((p) => p.id === form.parent_id)?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : isSubcategory ? `New subcategory${parentName ? ` under ${parentName}` : ""}` : "New Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">

          {/* ── Core ── */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                placeholder="e.g. Women Dresses"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                placeholder="Short description of this category…"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Parent category</Label>
              <Select
                value={form.parent_id ?? "none"}
                onValueChange={(v) => set("parent_id")(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top level)</SelectItem>
                  {parentOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Images ── */}
          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Images</p>

            <ImageField
              label="Card image"
              value={form.image_path}
              onChange={set("image_path") as (url: string) => void}
              bucket="categories"
              path="images"
              hint="Square thumbnail shown on the homepage category grid."
            />

            <ImageField
              label="Hero image (single)"
              value={form.hero_image_path}
              onChange={set("hero_image_path") as (url: string) => void}
              bucket="categories"
              path="hero"
              hint="Primary hero photo — used as fallback when no slideshow images are set."
            />

            <MultiImageField
              label="Hero slideshow images"
              values={form.hero_image_paths}
              onChange={(urls) => setForm((f) => ({ ...f, hero_image_paths: urls }))}
              bucket="categories"
              path="hero"
              hint="Up to 5 images — crossfade on the category hero banner. First image shows first."
            />
          </div>

          {/* ── Editorial copy ── */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editorial copy</p>

            <div className="space-y-1.5">
              <Label>Hero tagline</Label>
              <Input
                value={form.hero_tagline}
                onChange={(e) => set("hero_tagline")(e.target.value)}
                placeholder="e.g. Effortless style, every occasion"
              />
              <p className="text-xs text-muted-foreground">Short line overlaid on the hero banner. ~50 chars max.</p>
            </div>
          </div>

          {/* ── Settings ── */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</p>

            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order")(Number(e.target.value))}
                min={0}
                className="w-28"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first in menus and grids.</p>
            </div>

            {category && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Show this category on the webshop</p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => set("is_active")(v)}
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {category ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
