"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

export interface Location {
  id: string
  name: string
  code: string
  address: string | null
  is_default: boolean
  is_active: boolean
}

export async function getLocations() {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })

  if (error) {
    console.error("Error fetching locations:", error)
    return { locations: [], error: error.message }
  }

  return { locations: data as Location[], error: null }
}

export async function getDefaultLocation() {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_default", true)
    .eq("is_active", true)
    .single()

  if (error) {
    // If no default location, get the first active location
    const { data: fallback, error: fallbackError } = await supabase
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single()

    if (fallbackError) {
      console.error("Error fetching default location:", fallbackError)
      return { location: null, error: fallbackError.message }
    }

    return { location: fallback as Location, error: null }
  }

  return { location: data as Location, error: null }
}
