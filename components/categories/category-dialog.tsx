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
import { createCategory, updateCategory } from "@/lib/actions/categories"
import type { Category } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  categories: Category[]
  onSuccess: () => void
}

export function CategoryDialog({ open, onOpenChange, category, categories, onSuccess }: CategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: null, // Updated default value to null
    is_active: true,
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        parent_id: category.parent_id || null, // Updated default value to null
        is_active: category.is_active,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        parent_id: null, // Updated default value to null
        is_active: true,
      })
    }
    setError(null)
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = category
        ? await updateCategory(category.id, {
          name: formData.name,
          description: formData.description || undefined,
          parent_id: formData.parent_id || undefined,
          is_active: formData.is_active,
        })
        : await createCategory({
          name: formData.name,
          description: formData.description || undefined,
          parent_id: formData.parent_id || undefined,
        })

      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter out the current category from parent options
  const parentOptions = categories.filter((c) => c.id !== category?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Dresses"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category description..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Parent Category</Label>
            <Select
              value={formData.parent_id ? formData.parent_id.toString() : "none"} // Updated value conversion to string
              onValueChange={(value) =>
                setFormData({ ...formData, parent_id: value === "none" ? null : Number.parseInt(value) })
              } // Updated value conversion to integer
            >
              <SelectTrigger>
                <SelectValue placeholder="None (Top Level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top Level)</SelectItem>
                {parentOptions.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category && (
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">Show this category in the store</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {category ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
