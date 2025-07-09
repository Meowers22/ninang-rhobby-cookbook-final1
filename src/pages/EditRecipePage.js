"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import baseUrl from "../utils/baseUrl"

const EditRecipePage = () => {
  const { id } = useParams()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ingredients: [""],
    steps: "",
    servings: 2,
    image: null,
  })
  const [currentImage, setCurrentImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecipe()
  }, [id])

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
        const recipe = await response.json()

        // Check permissions
        if (user.role !== "super_admin" && user.role !== "admin" && recipe.author.id !== user.id) {
          navigate("/recipes")
          return
        }

        setFormData({
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          servings: recipe.servings,
          image: null,
        })
        setCurrentImage(recipe.image)
      } else {
        navigate("/recipes")
      }
    } catch (error) {
      console.error("Error fetching recipe:", error)
      navigate("/recipes")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "image") {
      setFormData({ ...formData, image: files[0] })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index] = value
    setFormData({ ...formData, ingredients: newIngredients })
  }

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, ""],
    })
  }

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index)
      setFormData({ ...formData, ingredients: newIngredients })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const submitData = new FormData()
    submitData.append("title", formData.title)
    submitData.append("description", formData.description)
    submitData.append("ingredients", JSON.stringify(formData.ingredients.filter((ing) => ing.trim())))
    submitData.append("steps", formData.steps)
    submitData.append("servings", formData.servings)

    if (formData.image) {
      submitData.append("image", formData.image)
    }

    try {
      const response = await fetch(`${baseUrl}/api/recipes/${id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: submitData,
      })

      if (response.ok) {
        navigate(`/recipes/${id}`)
      } else {
        const errorData = await response.json()
        setErrors(errorData)
      }
    } catch (error) {
      console.error("Error updating recipe:", error)
      setErrors({ general: "Failed to update recipe. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const canDelete = user && (user.role === "super_admin" || user.role === "admin")
  const canToggleSignature = user && (user.role === "super_admin" || user.role === "admin" || recipe?.author?.id === user.id);
  const [isSignature, setIsSignature] = useState(false);

  useEffect(() => {
    if (formData && typeof formData.is_signature !== 'undefined') {
      setIsSignature(formData.is_signature);
    }
  }, [formData]);

  const handleToggleSignature = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${id}/signature/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (response.ok) {
        const updated = await response.json();
        setIsSignature(updated.is_signature);
        alert(updated.is_signature ? "Marked as signature!" : "Signature removed.");
      } else {
        alert("Failed to toggle signature status.");
      }
    } catch (error) {
      alert("Error updating signature status.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">✏️</div>
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="glass-card rounded-3xl p-8">
        <h1 className="text-3xl font-playfair font-bold text-gray-800 mb-6 text-center">Edit Your Recipe ✏️</h1>

        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title[0]}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description[0]}</p>}
          </div>

          {/* Servings */}
          <div>
            <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-2">
              Servings
            </label>
            <input
              type="number"
              id="servings"
              name="servings"
              value={formData.servings}
              onChange={handleChange}
              min="1"
              max="20"
              className="w-24 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients *</label>
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                  placeholder={`Ingredient ${index + 1}`}
                />
                {formData.ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-500 hover:text-red-700 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addIngredient} className="text-blush-pink hover:text-blush-pink/80 text-sm">
              + Add Ingredient
            </button>
          </div>

          {/* Steps */}
          <div>
            <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-2">
              Cooking Instructions *
            </label>
            <textarea
              id="steps"
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
            />
          </div>

          {/* Current Image */}
          {currentImage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Photo</label>
              <img
                src={`${baseUrl}${currentImage}`}
                alt="Current recipe"
                className="w-32 h-32 object-cover rounded-xl"
              />
            </div>
          )}

          {/* New Image */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Update Photo
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={saving}
              className="bg-blush-pink text-white px-8 py-3 rounded-full hover:bg-blush-pink/80 transition-colors disabled:opacity-50"
            >
              {saving ? "Updating Recipe..." : "Update Recipe! ✨"}
            </button>
          </div>
        </form>

        {/* Delete Button */}
        {canDelete && (
          <div className="text-center mt-6">
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded-xl mt-6 hover:bg-red-600 transition-colors"
            >
              🗑️ Delete Recipe
            </button>
          </div>
        )}
        {/* Make Signature Button */}
        {canToggleSignature && (
          <div className="text-center mt-4">
            <button
              onClick={handleToggleSignature}
              className={`px-6 py-2 rounded-full transition-colors ${
                isSignature
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isSignature ? "🌟 Remove Signature" : "⭐ Make Signature"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditRecipePage
