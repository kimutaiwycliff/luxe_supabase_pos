"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import type { Category } from "@/lib/types"

export async function getCategories(options?: { is_active?: boolean }) {
  const supabase = await getSupabaseServer()

  let query = supabase.from("categories").select("*").order("sort_order")

  if (options?.is_active !== undefined) {
    query = query.eq("is_active", options.is_active)
  }

  const { data, error } = await query

  if (error) {
    return { categories: [], error: error.message }
  }

  return { categories: data as Category[], error: null }
}

export async function createCategory(data: {
  name: string
  description?: string
  parent_id?: string
  image_path?: string
}) {
  const supabase = await getSupabaseServer()

  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      name: data.name,
      slug,
      description: data.description || null,
      parent_id: data.parent_id || null,
      image_path: data.image_path || null,
    })
    .select()
    .single()

  if (error) {
    return { category: null, error: error.message }
  }

  // @ts-ignore
  revalidateTag("categories", "max")
  return { category: category as Category, error: null }
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string
    description: string
    parent_id: string
    image_path: string
    is_active: boolean
    sort_order: number
  }>,
) {
  const supabase = await getSupabaseServer()

  const updateData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }

  if (data.name) {
    updateData.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const { data: category, error } = await supabase.from("categories").update(updateData).eq("id", id).select().single()

  if (error) {
    return { category: null, error: error.message }
  }

  // @ts-ignore
  revalidateTag("categories", "max")
  return { category: category as Category, error: null }
}

export async function deleteCategory(id: string) {
  const supabase = await getSupabaseServer()

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  // @ts-ignore
  revalidateTag("categories", "max")
  return { success: true, error: null }
}
