/**
 * Enhanced Team Member Manager Component
 * Comprehensive team management for Super Admins
 * Handles adding, editing, and managing team members with full CRUD operations
 */
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import baseUrl from "../utils/baseUrl"

const TeamMemberManager = () => {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    bio: "",
    github_link: "",
    profile_image: null,
    role: "super_admin",
  })

  useEffect(() => {
    if (!user || user.role !== "super_admin") {
      return
    }
    fetchTeamMembers()
  }, [user])

  /**
   * Fetch all team members (Super Admins)
   */
  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/users/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
        const users = await response.json()
        // Filter super admins for team management
        const superAdmins = users.filter((u) => u.role === "super_admin")
        setTeamMembers(superAdmins)
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      setError("Failed to load team members")
    }
  }

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value, files } = e.target
    setError("") // Clear any previous errors

    if (name === "profile_image") {
      setFormData({ ...formData, profile_image: files[0] })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  /**
   * Start editing a team member
   */
  const handleEdit = (member) => {
    setFormData({
      username: member.username,
      email: member.email,
      password: "", // Don't pre-fill password for security
      first_name: member.first_name,
      last_name: member.last_name,
      bio: member.bio || "",
      github_link: member.github_link || "",
      profile_image: null,
      role: member.role,
    })
    setEditing(member.id)
    setError("")
  }

  /**
   * Start adding a new team member
   */
  const handleAdd = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      bio: "",
      github_link: "",
      profile_image: null,
      role: "super_admin",
    })
    setAdding(true)
    setError("")
  }

  /**
   * Handle form submission (add or edit)
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const submitData = new FormData()

    // Add all form fields to FormData, but skip empty password on edit
    Object.keys(formData).forEach((key) => {
      if (editing && key === "password" && !formData.password) {
        return // Skip empty password on update
      }
      if (key === "profile_image" && formData[key]) {
        submitData.append(key, formData[key])
      } else if (key !== "profile_image" && formData[key] !== null) {
        submitData.append(key, formData[key])
      }
    })

    try {
      let response
      if (adding) {
        // Create new team member
        response = await fetch(`${baseUrl}/api/team/create/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: submitData,
        })
      } else {
        // Update existing team member
        response = await fetch(`${baseUrl}/api/users/${editing}/update/`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: submitData,
        })
      }

      if (response.ok) {
        await fetchTeamMembers()
        handleCancel()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to save team member")
      }
    } catch (error) {
      console.error("Error saving team member:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Cancel editing/adding and reset form
   */
  const handleCancel = () => {
    setEditing(null)
    setAdding(false)
    setError("")
    setFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      bio: "",
      github_link: "",
      profile_image: null,
      role: "super_admin",
    })
  }

  /**
   * Delete a team member
   */
  const handleDelete = async (memberId) => {
    if (memberId === user.id) {
      alert("You cannot delete your own account.")
      return
    }

    if (window.confirm("Are you sure you want to remove this team member? This action cannot be undone.")) {
      try {
        const response = await fetch(`${baseUrl}/api/users/${memberId}/delete/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })

        if (response.ok) {
          await fetchTeamMembers()
        } else {
          setError("Failed to delete team member")
        }
      } catch (error) {
        console.error("Error deleting team member:", error)
        setError("Error deleting team member")
      }
    }
  }

  if (!user || user.role !== "super_admin") {
    return null
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-playfair font-bold text-gray-800">👑 Team Management</h3>
        {!adding && !editing && (
          <button
            onClick={handleAdd}
            className="bg-green-100 text-green-800 px-4 py-2 rounded-full hover:bg-green-200 transition-colors"
          >
            ➕ Add New Team Member
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}

      {/* Add/Edit Form */}
      {(adding || editing) && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">
            {adding ? "Add New Team Member" : "Edit Team Member"}
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                />
              </div>
            </div>

            {/* Account Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Field (only for new members) */}
            {adding && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                />
              </div>
            )}

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                placeholder="Tell us about this team member..."
              />
            </div>

            {/* GitHub Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"> GitHub Link</label>
              <input
                type="url"
                name="github_link"
                value={formData.github_link}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                placeholder="https://github.com/username"
              />
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
              <input
                type="file"
                name="profile_image"
                accept="image/*"
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blush-pink text-white py-3 rounded-xl hover:bg-blush-pink/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : adding ? "Add Team Member 🎉" : "Update Member 💕"}
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
      )}

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <div key={member.id} className="glass-card rounded-2xl p-4">
            {/* Member Photo */}
            <div className="text-center mb-4">
              {member.profile_image ? (
                <img
                  src={`${baseUrl}${member.profile_image}`}
                  alt={member.first_name}
                  className="w-20 h-20 object-cover rounded-full mx-auto"
                />
              ) : (
                <div className="w-20 h-20 bg-blush-pink rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-2xl">👨‍💻</span>
                </div>
              )}
            </div>

            {/* Member Info */}
            <h4 className="font-semibold text-gray-800 text-center mb-2">
              {member.first_name} {member.last_name}
            </h4>

            <p className="text-sm text-gray-600 text-center mb-2">@{member.username}</p>

            <p className="text-sm text-gray-600 text-center mb-3 line-clamp-3">{member.bio || "No bio available"}</p>

            {/* GitHub Link */}
            {member.github_link && (
              <div className="text-center mb-3">
                <a
                  href={member.github_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blush-pink hover:underline"
                >
                  🔗 Portfolio
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 justify-center">
              <button
                onClick={() => handleEdit(member)}
                className="bg-lavender text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-lavender/80 transition-colors"
              >
                ✏️ Edit
              </button>

              {member.id !== user.id && (
                <button
                  onClick={() => handleDelete(member.id)}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm hover:bg-red-200 transition-colors"
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {teamMembers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-gray-600">No team members found.</p>
        </div>
      )}
    </div>
  )
}

export default TeamMemberManager
