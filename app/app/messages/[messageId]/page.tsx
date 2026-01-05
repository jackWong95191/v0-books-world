import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MessageDetailContent } from "@/components/message-detail-content"

export default async function MessageDetailPage({ params }: { params: { messageId: string } }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <MessageDetailContent userId={user.id} messageId={params.messageId} />
}
