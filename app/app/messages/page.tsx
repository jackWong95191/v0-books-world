import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MessagesContent } from "@/components/messages-content"

export default async function MessagesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <MessagesContent userId={user.id} />
}
