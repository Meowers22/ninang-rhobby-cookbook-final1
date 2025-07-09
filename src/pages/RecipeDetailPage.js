"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import baseUrl from "../utils/baseUrl"

const RecipeDetailPage = () => {
  const { id } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [servings, setServings] = useState(2)
  const [userRating, setUserRating] = useState(0)
  const [fetchError, setFetchError] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('RecipeDetailPage id param:', id)
    fetchRecipe()
  }, [id])

  useEffect(() => {
    if (recipe) {
      setServings(recipe.servings)
      setUserRating(recipe.user_rating || 0)
    }
  }, [recipe])

  const fetchRecipe = async () => {
    try {
      setFetchError(null)
      const headers = {}
      if (user) {
        headers.Authorization = `Bearer ${localStorage.getItem("access_token")}`
      }
      const url = `${baseUrl}/api/recipes/${id}/`
      console.log('Fetching recipe detail from:', url)
      const response = await fetch(url, { headers })
      if (response.ok) {
        const data = await response.json()
        setRecipe(data)
      } else {
        setFetchError(`Recipe not found or error: ${response.status}`)
        // navigate("/recipes")
      }
    } catch (error) {
      setFetchError(`Error fetching recipe: ${error}`)
      // navigate("/recipes")
    } finally {
      setLoading(false)
    }
  }

  const handleRating = async (rating) => {
    if (!user) return

    try {
      const response = await fetch(`${baseUrl}/api/recipes/${id}/rate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ score: rating }),
      })

      if (response.ok) {
        setUserRating(rating)
        fetchRecipe() // Refresh to get updated average rating
      }
    } catch (error) {
      console.error("Error rating recipe:", error)
    }
  }

  const scaleIngredients = (ingredients, originalServings, newServings) => {
    const ratio = newServings / originalServings
    return ingredients.map((ingredient) => {
      // Simple scaling - multiply numbers found in the ingredient string
      return ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
        const scaled = (Number.parseFloat(match) * ratio).toFixed(2)
        return Number.parseFloat(scaled) % 1 === 0 ? Number.parseInt(scaled) : scaled
      })
    })
  }

  const renderStars = (rating, interactive = false, onRate = null) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => interactive && onRate && onRate(i)}
          className={`text-2xl ${interactive ? "hover:scale-110 transition-transform" : ""} ${
            i <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          disabled={!interactive}
        >
          ★
        </button>,
      )
    }
    return stars
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{fetchError}</h2>
        <Link to="/recipes" className="text-blush-pink hover:underline">
          Back to Recipes
        </Link>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recipe Not Found</h2>
        <Link to="/recipes" className="text-blush-pink hover:underline">
          Back to Recipes
        </Link>
      </div>
    )
  }

  const scaledIngredients = scaleIngredients(recipe.ingredients, recipe.servings, servings)
  const canDelete = user && (user.role === "super_admin" || user.role === "admin" || recipe.author.id === user.id)

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return
    try {
      const response = await fetch(`/api/recipes/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        alert("Recipe deleted successfully.")
        navigate("/recipes")
      } else {
        alert("Failed to delete recipe.")
      }
    } catch (error) {
      alert("An error occurred while deleting the recipe.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="mb-6">
        <Link to="/recipes" className="text-blush-pink hover:underline">
          ← Back to Recipes
        </Link>
      </div>

      <div className="glass-card rounded-3xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-playfair font-bold text-gray-800 mb-4">
            {recipe.title}
            {recipe.is_signature && (
              <span className="ml-3 text-yellow-500" title="Signature Dish">
                🌟
              </span>
            )}
          </h1>
          <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span>
              by {recipe.author.first_name} {recipe.author.last_name}
            </span>
            <span>•</span>
            <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Serves {recipe.servings}</span>
          </div>
        </div>

        {/* Image */}
        {recipe.image && (
          <div className="mb-8">
            <img
              src={`${baseUrl}${recipe.image}`}
              alt={recipe.title}
              className="w-full h-64 md:h-96 object-cover rounded-2xl"
            />
          </div>
        )}

        {/* Rating */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {renderStars(recipe.average_rating)}
            <span className="text-gray-600 ml-2">
              ({recipe.total_ratings} {recipe.total_ratings === 1 ? "rating" : "ratings"})
            </span>
          </div>

          {user && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Rate this recipe:</p>
              <div className="flex items-center justify-center space-x-1">
                {renderStars(userRating, true, handleRating)}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-playfair font-bold text-gray-800">Ingredients 🥘</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Servings:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(Number.parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                />
              </div>
            </div>

            <ul className="space-y-2">
              {scaledIngredients.map((ingredient, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blush-pink mt-1">•</span>
                  <span className="text-gray-700">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-4">Instructions 👩‍🍳</h2>
            <div className="prose prose-gray max-w-none">
              {recipe.steps.split("\n").map((step, index) => (
                <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                  {step}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {user && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 justify-center">
              {(user.role === "super_admin" ||
                user.role === "admin" ||
                (user.role === "user" && recipe.author.id === user.id)) && (
                <Link
                  to={`/recipes/${recipe.id}/edit`}
                  className="bg-lavender text-gray-700 px-6 py-2 rounded-full hover:bg-lavender/80 transition-colors"
                >
                  ✏️ Edit Recipe
                </Link>
              )}

              {user &&
                (user.role === "super_admin" ||
                  (user.role === "admin" && recipe.author.id === user.id) ||
                  (user.role === "user" && recipe.author.id === user.id)) && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/recipes/${id}/signature/`, {
                          method: "POST",
                          headers: {
                            "Authorization": `Bearer ${localStorage.getItem("token")}`,
                          },
                        });
                        if (response.ok) {
                          const updated = await response.json();
                          setRecipe(updated); // assumes setRecipe exists, else reload or refetch
                          alert(
                            updated.is_signature
                              ? "Recipe marked as signature!"
                              : "Signature removed."
                          );
                        } else {
                          alert("Failed to toggle signature status.");
                        }
                      } catch (error) {
                        alert("An error occurred while toggling signature status.");
                      }
                    }}
                    className={`px-6 py-2 rounded-full transition-colors ${
                      recipe.is_signature
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {recipe.is_signature ? "🌟 Remove Signature" : "⭐ Make Signature"}
                  </button>
                )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl mt-6 hover:bg-red-600 transition-colors"
                >
                  🗑️ Delete Recipe
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeDetailPage
