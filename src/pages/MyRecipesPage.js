"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import RecipeCard from "../components/RecipeCard"
import baseUrl from "../utils/baseUrl"
import { useToast } from "../hooks/use-toast"

const MyRecipesPage = () => {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, pending, approved, declined
  const { user } = useAuth()
  const { lastMessage } = useWebSocket()
  const navigate = useNavigate()
  const { toast } = useToast()

  const fetchMyRecipes = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const allRecipes = data.results || data
        // Filter to only show current user's recipes
        const myRecipes = allRecipes.filter((recipe) => recipe.author.id === user.id)
        setRecipes(myRecipes)
      } else {
        console.error("Failed to fetch recipes:", response.status)
      }
    } catch (error) {
      console.error("Error fetching my recipes:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login")
    }
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      fetchMyRecipes()
    }
  }, [user, fetchMyRecipes])

  // Handle real-time updates via WebSocket
  useEffect(() => {
    if (lastMessage && user) {
      // Only handle recipe_update events for real-time sync
      if (lastMessage.type === "recipe_update" && lastMessage.data && lastMessage.data.recipe) {
        const { action, recipe } = lastMessage.data
        if (action === "delete") {
          setRecipes((prev) => prev.filter((r) => r.id !== recipe.id))
        } else if (["update", "approve", "decline", "signature_toggle", "photo_update"].includes(action)) {
          setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? recipe : r)))
        } else if (action === "create") {
          // Only add if the recipe belongs to the user
          if (recipe.author.id === user.id) {
            setRecipes((prev) => [recipe, ...prev])
          }
        }
      } else {
        // fallback: refetch all
        fetchMyRecipes()
      }
    }
  }, [lastMessage, user, fetchMyRecipes])

  const handleApprove = async (recipeId) => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${recipeId}/approve/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
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

  const handleDecline = async (recipeId) => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${recipeId}/decline/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
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

  const handleToggleSignature = async (recipeId) => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${recipeId}/signature/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (response.ok) {
        toast({ title: "Signature updated!", description: "Signature dish status toggled.", variant: "default" })
      } else {
        const errorData = await response.json()
        toast({ title: "Failed to toggle signature", description: errorData.error || "Failed to toggle signature status.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error updating signature status. Please check your connection.", variant: "destructive" })
    }
  }

  const handleEdit = (recipeId) => {
    navigate(`/recipes/${recipeId}/edit`)
  }

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
        console.log("Photo updated successfully")
      } else {
        const errorData = await response.json()
        console.error("Failed to update photo:", errorData)
        throw new Error(errorData.error || "Failed to update photo")
      }
    } catch (error) {
      console.error("Error updating photo:", error)
      throw error
    }
  }

  const [deletingId, setDeletingId] = useState(null);
  const handleDelete = async (recipeId) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    setDeletingId(recipeId);
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${recipeId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (response.ok) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        toast({ title: "Recipe deleted!", description: "Your recipe was deleted successfully.", variant: "default" });
      } else {
        let errorMsg = `Failed to delete recipe. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) errorMsg += ` | ${errorData.error}`;
          console.log("Delete error response:", errorData);
        } catch (e) {
          console.log("Delete error: Could not parse error response", e);
        }
        toast({ title: "Failed to delete recipe", description: errorMsg, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error.message || "An error occurred while deleting the recipe.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  // Filter recipes based on selected filter
  const filteredRecipes = recipes.filter((recipe) => {
    switch (filter) {
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

  if (!user) {
    return null // Will redirect to login
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-600">Loading your recipes...</p>
        </div>
      </div>
    )
  }

  const pendingCount = recipes.filter((r) => r.status === "pending").length
  const approvedCount = recipes.filter((r) => r.status === "approved").length
  const declinedCount = recipes.filter((r) => r.status === "declined").length

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-gray-800 mb-2">My Recipes 👨‍🍳</h1>
          <p className="text-gray-600">
            Manage all your delicious recipes, anak! Track their status and share your culinary creations.
          </p>
        </div>

        <Link
          to="/recipes/create"
          className="bg-blush-pink text-white px-6 py-3 rounded-full hover:bg-blush-pink/80 transition-colors"
        >
          Add New Recipe! ✨
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold text-gray-800">{recipes.length}</div>
          <div className="text-sm text-gray-600">Total Recipes</div>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">❌</div>
          <div className="text-2xl font-bold text-red-600">{declinedCount}</div>
          <div className="text-sm text-gray-600">Declined</div>
        </div>
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
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "pending" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          ⏳ Pending ({pendingCount})
        </button>

        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "approved" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          ✅ Approved ({approvedCount})
        </button>

        <button
          onClick={() => setFilter("declined")}
          className={`px-4 py-2 rounded-full transition-colors ${
            filter === "declined" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          ❌ Declined ({declinedCount})
        </button>
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
              onRefresh={fetchMyRecipes}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {filter === "pending"
              ? "No pending recipes"
              : filter === "approved"
                ? "No approved recipes yet"
                : filter === "declined"
                  ? "No declined recipes"
                  : "No recipes yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === "all"
              ? "Start sharing your delicious recipes with the family!"
              : `You don't have any ${filter} recipes at the moment.`}
          </p>
          {filter === "all" && (
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

export default MyRecipesPage
