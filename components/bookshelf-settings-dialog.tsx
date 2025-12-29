"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X, Save } from "lucide-react"
import type { BookshelfPreferences } from "@/types/bookshelf"

interface BookshelfSettingsDialogProps {
  preferences: BookshelfPreferences
  onSave: (preferences: Partial<BookshelfPreferences>) => Promise<void>
  onClose: () => void
}

export function BookshelfSettingsDialog({ preferences, onSave, onClose }: BookshelfSettingsDialogProps) {
  const [formData, setFormData] = useState({
    wood_color: preferences.wood_color,
    wood_material: preferences.wood_material,
    shelf_rows: preferences.shelf_rows,
    shelf_columns: preferences.shelf_columns,
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error("Error saving preferences:", error)
      alert("保存失敗")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md border-2 border-gray-200">
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold">書架設置</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full border border-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Wood Color */}
          <div>
            <Label>木材顏色</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {[
                { value: "mahogany", label: "紅木", color: "bg-amber-900" },
                { value: "oak", label: "橡木", color: "bg-amber-700" },
                { value: "walnut", label: "胡桃木", color: "bg-amber-950" },
                { value: "pine", label: "松木", color: "bg-yellow-700" },
                { value: "white", label: "白色", color: "bg-gray-100 border border-gray-300" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, wood_color: option.value }))}
                  className={`aspect-square rounded-lg ${option.color} transition-all ${
                    formData.wood_color === option.value ? "ring-4 ring-primary scale-110" : "hover:scale-105"
                  }`}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          {/* Material Type */}
          <div>
            <Label htmlFor="material">材質風格</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { value: "wood", label: "實木", icon: "🪵", desc: "經典木紋" },
                { value: "laminate", label: "複合板", icon: "📋", desc: "斜紋圖案" },
                { value: "metal", label: "金屬", icon: "🔩", desc: "光澤質感" },
                { value: "glass", label: "玻璃", icon: "🪟", desc: "透明效果" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, wood_material: option.value }))}
                  className={`p-3 border-2 rounded-lg transition-all text-left ${
                    formData.wood_material === option.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div>
            <Label htmlFor="rows">書架層數: {formData.shelf_rows}</Label>
            <input
              id="rows"
              type="range"
              min="2"
              max="6"
              value={formData.shelf_rows}
              onChange={(e) => setFormData((prev) => ({ ...prev, shelf_rows: Number.parseInt(e.target.value) }))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>2層</span>
              <span>6層</span>
            </div>
          </div>

          {/* Columns */}
          <div>
            <Label htmlFor="columns">每層書籍數: {formData.shelf_columns}</Label>
            <input
              id="columns"
              type="range"
              min="3"
              max="8"
              value={formData.shelf_columns}
              onChange={(e) => setFormData((prev) => ({ ...prev, shelf_columns: Number.parseInt(e.target.value) }))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>3本</span>
              <span>8本</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent border border-gray-300"
            >
              取消
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-primary border border-primary">
              {loading ? (
                "保存中..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
