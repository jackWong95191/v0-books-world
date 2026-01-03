"use server"

import { createClient } from "@/lib/supabase/server"

const ADMIN_USER_ID = "7881efa4-4809-47da-b719-2139bd41d603"

export async function checkAdminRole() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, user: null }
  }

  const isAdmin = user.id === ADMIN_USER_ID

  return {
    isAdmin,
    user: user,
  }
}

export async function requireAdmin() {
  const { isAdmin } = await checkAdminRole()

  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  return true
}
