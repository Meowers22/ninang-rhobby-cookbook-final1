"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import baseUrl from "../utils/baseUrl"

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const { triggerRefresh } = useWebSocket()
  const [editing, setEditing] = useState(false)
  const [imageKey, setImageKey] = useState(Date.now())
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    github_link: user?.github_link || "",
    profile_image: null,
  })
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "profile_image") {
      setFormData({ ...formData, profile_image: files[0] })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const submitData = new FormData()
    Object.keys(formData).forEach((key) => {
      if (key === "profile_image" && formData[key]) {
        submitData.append(key, formData[key])
      } else if (key !== "profile_image") {
        submitData.append(key, formData[key])
      }
    })

    try {
      const response = await fetch(`${baseUrl}/api/auth/profile/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: submitData,
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        setEditing(false)

        // Force image refresh
        setImageKey(Date.now())
        triggerRefresh()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplay = (role) => {
    switch (role) {
      case "super_admin":
        return "👑 Super Admin"
      case "admin":
        return "🧑‍🍳 Admin"
      default:
        return "👶 User"
    }
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="glass-card rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {user.profile_image ? (
              <img
                src={`${baseUrl}${user.profile_image}?v=${imageKey}`}
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full mx-auto"
                key={imageKey}
              />
            ) : (
              <div className="w-32 h-32 bg-blush-pink rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl text-white">👤</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-playfair font-bold text-gray-800 mt-4">
            {user.first_name} {user.last_name}
          </h1>
          <p className="text-gray-600">@{user.username}</p>
          <span className="inline-block bg-blush-pink/20 text-blush-pink px-3 py-1 rounded-full text-sm mt-2">
            {getRoleDisplay(user.role)}
          </span>
        </div>

        {!editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-800">{user.email}</p>
            </div>

            {user.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <p className="text-gray-800">{user.bio}</p>
              </div>
            )}

            {user.github_link && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                <a
                  href={user.github_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blush-pink hover:underline"
                >
                  {user.github_link}
                </a>
              </div>
            )}

            <div className="text-center pt-6">
              <button
                onClick={() => setEditing(true)}
                className="bg-blush-pink text-white px-6 py-2 rounded-full hover:bg-blush-pink/80 transition-colors"
              >
                Edit Profile ✏️
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label htmlFor="github_link" className="block text-sm font-medium text-gray-700 mb-1">
                 Portfolio
              </label>
              <input
                type="url"
                id="github_link"
                name="github_link"
                value={formData.github_link}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div>
              <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Photo
              </label>
              <input
                type="file"
                id="profile_image"
                name="profile_image"
                accept="image/*"
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blush-pink text-white py-2 rounded-xl hover:bg-blush-pink/80 transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
