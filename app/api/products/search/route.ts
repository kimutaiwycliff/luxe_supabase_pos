import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? ""
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "8"), 20)

  if (q.trim().length < 2) {
    return NextResponse.json({ products: [] })
  }

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("products")
    .select("id, name, selling_price, image_url, slug")
    .eq("is_active", true)
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(limit)

  return NextResponse.json({ products: data ?? [] })
}
