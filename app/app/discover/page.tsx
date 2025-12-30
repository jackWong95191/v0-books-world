import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DiscoverContent } from "@/components/discover-content"

export default async function DiscoverPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: randomUsers } = await supabase.from("profiles").select("*").neq("id", user.id).limit(10)

  const { data: bookstoresData } = await supabase
    .from("bookstore_images")
    .select("*")
    .neq("user_id", user.id)
    .not("store_name", "is", null)
    .limit(10)

  const bookstoreUserIds = bookstoresData?.map((bs) => bs.user_id).filter(Boolean) || []
  const { data: bookstoreProfiles } = bookstoreUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, display_name, avatar_url")
        .in("id", bookstoreUserIds)
    : { data: [] }

  const randomBookstores = bookstoresData?.map((bookstore) => ({
    ...bookstore,
    profiles: bookstoreProfiles?.find((p) => p.id === bookstore.user_id) || null,
  }))

  const { data: booksData } = await supabase
    .from("books")
    .select("*")
    .neq("owner_id", user.id)
    .not("owner_id", "is", null)
    .limit(20)

  const bookOwnerIds = booksData?.map((b) => b.owner_id).filter(Boolean) || []
  const { data: bookOwnerProfiles } = bookOwnerIds.length
    ? await supabase.from("profiles").select("id, username, full_name, display_name, avatar_url").in("id", bookOwnerIds)
    : { data: [] }

  const randomBooks = booksData?.map((book) => ({
    ...book,
    profiles: bookOwnerProfiles?.find((p) => p.id === book.owner_id) || null,
  }))

  return (
    <DiscoverContent
      userId={user.id}
      initialUsers={randomUsers || []}
      initialBookstores={randomBookstores || []}
      initialBooks={randomBooks || []}
    />
  )
}
