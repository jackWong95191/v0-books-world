"use server"

import { createClient } from "@/lib/supabase/server"

export async function uploadProfilePicture(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const file = formData.get("file") as File
  if (!file) {
    return { error: "No file provided" }
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File size must be less than 5MB" }
  }

  try {
    // Generate unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from("profile-pictures").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { error: "Failed to upload image" }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-pictures").getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return { error: "Failed to update profile" }
    }

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Profile picture upload error:", error)
    return { error: "An unexpected error occurred" }
  }
}
