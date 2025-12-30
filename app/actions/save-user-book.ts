"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function saveUserBook(bookId: string, status: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("未登入")
  }

  // Check if user_books record exists
  const { data: existing } = await supabase
    .from("user_books")
    .select("*")
    .eq("book_id", bookId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    // Update existing record
    const { error } = await supabase.from("user_books").update({ status }).eq("book_id", bookId).eq("user_id", user.id)

    if (error) {
      throw new Error(`更新失敗: ${error.message}`)
    }
  } else {
    // Insert new record
    const { error } = await supabase.from("user_books").insert({
      book_id: bookId,
      user_id: user.id,
      status,
    })

    if (error) {
      throw new Error(`新增失敗: ${error.message}`)
    }
  }

  return { success: true }
}
