/**
 * Enhanced Homepage Editor Component
 * Allows Super Admins to edit homepage content including welcome message and Ninang Rhobby's image
 * Features real-time updates and comprehensive error handling
 */
"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import baseUrl from "../utils/baseUrl"

const HomepageEditor = ({ homepageContent, onUpdate }) => {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    welcome_message: homepageContent?.welcome_message || "",
    aunt_rhobby_image: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Only Super Admins can edit homepage content
  if (!user || user.role !== "super_admin") {
    return null
  }

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value, files } = e.target
    setError("") // Clear any previous errors

    if (name === "aunt_rhobby_image") {
      setFormData({ ...formData, aunt_rhobby_image: files[0] })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const submitData = new FormData()
    submitData.append("welcome_message", formData.welcome_message)

    if (formData.aunt_rhobby_image) {
      submitData.append("aunt_rhobby_image", formData.aunt_rhobby_image)
    }

    try {
      const response = await fetch(`${baseUrl}/api/homepage/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: submitData,
      })

      if (response.ok) {
        const updatedContent = await response.json()
        onUpdate(updatedContent)
        setEditing(false)
        setFormData({
          welcome_message: updatedContent.welcome_message,
          aunt_rhobby_image: null,
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update homepage content")
      }
    } catch (error) {
      console.error("Error updating homepage:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Cancel editing and reset form
   */
  const handleCancel = () => {
    setEditing(false)
    setError("")
    setFormData({
      welcome_message: homepageContent?.welcome_message || "",
      aunt_rhobby_image: null,
    })
  }

  if (!editing) {
    return (
      <div className="text-center mb-8">
        <button
          onClick={() => setEditing(true)}
          className="bg-purple-100 text-purple-800 px-6 py-3 rounded-full hover:bg-purple-200 transition-colors"
        >
          ✏️ Edit Homepage Content
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-6 mb-8">
      <h3 className="text-xl font-playfair font-bold text-gray-800 mb-4">👑 Edit Homepage Content</h3>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Welcome Message */}
        <div>
          <label htmlFor="welcome_message" className="block text-sm font-medium text-gray-700 mb-2">
            Welcome Message
          </label>
          <textarea
            id="welcome_message"
            name="welcome_message"
            value={formData.welcome_message}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
            placeholder="Write a warm welcome message for visitors..."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            This message will be displayed prominently on the homepage to welcome visitors.
          </p>
        </div>

        {/* Current Image Display */}
        {homepageContent?.aunt_rhobby_image && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Ninang Rhobby's Photo</label>
            <img
              src={`${baseUrl}${homepageContent.aunt_rhobby_image}`}
              alt="Current Ninang Rhobby"
              className="w-32 h-32 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Image Upload */}
        <div>
          <label htmlFor="aunt_rhobby_image" className="block text-sm font-medium text-gray-700 mb-2">
            Update Ninang Rhobby's Photo
          </label>
          <input
            type="file"
            id="aunt_rhobby_image"
            name="aunt_rhobby_image"
            accept="image/*"
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload a new photo to replace the current one. Leave empty to keep the current photo.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blush-pink text-white py-3 rounded-xl hover:bg-blush-pink/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Save Changes, Anak! 💕"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default HomepageEditor
