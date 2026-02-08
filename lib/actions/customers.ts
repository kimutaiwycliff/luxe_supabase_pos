"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import type { Customer } from "@/lib/types"
import { indexCustomer } from "./algolia"
import { searchCustomers as algoliaSearchCustomers } from "@/lib/algolia-search"

export async function getCustomers(options?: {
  search?: string
  is_active?: boolean
  limit?: number
}) {
  const supabase = await getSupabaseServer()

  if (options?.search && options.search.trim().length > 0) {
    try {
      const { customers: algoliaHits, count } = await algoliaSearchCustomers(options.search, {
        isActive: options.is_active,
        limit: options.limit || 20,
      })

      if (algoliaHits.length > 0) {
        const customerIds = algoliaHits.map((c) => c.objectID)
        const { data: customers, error } = await supabase.from("customers").select("*").in("id", customerIds)

        if (error) {
          return { customers: [], error: error.message }
        }

        // Maintain Algolia's relevance ordering
        const sortedCustomers = customerIds
          .map((id) => customers?.find((c) => c.id === id))
          .filter(Boolean) as Customer[]

        return { customers: sortedCustomers, error: null }
      }

      return { customers: [], error: null }
    } catch (err) {
      console.error("Algolia customer search error:", err)
      return fallbackCustomerSearch(options)
    }
  }

  // Standard query without search
  let query = supabase.from("customers").select("*").order("created_at", { ascending: false })

  if (options?.is_active !== undefined) {
    query = query.eq("is_active", options.is_active)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    return { customers: [], error: error.message }
  }

  return { customers: data as Customer[], error: null }
}

async function fallbackCustomerSearch(options?: {
  search?: string
  is_active?: boolean
  limit?: number
}) {
  const supabase = await getSupabaseServer()

  let query = supabase.from("customers").select("*").order("created_at", { ascending: false })

  if (options?.search) {
    query = query.or(
      `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,phone.ilike.%${options.search}%,email.ilike.%${options.search}%`,
    )
  }

  if (options?.is_active !== undefined) {
    query = query.eq("is_active", options.is_active)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    return { customers: [], error: error.message }
  }

  return { customers: data as Customer[], error: null }
}

export async function getCustomerById(id: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single()

  if (error) {
    return { customer: null, error: error.message }
  }

  return { customer: data as Customer, error: null }
}

export async function createCustomer(data: {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  notes?: string
}) {
  const supabase = await getSupabaseServer()

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) {
    return { customer: null, error: error.message }
  }

  // Index to Algolia
  try {
    await indexCustomer(customer)
  } catch (err) {
    console.error("Error indexing customer to Algolia:", err)
  }

  ; (revalidateTag as any)("customers", "max")
  return { customer: customer as Customer, error: null }
}

export async function searchCustomerByPhone(phone: string) {
  const supabase = await getSupabaseServer()

  // Try Algolia first
  try {
    const { customers: algoliaHits } = await algoliaSearchCustomers(phone, {
      isActive: true,
      limit: 5,
    })

    if (algoliaHits.length > 0) {
      const customerIds = algoliaHits.map((c) => c.objectID)
      const { data: customers } = await supabase.from("customers").select("*").in("id", customerIds)

      return { customers: (customers as Customer[]) || [], error: null }
    }
  } catch (err) {
    console.error("Algolia phone search error:", err)
  }

  // Fallback to basic ilike search
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .or(`phone.ilike.%${phone}%,email.ilike.%${phone}%`)
    .eq("is_active", true)
    .limit(5)

  if (error) {
    return { customers: [], error: error.message }
  }

  return { customers: data as Customer[], error: null }
}
