"use server"

import { createClient } from "@/lib/supabase/server"

export async function uploadBookCover(formData: FormData) {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "未授權" }
  }

  const file = formData.get("file") as File
  if (!file) {
    return { error: "沒有提供檔案" }
  }

  try {
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${user.id}/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage.from("book-covers").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      return { error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("book-covers").getPublicUrl(filePath)

    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    console.error("[v0] Upload exception:", error)
    return { error: error instanceof Error ? error.message : "上傳失敗" }
  }
}
