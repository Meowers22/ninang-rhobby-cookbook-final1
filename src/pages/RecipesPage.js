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
  const [searchTerm, setSearchTerm] = useState("")
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
  // Filter recipes by search term and filter
  const filteredRecipes = recipes.filter((recipe) => {
    // Filter by type
    let matchesFilter = true;
    switch (filter) {
      case "signature":
        matchesFilter = recipe.is_signature;
        break;
      case "pending":
        matchesFilter = recipe.status === "pending";
        break;
      case "approved":
        matchesFilter = recipe.status === "approved";
        break;
      case "declined":
        matchesFilter = recipe.status === "declined";
        break;
      default:
        matchesFilter = true;
    }
    // Filter by search
    const matchesSearch = !searchTerm.trim() ||
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  })

  // Count recipes for each filter
  const countAll = recipes.length;
  const countSignature = recipes.filter((r) => r.is_signature).length;
  const countApproved = recipes.filter((r) => r.status === "approved").length;
  const countPending = recipes.filter((r) => r.status === "pending").length;
  const countDeclined = recipes.filter((r) => r.status === "declined").length;

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
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-gray-800 mb-2">All Recipes 📚</h1>
          <p className="text-gray-600">Discover delicious recipes from our community, mga anak!</p>
        </div>
        <div className="flex-1 flex justify-end min-w-[250px] max-w-md relative">
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full px-6 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blush-pink focus:border-transparent shadow-sm text-lg font-playfair transition-all pr-12"
            style={{ fontFamily: 'inherit' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
          </span>
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
          All Recipes ({countAll})
        </button>

        <button
          onClick={() => setFilter("signature")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "signature" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          🌟 Signature Dishes ({countSignature})
        </button>

        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "approved" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          ✅ Approved ({countApproved})
        </button>

        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "pending" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          ⏳ Pending ({countPending})
        </button>

        {/* Admin/Super Admin only filter for Declined */}
        {user && (user.role === "admin" || user.role === "super_admin") && (
          <button
            onClick={() => setFilter("declined")}
            className={`px-4 py-2 rounded-full transition-colors ${
              filter === "declined" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            ❌ Declined ({countDeclined})
          </button>
        )}
      </div>

      {/* Recipe List */}
      {filter === "pending" && user && (user.role === "admin" || user.role === "super_admin") ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleSignature={handleToggleSignature}
                showActions={true}
                onEdit={handleEdit}
                onApprove={handleApprove}
                onDecline={handleDecline}
                onPhotoUpdate={handlePhotoUpdate}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 italic py-12">No pending recipes found.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleSignature={handleToggleSignature}
                showActions={true}
                onEdit={handleEdit}
                onApprove={handleApprove}
                onDecline={handleDecline}
                onPhotoUpdate={handlePhotoUpdate}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 italic py-12">No recipes found.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecipesPage
