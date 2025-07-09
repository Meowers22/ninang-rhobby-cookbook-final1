/**
 * Enhanced Recipes Page Component
 * Displays all recipes with filtering, real-time updates, and comprehensive admin controls
 * Handles recipe management operations for all user roles
 */
"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import RecipeCard from "../components/RecipeCard"
import baseUrl from "../utils/baseUrl"

const RecipesPage = () => {
  // ==================== STATE MANAGEMENT ====================
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, signature, pending, approved, declined
  const { user } = useAuth()
  const { lastMessage } = useWebSocket()
  const navigate = useNavigate()

  // ==================== EFFECTS ====================

  // Fetch recipes on component mount
  useEffect(() => {
    fetchRecipes()
  }, [])

  // Handle real-time updates via WebSocket
  useEffect(() => {
    if (lastMessage) {
      console.log("Received WebSocket message:", lastMessage)
      // Refresh recipes when any update is received
      fetchRecipes()
    }
  }, [lastMessage])

  // ==================== API FUNCTIONS ====================

  /**
   * Fetch all recipes from the backend
   * Applies proper authentication headers for role-based filtering
   */
  const fetchRecipes = async () => {
    try {
      const headers = {}
      if (user) {
        headers.Authorization = `Bearer ${localStorage.getItem("access_token")}`
      }

      const response = await fetch(`${baseUrl}/api/recipes/`, {
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        setRecipes(data.results || data)
      } else {
        console.error("Failed to fetch recipes:", response.status)
      }
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Approve a pending recipe (Admin/Super Admin only)
   */
  const handleApprove = async (recipeId) => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${recipeId}/approve/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
        // Recipe list will be updated via WebSocket
        console.log("Recipe approved successfully")
      } else {
        console.error("Failed to approve recipe:", response.status)
        alert("Failed to approve recipe. Please try again.")
      }
    } catch (error) {
      console.error("Error approving recipe:", error)
      alert("Error approving recipe. Please check your connection.")
    }
  }

  /**
   * Decline a pending recipe (Admin/Super Admin only)
   */
  const handleDecline = async (recipeId) => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${recipeId}/decline/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
        // Recipe list will be updated via WebSocket
        console.log("Recipe declined successfully")
      } else {
        console.error("Failed to decline recipe:", response.status)
        alert("Failed to decline recipe. Please try again.")
      }
    } catch (error) {
      console.error("Error declining recipe:", error)
      alert("Error declining recipe. Please check your connection.")
    }
  }

  /**
   * Toggle signature status of a recipe
   */
  const handleToggleSignature = async (recipeId) => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${recipeId}/signature/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
        // Recipe list will be updated via WebSocket
        console.log("Signature status toggled successfully")
      } else {
        const errorData = await response.json()
        console.error("Failed to toggle signature:", errorData)
        alert(errorData.error || "Failed to toggle signature status.")
      }
    } catch (error) {
      console.error("Error toggling signature:", error)
      alert("Error updating signature status. Please check your connection.")
    }
  }

  /**
   * Navigate to edit recipe page
   */
  const handleEdit = (recipeId) => {
    navigate(`/recipes/${recipeId}/edit`)
  }

  /**
   * Handle photo update for a recipe
   */
  const handlePhotoUpdate = async (recipeId, file) => {
    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`${baseUrl}/api/recipes/${recipeId}/photo/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      })

      if (response.ok) {
        // Recipe list will be updated via WebSocket
        console.log("Photo updated successfully")
      } else {
        const errorData = await response.json()
        console.error("Failed to update photo:", errorData)
        throw new Error(errorData.error || "Failed to update photo")
      }
    } catch (error) {
      console.error("Error updating photo:", error)
      throw error // Re-throw to be handled by the calling component
    }
  }

  /**
   * Delete a recipe (Admin/Super Admin only)
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return
    try {
      const response = await fetch(`/api/recipes/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access-token")}`,
        },
      })
      if (response.ok) {
        alert("Recipe deleted successfully.")
        // Optionally refresh the recipe list here
      } else {
        alert("Failed to delete recipe.")
      }
    } catch (error) {
      alert("An error occurred while deleting the recipe.")
    }
  }

  // ==================== FILTERING LOGIC ====================

  /**
   * Filter recipes based on selected filter
   */
  const filteredRecipes = recipes.filter((recipe) => {
    switch (filter) {
      case "signature":
        return recipe.is_signature
      case "pending":
        return recipe.status === "pending"
      case "approved":
        return recipe.status === "approved"
      case "declined":
        return recipe.status === "declined"
      default:
        return true
    }
  })

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-gray-600">Loading delicious recipes...</p>
        </div>
      </div>
    )
  }

  // ==================== RENDER COMPONENT ====================

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-gray-800 mb-2">All Recipes 📚</h1>
          <p className="text-gray-600">Discover delicious recipes from our community, mga anak!</p>
        </div>

        {/* Create Recipe Button - Only for logged-in users */}
        {user && (
          <Link
            to="/recipes/create"
            className="bg-blush-pink text-white px-6 py-3 rounded-full hover:bg-blush-pink/80 transition-colors"
          >
            Share Your Recipe! ✨
          </Link>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "all" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          All Recipes ({recipes.length})
        </button>

        <button
          onClick={() => setFilter("signature")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "signature" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          🌟 Signature Dishes ({recipes.filter((r) => r.is_signature).length})
        </button>

        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "approved" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          ✅ Approved ({recipes.filter((r) => r.status === "approved").length})
        </button>

        {/* Admin/Super Admin only filters */}
        {user && (user.role === "admin" || user.role === "super_admin") && (
          <>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-full transition-colors ${
                filter === "pending" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              ⏳ Pending ({recipes.filter((r) => r.status === "pending").length})
            </button>

            <button
              onClick={() => setFilter("declined")}
              className={`px-4 py-2 rounded-full transition-colors ${
                filter === "declined" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              ❌ Declined ({recipes.filter((r) => r.status === "declined").length})
            </button>
          </>
        )}
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              showActions={true}
              onApprove={handleApprove}
              onDecline={handleDecline}
              onToggleSignature={handleToggleSignature}
              onEdit={handleEdit}
              onPhotoUpdate={handlePhotoUpdate}
              onRefresh={fetchRecipes}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No recipes found</h3>
          <p className="text-gray-600 mb-6">
            {filter === "signature"
              ? "No signature dishes yet. Be the first to create one!"
              : filter === "pending"
                ? "No pending recipes to review."
                : filter === "approved"
                  ? "No approved recipes yet."
                  : filter === "declined"
                    ? "No declined recipes."
                    : "No recipes available. Start sharing your favorites!"}
          </p>
          {user && (
            <Link
              to="/recipes/create"
              className="bg-blush-pink text-white px-6 py-3 rounded-full hover:bg-blush-pink/80 transition-colors inline-block"
            >
              Share Your First Recipe! 🌟
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default RecipesPage
