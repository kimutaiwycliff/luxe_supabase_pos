"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import type { Product, ProductVariant } from "@/lib/types"
import { indexProduct, deleteProductFromIndex } from "./algolia"
import { searchProducts as algoliaSearchProducts } from "@/lib/algolia-search"

export interface ProductFormData {
  name: string
  description?: string
  category_id?: string
  supplier_id?: string
  brand?: string
  cost_price: number
  selling_price: number
  compare_at_price?: number
  tax_rate?: number
  is_active?: boolean
  is_featured?: boolean
  has_variants?: boolean
  track_inventory?: boolean
  allow_backorder?: boolean
  low_stock_threshold?: number
  image_url?: string
  images?: string[]
  tags?: string[]
}

export interface VariantFormData {
  product_id: string
  option_values: Record<string, string>
  cost_price?: number
  selling_price?: number
  image_url?: string
  is_active?: boolean
}

export async function getProducts(options?: {
  search?: string
  category_id?: string
  is_active?: boolean
  limit?: number
  offset?: number
}) {
  const supabase = await getSupabaseServer()

  if (options?.search && options.search.trim().length > 0) {
    try {
      const { products: algoliaHits, count } = await algoliaSearchProducts(options.search, {
        categoryId: options.category_id,
        isActive: options.is_active,
        limit: options.limit || 50,
      })

      if (algoliaHits.length > 0) {
        // Fetch full product data from Supabase using Algolia IDs
        const productIds = algoliaHits.map((p) => p.objectID)
        const { data: products, error } = await supabase
          .from("products")
          .select(`
            *,
            category:categories(id, name, slug),
            supplier:suppliers(id, name)
          `)
          .in("id", productIds)

        if (error) {
          console.error("Error fetching product details:", error)
          return { products: [], count: 0, error: error.message }
        }

        // Maintain Algolia's relevance ordering
        const sortedProducts = productIds.map((id) => products?.find((p) => p.id === id)).filter(Boolean) as Product[]

        return { products: sortedProducts, count, error: null }
      }

      return { products: [], count: 0, error: null }
    } catch (err) {
      console.error("Algolia search error:", err)
      // Fallback to basic Supabase search
      return fallbackProductSearch(options)
    }
  }

  // Standard query without search
  let query = supabase
    .from("products")
    .select(
      `
      *,
      category:categories(id, name, slug),
      supplier:suppliers(id, name)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  if (options?.category_id) {
    query = query.eq("category_id", options.category_id)
  }

  if (options?.is_active !== undefined) {
    query = query.eq("is_active", options.is_active)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching products:", error)
    return { products: [], count: 0, error: error.message }
  }

  return { products: data as Product[], count: count || 0, error: null }
}

async function fallbackProductSearch(options?: {
  search?: string
  category_id?: string
  is_active?: boolean
  limit?: number
  offset?: number
}) {
  const supabase = await getSupabaseServer()

  let query = supabase
    .from("products")
    .select(
      `
      *,
      category:categories(id, name, slug),
      supplier:suppliers(id, name)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%,barcode.ilike.%${options.search}%`)
  }

  if (options?.category_id) {
    query = query.eq("category_id", options.category_id)
  }

  if (options?.is_active !== undefined) {
    query = query.eq("is_active", options.is_active)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Error in fallback search:", error)
    return { products: [], count: 0, error: error.message }
  }

  return { products: data as Product[], count: count || 0, error: null }
}

export async function searchProductsForPOS(search: string, categoryId?: string) {
  const supabase = await getSupabaseServer()

  if (!search || search.trim().length === 0) {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(50)

    if (error) {
      return { results: [], error: error.message }
    }

    return { results: data as Product[], error: null }
  }

  try {
    const { searchProductsForPOS: algoliaSearchPOS } = await import("@/lib/algolia-search")
    const hits = await algoliaSearchPOS(search, categoryId)

    if (hits.length > 0) {
      const productIds = hits.map((p) => p.objectID)
      const { data: products } = await supabase
        .from("products")
        .select(`*, category:categories(id, name, slug)`)
        .in("id", productIds)
        .eq("is_active", true)

      // Maintain Algolia's relevance ordering
      const sortedProducts = productIds.map((id) => products?.find((p) => p.id === id)).filter(Boolean) as Product[]

      return { results: sortedProducts, error: null }
    }

    return { results: [], error: null }
  } catch (err) {
    console.error("Algolia POS search error:", err)
    // Fallback to ilike search
    const { data: fallback } = await supabase
      .from("products")
      .select(`*, category:categories(id, name, slug)`)
      .eq("is_active", true)
      .or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`)
      .limit(50)

    return { results: (fallback as Product[]) || [], error: null }
  }
}

