"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreVertical, Edit, Trash2, Tags, ChevronRight } from "lucide-react"
import { getCategories, deleteCategory } from "@/lib/actions/categories"
import { CategoryDialog } from "./category-dialog"
import type { Category } from "@/lib/types"
import { StatusBadge } from "@/components/ui/status-badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ── Small reusable card for a single category ──────────────────────────────
function CategoryCard({
  category,
  compact = false,
  onEdit,
  onDelete,
}: {
  category: Category
  compact?: boolean
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md",
        compact ? "flex items-center gap-3 p-3" : "",
      )}
    >
      {compact ? (
        <>
          {/* Compact thumbnail */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {category.image_path ? (
              <Image src={category.image_path} alt={category.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Tags className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{category.name}</p>
            <p className="truncate text-xs text-muted-foreground">{category.slug}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={category.is_active ? "active" : "inactive"} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(category)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <>
          {/* Full image banner */}
          {category.image_path ? (
            <div className="relative h-28 w-full">
              <Image src={category.image_path} alt={category.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center bg-muted/50">
              <Tags className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}

          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{category.name}</p>
                <p className="truncate text-xs text-muted-foreground">{category.slug}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(category)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {category.description && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{category.description}</p>
            )}
            {category.hero_tagline && (
              <p className="mt-1 text-xs text-muted-foreground italic line-clamp-1">"{category.hero_tagline}"</p>
            )}

            <div className="mt-2">
              <StatusBadge status={category.is_active ? "active" : "inactive"} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main content ───────────────────────────────────────────────────────────
export function CategoriesContent() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [prefillParentId, setPrefillParentId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data, isLoading, mutate } = useSWR("categories", async () => getCategories())
  const categories = data?.categories ?? []

  const parents   = categories.filter((c) => c.parent_id === null)
  const byParent  = categories.reduce<Record<string, Category[]>>((acc, c) => {
    if (c.parent_id) acc[c.parent_id] = [...(acc[c.parent_id] ?? []), c]
    return acc
  }, {})
  const orphans   = categories.filter(
    (c) => c.parent_id !== null && !parents.find((p) => p.id === c.parent_id),
  )

  const openCreate = useCallback((parentId: string | null = null) => {
    setEditingCategory(null)
    setPrefillParentId(parentId)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((category: Category) => {
    setEditingCategory(category)
    setPrefillParentId(null)
    setDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }, [])

  const handleDelete = async () => {
    if (!categoryToDelete) return
    setIsDeleting(true)
    const result = await deleteCategory(categoryToDelete.id)
    setIsDeleting(false)
    if (result.success) {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      mutate()
    }
  }

  const handleSuccess = useCallback(() => {
    mutate()
    setDialogOpen(false)
    setEditingCategory(null)
    setPrefillParentId(null)
  }, [mutate])

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="p-4 sm:p-6 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
        <Tags className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No categories yet</p>
        <p className="text-sm text-muted-foreground">Create categories to organise your products</p>
        <Button className="mt-4" onClick={() => openCreate()}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Top toolbar */}
      <div className="flex justify-end">
        <Button onClick={() => openCreate()}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Parent → children sections */}
      {parents.map((parent) => {
        const children = byParent[parent.id] ?? []
        return (
          <section key={parent.id}>
            {/* ── Parent row ── */}
            <div className="flex items-center gap-3 mb-3">
              {/* Parent image pill */}
              {parent.image_path && (
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border">
                  <Image src={parent.image_path} alt={parent.name} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold truncate">{parent.name}</h2>
                  <StatusBadge status={parent.is_active ? "active" : "inactive"} />
                  {parent.hero_tagline && (
                    <span className="hidden sm:inline text-xs text-muted-foreground italic truncate">
                      "{parent.hero_tagline}"
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{parent.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openEdit(parent)}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openCreate(parent.id)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add subcategory
                </Button>
              </div>
            </div>

            {/* ── Subcategories ── */}
            {children.length > 0 ? (
              <div className="ml-3 pl-3 border-l-2 border-border/60 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {children.map((sub) => (
                    <CategoryCard
                      key={sub.id}
                      category={sub}
                      compact
                      onEdit={openEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="ml-3 pl-3 border-l-2 border-border/60">
                <button
                  onClick={() => openCreate(parent.id)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add first subcategory
                </button>
              </div>
            )}

            <div className="mt-6 border-t border-border/40" />
          </section>
        )
      })}

      {/* Orphaned subcategories (edge case) */}
      {orphans.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground">Uncategorised subcategories</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {orphans.map((c) => (
              <CategoryCard key={c.id} category={c} compact onEdit={openEdit} onDelete={handleDeleteClick} />
            ))}
          </div>
        </section>
      )}

      {/* Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        categories={categories}
        prefillParentId={prefillParentId}
        onSuccess={handleSuccess}
      />

      {/* Delete confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{categoryToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Products in this category will become uncategorised.
              {byParent[categoryToDelete?.id ?? ""]?.length
                ? ` Its ${byParent[categoryToDelete?.id ?? ""].length} subcategory(ies) will also be affected.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
