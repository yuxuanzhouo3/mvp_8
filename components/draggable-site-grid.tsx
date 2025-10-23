"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Heart, Trash2, ExternalLink, GripVertical } from "lucide-react"

function SortableSiteCard({ site, onRemove, favorites, toggleFavorite, isDragDisabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  const handleSiteClick = (e, url) => {
    // Prevent opening site when dragging
    if (isDragging) return
    e.stopPropagation()
    window.open(url, "_blank")
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={style}
          {...(isDragDisabled ? {} : { ...attributes, ...listeners })}
          className={`group relative ${isDragDisabled ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} p-3 bg-white/8 backdrop-blur-sm rounded-xl border border-white/10 hover:border-blue-400/50 hover:bg-white/15 transition-all duration-200 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 ${
            isDragging ? "shadow-2xl border-blue-500 bg-white/20 scale-110" : ""
          } ${isDragDisabled ? "opacity-60" : ""}`}
        >
          {/* Drag indicator */}
          {!isDragDisabled && (
            <div className="absolute top-1 right-1 opacity-60 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-white/80" />
            </div>
          )}

          {/* Drag hint overlay */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

          <div onClick={(e) => handleSiteClick(e, site.url)} className="relative text-center space-y-2 cursor-pointer">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-200">{site.logo}</div>
            <div className="text-xs text-white/80 group-hover:text-white font-medium truncate">{site.name}</div>
          </div>

          {/* Custom site indicator */}
          {site.custom && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-800" />
          )}

          {/* Favorite indicator */}
          {favorites.has(site.id) && (
            <div className="absolute -top-1 -left-1">
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </div>
          )}

          {/* Drag instruction tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {isDragDisabled ? "Sign up to drag & reorder" : "Drag to reorder • Click to visit"}
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="bg-slate-800 border-slate-700">
        <ContextMenuItem
          onClick={() => handleSiteClick({ stopPropagation: () => {} }, site.url)}
          className="text-white hover:bg-slate-700"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </ContextMenuItem>
        <ContextMenuItem onClick={() => toggleFavorite(site.id)} className="text-white hover:bg-slate-700">
          <Heart className={`w-4 h-4 mr-2 ${favorites.has(site.id) ? "fill-red-500 text-red-500" : ""}`} />
          {favorites.has(site.id) ? "Remove from Favorites" : "Add to Favorites"}
        </ContextMenuItem>
        {site.custom && (
          <ContextMenuItem onClick={() => onRemove(site.id)} className="text-red-400 hover:bg-slate-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Site
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function DraggableSiteGrid({ sites, onRemove, onReorder, isDragDisabled = false }) {
  const [favorites, setFavorites] = useState(new Set())

  // 防止hydration mismatch：确保sites数组安全
  const safeSites = Array.isArray(sites) ? sites : []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isDragDisabled ? 999999 : 8, // Effectively disable if needed
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const toggleFavorite = (siteId) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(siteId)) {
      newFavorites.delete(siteId)
    } else {
      newFavorites.add(siteId)
    }
    setFavorites(newFavorites)
  }

  function handleDragEnd(event) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = safeSites.findIndex((site) => site.id === active.id)
      const newIndex = safeSites.findIndex((site) => site.id === over.id)

      const newSites = arrayMove(safeSites, oldIndex, newIndex)
      onReorder(newSites)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={safeSites.map((site) => site.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {safeSites.map((site) => (
            <SortableSiteCard
              key={site.id}
              site={site}
              onRemove={onRemove}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              isDragDisabled={isDragDisabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
