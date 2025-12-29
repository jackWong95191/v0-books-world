import { createClient } from "@/lib/supabase/server"
import { MyBooksContent } from "@/components/my-books-content"
import { redirect } from "next/navigation"

export default async function MyBooksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: myBooks } = await supabase
    .from("books")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  const { data: preferencesArray } = await supabase.from("bookshelf_preferences").select("*").eq("user_id", user.id)

  const defaultPreferences = {
    id: "",
    user_id: user.id,
    wood_color: "mahogany",
    wood_material: "wood",
    shelf_rows: 4,
    shelf_columns: 5,
    show_decorations: true,
    decoration_style: "minimal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Use first result if it exists, otherwise use defaults
  const preferences = preferencesArray && preferencesArray.length > 0 ? preferencesArray[0] : defaultPreferences

  return (
    <div className="flex-1 flex flex-col bg-background">
      <MyBooksContent initialBooks={myBooks || []} initialPreferences={preferences} userId={user.id} />
    </div>
  )
}
