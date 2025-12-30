import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileContent } from "@/components/profile-content"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return <ProfileContent profile={profile} userId={user.id} isOwnProfile={true} />
}
