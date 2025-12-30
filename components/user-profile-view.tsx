"use client"

import { useState } from "react"
import { ProfileContent } from "@/components/profile-content"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserBookstoreDisplay } from "@/components/user-bookstore-display"

interface UserProfileViewProps {
  profile: any
  userId: string
  existingInvitation?: any
  userBookstore?: any
  books: any[]
  bookTags: any[]
  bookshelfPreferences?: any
}

export function UserProfileView({
  profile,
  userId,
  existingInvitation,
  userBookstore,
  books,
  bookTags,
  bookshelfPreferences,
}: UserProfileViewProps) {
  const [showBookstoreModal, setShowBookstoreModal] = useState(false)
  const [showBookshelfModal, setShowBookshelfModal] = useState(false)

  return (
    <>
      <ProfileContent
        profile={profile}
        userId={userId}
        isOwnProfile={false}
        existingInvitation={existingInvitation}
        hasBookstore={!!userBookstore}
        onViewBookstore={() => setShowBookstoreModal(true)}
        onViewBookshelf={() => setShowBookshelfModal(true)}
      />

      {/* Bookstore Modal */}
      <Dialog open={showBookstoreModal} onOpenChange={setShowBookstoreModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profile.display_name || profile.full_name || profile.username}的虛擬書店</DialogTitle>
          </DialogHeader>
          <UserBookstoreDisplay
            userId={profile.id}
            books={books}
            userBookstore={userBookstore}
            bookTags={bookTags}
            bookshelfPreferences={bookshelfPreferences}
            showOnlyBookstore={true}
          />
        </DialogContent>
      </Dialog>

      {/* Bookshelf Modal */}
      <Dialog open={showBookshelfModal} onOpenChange={setShowBookshelfModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profile.display_name || profile.full_name || profile.username}的書架</DialogTitle>
          </DialogHeader>
          <UserBookstoreDisplay
            userId={profile.id}
            books={books}
            userBookstore={null}
            bookTags={[]}
            bookshelfPreferences={bookshelfPreferences}
            showOnlyBookshelf={true}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
