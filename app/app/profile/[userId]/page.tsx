import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserProfileView } from "@/components/user-profile-view"

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // If viewing own profile, redirect to /app/profile
  if (params.userId === user.id) {
    redirect("/app/profile")
  }

  // Fetch the other user's profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", params.userId).single()

  if (!profile) {
    notFound()
  }

  const { data: existingFollow } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", user.id)
    .eq("following_id", params.userId)
    .maybeSingle()

  // Fetch virtual bookstore if exists
  const { data: userBookstore } = await supabase
    .from("bookstore_images")
    .select("*")
    .eq("user_id", params.userId)
    .maybeSingle()

  // Fetch user's books
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("owner_id", params.userId)
    .order("created_at", { ascending: false })

  // Fetch bookshelf preferences
  const { data: bookshelfPreferences } = await supabase
    .from("bookshelf_preferences")
    .select("*")
    .eq("user_id", params.userId)
    .maybeSingle()

  // Fetch book tags if bookstore exists
  let bookTags = []
  if (userBookstore) {
    const { data: tags } = await supabase
      .from("book_tags")
      .select(
        `
        *,
        books (*)
      `,
      )
      .eq("user_id", params.userId)
      .eq("bookstore_image_id", userBookstore.id)

    bookTags = tags || []
  }

  return (
    <div className="pb-16">
      <UserProfileView
        profile={profile}
        userId={user.id}
        existingInvitation={existingFollow}
        userBookstore={userBookstore}
        books={books || []}
        bookTags={bookTags}
        bookshelfPreferences={bookshelfPreferences}
      />
    </div>
  )
}
