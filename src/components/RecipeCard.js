/**
 * Enhanced RecipeCard Component
 * Displays recipe information with role-based action buttons
 * Includes Edit, Update Photo, Signature Toggle, and Approve/Decline buttons
 */
"use client"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import { useEffect, useState } from "react"
import baseUrl from "../utils/baseUrl"

const RecipeCard = ({
  recipe,
  showActions = false,
  onApprove,
  onDecline,
  onToggleSignature,
  onEdit,
  onPhotoUpdate,
  onRefresh,
  onDelete,
}) => {
  const { user } = useAuth()
  const { imageRefreshTrigger } = useWebSocket()
  const [imageKey, setImageKey] = useState(Date.now())

  // Force image refresh when WebSocket triggers update
  useEffect(() => {
    setImageKey(Date.now())
  }, [imageRefreshTrigger, recipe.updated_at, recipe.id])

  // Debug: Log recipe object to inspect image path
  useEffect(() => {
    console.log('RecipeCard recipe object:', recipe)
  }, [recipe])

  // Permission checks for different actions
  // Only allow edit if user is super_admin, admin, or the owner
  const canEdit =
    user &&
    (user.role === "super_admin" || user.role === "admin" || (user.role === "user" && recipe.author.id === user.id))

  // Only admins and super_admins can approve
  const canApprove = user && (user.role === "admin" || user.role === "super_admin")

  // Only allow signature toggle for super_admin, or owner (user/admin)
  const canToggleSignature =
    user &&
    (user.role === "super_admin" ||
      (user.role === "admin" && recipe.author.id === user.id) ||
      (user.role === "user" && recipe.author.id === user.id))

  // Only allow photo update for super_admin, or owner (user/admin)
  const canUpdatePhoto =
    user &&
    (user.role === "super_admin" ||
      (user.role === "admin" && recipe.author.id === user.id) ||
      (user.role === "user" && recipe.author.id === user.id))

  // Only allow delete for super_admin, admin, or owner
  const canDelete = user && (user.role === "super_admin" || user.role === "admin" || recipe.author.id === user.id)

  // Star rating display function
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>,
      )
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">
          ☆
        </span>,
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ☆
        </span>,
      )
    }

    return stars
  }

  // Handle photo update with file picker
  const handleUpdatePhoto = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file && onPhotoUpdate) {
        try {
          await onPhotoUpdate(recipe.id, file)
          // Force immediate image refresh
          setImageKey(Date.now())
          // Refresh the page or trigger a re-fetch if callback provided
          if (onRefresh) {
            setTimeout(() => onRefresh(), 1000) // Longer delay to ensure backend processing
          }
        } catch (error) {
          console.error("Error updating photo:", error)
          alert("Failed to update photo. Please try again.")
        }
      }
    }
    input.click()
  }

  // Helper to get correct image URL
  const getImageUrl = (image) => {
    if (!image) return "/placeholder.jpg";
    if (image.startsWith("http")) return `${image}?v=${imageKey}&t=${Date.now()}`;
    return `${baseUrl}${image}?v=${imageKey}&t=${Date.now()}`;
  }

  return (
    <div className="glass-card rounded-2xl p-6 heart-pulse fade-in">
      {/* Recipe Image */}
      {recipe.image && (
        <div className="relative mb-4">
          <img
            src={getImageUrl(recipe.image)}
            alt={recipe.title}
            className="w-full h-48 object-cover rounded-xl"
            key={`${recipe.id}-${imageKey}`}
            onError={(error) => {
              // Fallback if image fails to load
              error.target.onerror = null
              error.target.src = "/placeholder.jpg"
            }}
            onLoad={(event) => {
              // Image loaded successfully
              console.log("Image loaded:", event.target.src)
            }}
          />
          {/* Quick photo update button overlay for authorized users */}
          {showActions && canUpdatePhoto && (
            <button
              onClick={handleUpdatePhoto}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              title="Update Photo"
            >
              📷
            </button>
          )}
        </div>
      )}

      {/* Recipe Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-playfair font-semibold text-gray-800 flex-1">
          {recipe.title}
          {recipe.is_signature && (
            <span className="ml-2 text-yellow-500" title="Signature Dish">
              🌟
            </span>
          )}
        </h3>

        {/* Status Badge */}
        {recipe.status === "pending" && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">⏳ Pending</span>
        )}
        {recipe.status === "declined" && (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">❌ Declined</span>
        )}
      </div>

      {/* Recipe Description */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>

      {/* Rating and Servings */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1">
          {renderStars(recipe.average_rating || 0)}
          <span className="text-sm text-gray-500 ml-2">
            ({recipe.total_ratings || 0} {recipe.total_ratings === 1 ? "rating" : "ratings"})
          </span>
        </div>
        <span className="text-sm text-gray-500">Serves {recipe.servings}</span>
      </div>

      {/* Author and Date */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          by {recipe.author.first_name} {recipe.author.last_name}
        </span>
        <span className="text-xs text-gray-400">{new Date(recipe.created_at).toLocaleDateString()}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* View Recipe Button - Always visible */}
        <Link
          to={`/recipes/${recipe.id}`}
          className="bg-blush-pink text-white px-4 py-2 rounded-full text-sm hover:bg-blush-pink/80 transition-colors"
        >
          👀 View Recipe
        </Link>

        {/* Edit Button - Only for allowed roles/owners */}
        {showActions && canEdit && (
          <button
            onClick={() => onEdit && onEdit(recipe.id)}
            className="bg-lavender text-gray-700 px-3 py-2 rounded-full text-sm hover:bg-lavender/80 transition-colors"
          >
            ✏️ Edit
          </button>
        )}

        {/* Update Photo Button - Only for allowed roles/owners */}
        {showActions && canUpdatePhoto && (
          <button
            onClick={handleUpdatePhoto}
            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            🖼️ Update Photo
          </button>
        )}

        {/* Signature Toggle Button - Only for allowed roles/owners */}
        {showActions && canToggleSignature && (
          <button
            onClick={() => onToggleSignature && onToggleSignature(recipe.id)}
            className={`px-3 py-2 rounded-full text-sm transition-colors ${
              recipe.is_signature
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {recipe.is_signature ? "🌟 Remove Signature" : "⭐ Make Signature"}
          </button>
        )}

        {/* Approve/Decline Buttons - Only for admins/super_admins and pending recipes */}
        {showActions && canApprove && recipe.status === "pending" && (
          <>
            <button
              onClick={() => onApprove && onApprove(recipe.id)}
              className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm hover:bg-green-200 transition-colors"
            >
              ✅ Approve
            </button>
            <button
              onClick={() => onDecline && onDecline(recipe.id)}
              className="bg-red-100 text-red-800 px-3 py-2 rounded-full text-sm hover:bg-red-200 transition-colors"
            >
              ❌ Decline
            </button>
          </>
        )}

        {/* Delete Button - Only for allowed roles/owners */}
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(recipe.id)}
            className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm hover:bg-red-200 transition-colors mt-2"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  )
}

export default RecipeCard
