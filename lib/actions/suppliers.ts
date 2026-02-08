"use server"

import { revalidateTag } from "next/cache"
import { indexSupplier, deleteSupplierFromIndex } from "./algolia"
import { searchSuppliers as algoliaSearchSuppliers } from "@/lib/algolia-search"
import { getSupabaseServer } from "../supabase/server"

export async function getSuppliers(options?: { search?: string }) {
  const supabase = await getSupabaseServer()

  if (options?.search && options.search.trim().length > 0) {
    try {
      const { suppliers: algoliaHits } = await algoliaSearchSuppliers(options.search, {
        limit: 50,
      })

      if (algoliaHits.length > 0) {
        const supplierIds = algoliaHits.map((s) => s.objectID)
        const { data: suppliers, error } = await supabase
          .from("suppliers")
          .select(`*, products:products(count)`)
          .in("id", supplierIds)

        if (error) throw error

        // Maintain Algolia's relevance ordering
        return supplierIds.map((id) => suppliers?.find((s) => s.id === id)).filter(Boolean)
      }

      return []
    } catch (err) {
      console.error("Algolia supplier search error:", err)
      // Fallback to basic ilike search
      const { data: fallback, error: fallbackError } = await supabase
        .from("suppliers")
        .select(`*, products:products(count)`)
        .or(`name.ilike.%${options.search}%,contact_person.ilike.%${options.search}%,email.ilike.%${options.search}%`)
        .order("name")

      if (fallbackError) throw fallbackError
      return fallback
    }
  }

  // Standard query without search
  const { data, error } = await supabase
    .from("suppliers")
    .select(`
      *,
      products:products(count)
    `)
    .order("name")

  if (error) throw error
  return data
}

export async function getSupplier(id: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("suppliers")
    .select(`
      *,
      products:products(
        id,
        name,
        sku,
        cost_price,
        retail_price,
        is_active
      )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createSupplier(formData: FormData) {
  const supabase = await getSupabaseServer()

  const supplierData = {
    name: formData.get("name") as string,
    contact_person: (formData.get("contact_person") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    address: (formData.get("address") as string) || null,
    payment_terms: (formData.get("payment_terms") as string) || null,
    // lead_time_days: formData.get("lead_time_days") ? Number.parseInt(formData.get("lead_time_days") as string) : null,
    notes: (formData.get("notes") as string) || null,
    is_active: true,
  }

  const { data, error } = await supabase.from("suppliers").insert(supplierData).select().single()

  if (error) throw error

  // Index to Algolia
  try {
    await indexSupplier(data)
  } catch (err) {
    console.error("Error indexing supplier to Algolia:", err)
  }

  ; (revalidateTag as any)("suppliers", "max")
  return data
}

export async function updateSupplier(id: string, formData: FormData) {
  const supabase = await getSupabaseServer()

  const supplierData = {
    name: formData.get("name") as string,
    contact_person: (formData.get("contact_person") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    address: (formData.get("address") as string) || null,
    payment_terms: (formData.get("payment_terms") as string) || null,
    // lead_time_days: formData.get("lead_time_days") ? Number.parseInt(formData.get("lead_time_days") as string) : null,
    notes: (formData.get("notes") as string) || null,
    is_active: formData.get("is_active") === "true",
  }

  const { data, error } = await supabase.from("suppliers").update(supplierData).eq("id", id).select().single()

  if (error) throw error

  // Update Algolia index
  try {
    await indexSupplier(data)
  } catch (err) {
    console.error("Error updating supplier in Algolia:", err)
  }

  ; (revalidateTag as any)("suppliers", "max")
  return data
}

export async function deleteSupplier(id: string) {
  const supabase = await getSupabaseServer()

  const { error } = await supabase.from("suppliers").delete().eq("id", id)

  if (error) throw error

  // Remove from Algolia
  try {
    await deleteSupplierFromIndex(id)
  } catch (err) {
    console.error("Error removing supplier from Algolia:", err)
  }

  ; (revalidateTag as any)("suppliers", "max")
}

export async function getSupplierById(id: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("suppliers")
    .select(`
      *,
      products:products(count)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return { supplier: null, error: error.message }
  }

  return { supplier: data, error: null }
}
