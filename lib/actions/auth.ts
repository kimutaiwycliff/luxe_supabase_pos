  "use server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "../supabase/server"

export type AuthUser = {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  initials: string
  role?: string | null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (error || !user) {
    return null
  }

  // Fetch user role from user_profiles table
  let userRole = null;
  if (user.sub) {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.sub)
      .single();

    if (!profileError && profileData) {
      userRole = profileData.role;
    }
  }

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null
  const email = user.email || ""

  // Generate initials from name or email
  let initials = "U"
  if (fullName) {
    const names = fullName.split(" ")
    initials =
      names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : fullName.substring(0, 2).toUpperCase()
  } else if (email) {
    initials = email.substring(0, 2).toUpperCase()
  }

  return {
    id: user.id,
    email,
    fullName,
    avatarUrl: user.user_metadata?.avatar_url || null,
    initials,
    role: userRole,
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth/login")
}
