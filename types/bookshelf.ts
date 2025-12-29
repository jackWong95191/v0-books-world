export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  image_url?: string
  description?: string
  publication_year?: number
  publisher?: string
  edition?: string
  language?: string
  pages?: number
  format?: string
  category?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface BookshelfPreferences {
  id: string
  user_id: string
  wood_color: string
  wood_material: string
  shelf_rows: number
  shelf_columns: number
  show_decorations: boolean
  decoration_style?: string
  created_at: string
  updated_at: string
}
