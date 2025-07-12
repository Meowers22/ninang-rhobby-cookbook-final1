"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import baseUrl from "../utils/baseUrl"

const CreateRecipePage = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ingredients: [""],
    steps: "",
    servings: 2,
    image: null,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) {
    navigate("/login")
    return null
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
    setLoading(true)
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
      const response = await fetch(`${baseUrl}/api/recipes/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: submitData,
      })

      if (response.ok) {
        const recipe = await response.json()
        if (location.state && location.state.fromAdmin) {
          // Use query param for robust context passing
          navigate(`/recipes/${recipe.id}?fromAdmin=1`)
        } else {
          navigate(`/recipes/${recipe.id}`)
        }
      } else {
        const errorData = await response.json()
        setErrors(errorData)
      }
    } catch (error) {
      console.error("Error creating recipe:", error)
      setErrors({ general: "Failed to create recipe. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="glass-card rounded-3xl p-8">
        <h1 className="text-3xl font-playfair font-bold text-gray-800 mb-6 text-center">
          Share Your Recipe, Anak! 👩‍🍳
        </h1>

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
              placeholder="What's the name of your delicious dish?"
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
              placeholder="Tell us about your recipe! What makes it special?"
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
                  placeholder={`Ingredient ${index + 1} (e.g., "2 cups rice")`}
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
            {errors.ingredients && <p className="text-red-500 text-sm mt-1">{errors.ingredients[0]}</p>}
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
              placeholder="Step-by-step instructions... Make it easy to follow, anak!"
            />
            {errors.steps && <p className="text-red-500 text-sm mt-1">{errors.steps[0]}</p>}
          </div>

          {/* Image */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Photo
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">A beautiful photo makes your recipe even more appetizing! 📸</p>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-blush-pink text-white px-8 py-3 rounded-full hover:bg-blush-pink/80 transition-colors disabled:opacity-50"
            >
              {loading ? "Sharing Recipe..." : "Share This Recipe! 🍽️"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRecipePage
