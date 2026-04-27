"use server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { revalidateTag } from "next/cache"

export interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  image_path: string | null
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CollectionProduct {
  collection_id: string
  product_id: string
  sort_order: number
  product?: {
    id: string
    name: string
    slug: string
    selling_price: number
    image_url: string | null
  }
}

export async function getCollections() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order")
  return { collections: (data ?? []) as Collection[], error: error?.message ?? null }
}

export async function getCollectionWithProducts(id: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("collection_products")
    .select("*, product:products(id, name, slug, selling_price, image_url)")
    .eq("collection_id", id)
    .order("sort_order")
  return { items: (data ?? []) as CollectionProduct[], error: error?.message ?? null }
}

export async function createCollection(input: {
  name: string
  description?: string
  image_path?: string
  is_featured?: boolean
  sort_order?: number
}) {
  const supabase = getSupabaseAdmin()
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const { data, error } = await supabase
    .from("collections")
    .insert({ ...input, slug })
    .select()
    .single()
  if (error) return { collection: null, error: error.message }
  ;(revalidateTag as any)("collections", "max")
  return { collection: data as Collection, error: null }
}

export async function updateCollection(
  id: string,
  input: Partial<{
    name: string
    description: string
    image_path: string
    is_active: boolean
    is_featured: boolean
    sort_order: number
  }>,
) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("collections")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) return { collection: null, error: error.message }
  ;(revalidateTag as any)("collections", "max")
  return { collection: data as Collection, error: null }
}

export async function deleteCollection(id: string) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from("collections").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  ;(revalidateTag as any)("collections", "max")
  return { success: true, error: null }
}

export async function addProductToCollection(collectionId: string, productId: string) {
  const supabase = getSupabaseAdmin()
  const { count } = await supabase
    .from("collection_products")
    .select("*", { count: "exact", head: true })
    .eq("collection_id", collectionId)
  const { error } = await supabase
    .from("collection_products")
    .insert({ collection_id: collectionId, product_id: productId, sort_order: count ?? 0 })
  if (error) return { error: error.message }
  ;(revalidateTag as any)("collections", "max")
  return { error: null }
}

export async function removeProductFromCollection(collectionId: string, productId: string) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("collection_products")
    .delete()
    .eq("collection_id", collectionId)
    .eq("product_id", productId)
  if (error) return { error: error.message }
  ;(revalidateTag as any)("collections", "max")
  return { error: null }
}
