import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VirtualBookstoreContent } from "@/components/virtual-bookstore-content"

export const dynamic = "force-dynamic"

export default async function VirtualBookstorePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's books
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch available bookstore background images (templates)
  const { data: bookstoreImages } = await supabase
    .from("bookstore_images")
    .select("*")
    .eq("is_template", true)
    .order("created_at", { ascending: true })

  // Fetch user's active bookstore image and tags
  const { data: userBookstore } = await supabase
    .from("bookstore_images")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active_storefront", true)
    .single()

  // Fetch book tags if user has an active bookstore
  const { data: bookTags } = userBookstore
    ? await supabase
        .from("book_tags")
        .select(
          `
          *,
          books (*)
        `,
        )
        .eq("bookstore_image_id", userBookstore.id)
    : { data: [] }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 pb-20">
      <VirtualBookstoreContent
        userId={user.id}
        books={books || []}
        bookstoreTemplates={bookstoreImages || []}
        userBookstore={userBookstore}
        bookTags={bookTags || []}
      />
    </div>
  )
}
