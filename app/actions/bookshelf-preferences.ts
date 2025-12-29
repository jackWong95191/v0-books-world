"use server"

import { createServerClient } from "@/lib/supabase/server"
import type { BookshelfPreferences } from "@/types/bookshelf"

export async function saveBookshelfPreferences(
  userId: string,
  preferenceId: string | null,
  updates: Partial<BookshelfPreferences>,
) {
  const supabase = await createServerClient()

  try {
    if (preferenceId) {
      // Update existing preferences
      const { error } = await supabase
        .from("bookshelf_preferences")
        .update(updates)
        .eq("id", preferenceId)
        .eq("user_id", userId)

      if (error) {
        console.error("[v0] Error updating preferences:", error)
        throw error
      }

      return { success: true, id: preferenceId }
    } else {
      // Insert new preferences
      const { data, error } = await supabase
        .from("bookshelf_preferences")
        .insert({ ...updates, user_id: userId })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error inserting preferences:", error)
        throw error
      }

      return { success: true, id: data.id, data }
    }
  } catch (error) {
    console.error("[v0] Server action error:", error)
    throw error
  }
}