export async function getProductById(id: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      supplier:suppliers(id, name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return { product: null, error: error.message }
  }

  return { product: data as Product, error: null }
}

export async function getProductByBarcode(barcode: string) {
  const supabase = await getSupabaseServer()

  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq("barcode", barcode)
    .eq("is_active", true)
    .single()

  if (product) {
    return { product: product as Product, variant: null, error: null }
  }

  const { data: variant, error } = await supabase
    .from("product_variants")
    .select(`
      *,
      product:products(
        *,
        category:categories(id, name, slug)
      )
    `)
    .eq("barcode", barcode)
    .eq("is_active", true)
    .single()

  if (error) {
    return { product: null, variant: null, error: "Product not found" }
  }

  return {
    product: variant.product as Product,
    variant: variant as ProductVariant,
    error: null,
  }
}

export async function createProduct(data: ProductFormData) {
  const supabase = await getSupabaseServer()

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: data.name,
      description: data.description || null,
      category_id: data.category_id || null,
      supplier_id: data.supplier_id || null,
      brand: data.brand || null,
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      compare_at_price: data.compare_at_price || null,
      tax_rate: data.tax_rate || 16,
      is_active: data.is_active ?? true,
      is_featured: data.is_featured ?? false,
      has_variants: data.has_variants ?? false,
      track_inventory: data.track_inventory ?? true,
      allow_backorder: data.allow_backorder ?? false,
      low_stock_threshold: data.low_stock_threshold || 5,
      image_url: data.image_url || null,
      images: data.images || [],
      tags: data.tags || [],
    })
    .select(`
      *,
      category:categories(name),
      supplier:suppliers(name)
    `)
    .single()

  if (error) {
    console.error("Error creating product:", error)
    return { product: null, error: error.message }
  }

  // Index to Algolia
  try {
    await indexProduct(product)
  } catch (err) {
    console.error("Error indexing product to Algolia:", err)
  }

  revalidateTag("products", "max")
  return { product: product as Product, error: null }
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  const supabase = await getSupabaseServer()

  const { data: product, error } = await supabase
    .from("products")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      category:categories(name),
      supplier:suppliers(name)
    `)
    .single()

  if (error) {
    console.error("Error updating product:", error)
    return { product: null, error: error.message }
  }

  // Update Algolia index
  try {
    await indexProduct(product)
  } catch (err) {
    console.error("Error updating product in Algolia:", err)
  }

  revalidateTag("products", "max")
  return { product: product as Product, error: null }
}

export async function deleteProduct(id: string) {
  const supabase = await getSupabaseServer()

  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    console.error("Error deleting product:", error)
    return { success: false, error: error.message }
  }

  // Remove from Algolia
  try {
    await deleteProductFromIndex(id)
  } catch (err) {
    console.error("Error removing product from Algolia:", err)
  }

  revalidateTag("products", "max")
  return { success: true, error: null }
}

export async function getProductVariants(productId: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at")

  if (error) {
    return { variants: [], error: error.message }
  }

  return { variants: data as ProductVariant[], error: null }
}

export async function createProductVariant(data: VariantFormData) {
  const supabase = await getSupabaseServer()

  const { data: variant, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: data.product_id,
      option_values: data.option_values,
      cost_price: data.cost_price || null,
      selling_price: data.selling_price || null,
      image_url: data.image_url || null,
      is_active: data.is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating variant:", error)
    return { variant: null, error: error.message }
  }

  revalidateTag("products", "max")
  return { variant: variant as ProductVariant, error: null }
}

export async function updateProductVariant(id: string, data: Partial<VariantFormData>) {
  const supabase = await getSupabaseServer()

  const { data: variant, error } = await supabase
    .from("product_variants")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { variant: null, error: error.message }
  }

  revalidateTag("products", "max")
  return { variant: variant as ProductVariant, error: null }
}

export async function deleteProductVariant(id: string) {
  const supabase = await getSupabaseServer()

  const { error } = await supabase.from("product_variants").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateTag("products", "max")
  return { success: true, error: null }
}
