/**
 * Complete Admin Dashboard Component
 * Comprehensive management interface for Admins and Super Admins
 * Handles recipe approval, user management, and system administration
 */
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import RecipeCard from "../components/RecipeCard"
import baseUrl from "../utils/baseUrl"

const AdminDashboard = () => {
  // ==================== STATE MANAGEMENT ====================
  const [recipes, setRecipes] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("recipes")
  const [editingUserId, setEditingUserId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    bio: "",
    github_link: "",
    role: "user",
  })

  const { user } = useAuth()
  const { lastMessage } = useWebSocket()

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "super_admin")) {
      fetchRecipes()
      if (user.role === "super_admin") {
        fetchUsers()
      }
    }
  }, [user])

  useEffect(() => {
    if (lastMessage) {
      fetchRecipes()
      if (user && user.role === "super_admin") {
        fetchUsers()
      }
    }
  }, [lastMessage, user])

  // ==================== API FUNCTIONS ====================

  /**
   * Fetch all recipes (including pending ones for admins)
   */
  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/recipes/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRecipes(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch all users (Super Admin only)
   */
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/users/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  /**
   * Approve a pending recipe
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
        console.log("Recipe approved successfully")
      } else {
        alert("Failed to approve recipe")
      }
    } catch (error) {
      console.error("Error approving recipe:", error)
      alert("Error approving recipe")
    }
  }

  /**
   * Decline a pending recipe
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
        console.log("Recipe declined successfully")
      } else {
        alert("Failed to decline recipe")
      }
    } catch (error) {
      console.error("Error declining recipe:", error)
      alert("Error declining recipe")
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
        console.log("Signature status toggled successfully")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to toggle signature status")
      }
    } catch (error) {
      console.error("Error toggling signature:", error)
      alert("Error updating signature status")
    }
  }

  /**
   * Navigate to edit recipe page
   */
  const handleEdit = (recipeId) => {
    window.location.href = `/recipes/${recipeId}/edit`
  }

  /**
   * Handle photo update for recipes
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
        console.log("Photo updated successfully")
      } else {
        throw new Error("Failed to update photo")
      }
    } catch (error) {
      console.error("Error updating photo:", error)
      throw error
    }
  }

  /**
   * Update user role (Super Admin only)
   */
  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${baseUrl}/api/users/${userId}/role/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        console.log("User role updated successfully")
      } else {
        alert("Failed to update user role")
      }
    } catch (error) {
      console.error("Error updating user role:", error)
      alert("Error updating user role")
    }
  }

  /**
   * Delete user account (Super Admin only)
   */
  const handleDeleteUser = async (userId) => {
    if (userId === user.id) {
      alert("You cannot delete your own account.")
      return
    }

    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        const response = await fetch(`${baseUrl}/api/users/${userId}/delete/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })

        if (response.ok) {
          console.log("User deleted successfully")
        } else {
          alert("Failed to delete user")
        }
      } catch (error) {
        console.error("Error deleting user:", error)
        alert("Error deleting user")
      }
    }
  }

  /**
   * Start editing a user
   */
  const handleEditUser = (userToEdit) => {
    setEditingUserId(userToEdit.id)
    setEditFormData({
      first_name: userToEdit.first_name || "",
      last_name: userToEdit.last_name || "",
      username: userToEdit.username || "",
      email: userToEdit.email || "",
      bio: userToEdit.bio || "",
      github_link: userToEdit.github_link || "",
      role: userToEdit.role || "user",
    })
  }

  /**
   * Cancel editing a user
   */
  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditFormData({
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      bio: "",
      github_link: "",
      role: "user",
    })
  }

  /**
   * Save user changes
   */
  const handleSaveUser = async (userId) => {
    try {
      const response = await fetch(`${baseUrl}/api/users/${userId}/update/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        setEditingUserId(null)
        console.log("User updated successfully")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Error updating user")
    }
  }

  // ==================== PERMISSION CHECK ====================

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page, anak.</p>
      </div>
    )
  }

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ==================== DATA CALCULATIONS ====================

  const pendingRecipes = recipes.filter((r) => r.status === "pending")
  const approvedRecipes = recipes.filter((r) => r.status === "approved")
  const declinedRecipes = recipes.filter((r) => r.status === "declined")
  const signatureRecipes = recipes.filter((r) => r.is_signature)

  // ==================== RENDER COMPONENT ====================

  return (
    <div className="fade-in">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-playfair font-bold text-gray-800 mb-2">
          {user.role === "super_admin" ? "👑 Super Admin" : "🧑‍🍳 Admin"} Dashboard
        </h1>
        <p className="text-gray-600">
          Manage recipes and {user.role === "super_admin" ? "users" : "content"} for Ninang Rhobby's Cookbook
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold text-gray-800">{pendingRecipes.length}</div>
          <div className="text-sm text-gray-600">Pending Recipes</div>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-gray-800">{approvedRecipes.length}</div>
          <div className="text-sm text-gray-600">Approved Recipes</div>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🌟</div>
          <div className="text-2xl font-bold text-gray-800">{signatureRecipes.length}</div>
          <div className="text-sm text-gray-600">Signature Dishes</div>
        </div>

        {user.role === "super_admin" && (
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-gray-800">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab("recipes")}
          className={`px-6 py-3 rounded-full transition-colors ${
            activeTab === "recipes" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          📚 Recipe Management
        </button>

        {user.role === "super_admin" && (
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 rounded-full transition-colors ${
              activeTab === "users" ? "bg-blush-pink text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            👥 User Management
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "recipes" && (
        <div className="space-y-8">
          {/* Pending Recipes Section */}
          {pendingRecipes.length > 0 && (
            <section>
              <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-4">
                ⏳ Pending Approval ({pendingRecipes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRecipes.map((recipe) => (
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
                  />
                ))}
              </div>
            </section>
          )}

          {/* Approved Recipes Section */}
          <section>
            <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-4">
              ✅ Approved Recipes ({approvedRecipes.length})
            </h2>
            {approvedRecipes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approvedRecipes.slice(0, 6).map((recipe) => (
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
                    />
                  ))}
                </div>
                {approvedRecipes.length > 6 && (
                  <div className="text-center mt-6">
                    <p className="text-gray-600">Showing 6 of {approvedRecipes.length} approved recipes</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No approved recipes yet.</p>
              </div>
            )}
          </section>

          {/* Declined Recipes Section */}
          {declinedRecipes.length > 0 && (
            <section>
              <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-4">
                ❌ Declined Recipes ({declinedRecipes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {declinedRecipes.slice(0, 3).map((recipe) => (
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
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* User Management Tab (Super Admin Only) */}
      {activeTab === "users" && user.role === "super_admin" && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-6">👥 User Management</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {u.profile_image ? (
                          <img
                            src={`${baseUrl}${u.profile_image}`}
                            alt={u.username}
                            className="w-10 h-10 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blush-pink rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">👤</span>
                          </div>
                        )}
                        <div>
                          {editingUserId === u.id ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editFormData.first_name}
                                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                placeholder="First Name"
                                className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                              />
                              <input
                                type="text"
                                value={editFormData.last_name}
                                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                placeholder="Last Name"
                                className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                              />
                              <input
                                type="text"
                                value={editFormData.username}
                                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                placeholder="Username"
                                className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">
                                {u.first_name} {u.last_name}
                              </div>
                              <div className="text-sm text-gray-500">@{u.username}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {editingUserId === u.id ? (
                        <div className="space-y-1">
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            placeholder="Email"
                            className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                          />
                          <input
                            type="url"
                            value={editFormData.github_link}
                            onChange={(e) => setEditFormData({ ...editFormData, github_link: e.target.value })}
                            placeholder="GitHub Link"
                            className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                          />
                          <textarea
                            value={editFormData.bio}
                            onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                            placeholder="Bio"
                            rows={2}
                            className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-600">{u.email}</div>
                          {u.github_link && (
                            <a
                              href={u.github_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blush-pink hover:underline"
                            >
                              Portfolio Profile
                            </a>
                          )}
                          {u.bio && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{u.bio}</div>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingUserId === u.id ? (
                        <select
                          value={editFormData.role}
                          onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            u.role === "super_admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {u.role === "super_admin" ? "👑 Super Admin" : u.role === "admin" ? "🧑‍🍳 Admin" : "👶 User"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingUserId === u.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveUser(u.id)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded"
                          >
                            ✏️ Edit
                          </button>
                          {u.id !== user.id && (
                            <>
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                              </select>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
