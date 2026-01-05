import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookFriendsContent } from "@/components/book-friends-content"

export default async function BookFriendsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch users the current user is following (accepted follows)
  const { data: followingData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .eq("status", "accepted")

  const followingIds = followingData?.map((f) => f.following_id) || []

  // Fetch users following the current user (accepted follows)
  const { data: followersData } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", user.id)
    .eq("status", "accepted")

  const followerIds = followersData?.map((f) => f.follower_id) || []

  // Get mutual friends (both following each other)
  const mutualIds = followingIds.filter((id) => followerIds.includes(id))

  // Fetch pending follow requests (received)
  const { data: pendingRequests } = await supabase
    .from("follows")
    .select("*")
    .eq("following_id", user.id)
    .eq("status", "pending")

  // Fetch pending follow requests (sent)
  const { data: sentRequests } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", user.id)
    .eq("status", "pending")

  // Fetch all relevant profile data
  const allUserIds = [...new Set([...followingIds, ...followerIds, ...mutualIds])]

  let profiles = []
  if (allUserIds.length > 0) {
    const { data: profilesData } = await supabase.from("profiles").select("*").in("id", allUserIds)

    profiles = profilesData || []
  }

  // Fetch profiles for pending requests
  const pendingRequestIds = [
    ...(pendingRequests?.map((r) => r.follower_id) || []),
    ...(sentRequests?.map((r) => r.following_id) || []),
  ]

  let pendingProfiles = []
  if (pendingRequestIds.length > 0) {
    const { data: pendingProfilesData } = await supabase.from("profiles").select("*").in("id", pendingRequestIds)

    pendingProfiles = pendingProfilesData || []
  }

  return (
    <div className="pb-16">
      <BookFriendsContent
        userId={user.id}
        followingIds={followingIds}
        followerIds={followerIds}
        mutualIds={mutualIds}
        profiles={profiles}
        pendingRequests={pendingRequests || []}
        sentRequests={sentRequests || []}
        pendingProfiles={pendingProfiles}
      />
    </div>
  )
}
