"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import RecipeCard from "../components/RecipeCard"
import baseUrl from "../utils/baseUrl"

import { Link, useNavigate } from "react-router-dom"

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
  // Recipe search and filter state
  const [filter, setFilter] = useState("all") // all, signature, pending, approved, declined
  const [searchTerm, setSearchTerm] = useState("")
  // Add User Inline Form State (TeamMemberManager style)
  const [addingUser, setAddingUser] = useState(false)
  const [addUserForm, setAddUserForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    bio: "",
    github_link: "",
    profile_image: null,
    role: "user",
  })
  const [addUserError, setAddUserError] = useState("")
  const [addUserLoading, setAddUserLoading] = useState(false)

  const { user } = useAuth()
  const { lastMessage } = useWebSocket()
  const navigate = useNavigate()

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
   * Delete a recipe (Admin/Super Admin only)
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return
    try {
      const response = await fetch(`${baseUrl}/api/recipes/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (response.ok) {
        alert("Recipe deleted successfully.")
        // Optionally refresh the recipe list here
        fetchRecipes()
      } else {
        alert("Failed to delete recipe.")
      }
    } catch (error) {
      alert("An error occurred while deleting the recipe.")
    }
  }

  /**
   * Navigate to edit recipe page
   */
  const handleEdit = (recipeId) => {
    navigate(`/recipes/${recipeId}/edit`)
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
          {/* All Recipes Header, Search, and Filters */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-2">All Recipes 📚</h2>
            </div>
            <div className="flex flex-col md:flex-row items-end gap-4 flex-1 justify-end min-w-[250px] max-w-md">
              <div className="relative w-full">
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
          </div>
          {/* Unified Recipe Grid with Filtering and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.filter((recipe) => {
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
              const matchesSearch = !searchTerm.trim() ||
                recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()));
              return matchesFilter && matchesSearch;
            }).length > 0 ? (
              recipes.filter((recipe) => {
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
                const matchesSearch = !searchTerm.trim() ||
                  recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()));
                return matchesFilter && matchesSearch;
              }).map((recipe) => (
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
              ))
            ) : (
              <div className="col-span-full text-center text-gray-400 italic py-12">No recipes found.</div>
            )}
          </div>
        </div>
      )}

      {/* User Management Tab (Super Admin Only) */}
      {activeTab === "users" && user.role === "super_admin" && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-6">👥 User Management</h2>

          {!addingUser && !editingUserId && (
            <button
              onClick={() => {
                setAddUserForm({
                  first_name: "",
                  last_name: "",
                  username: "",
                  email: "",
                  password: "",
                  bio: "",
                  github_link: "",
                  profile_image: null,
                  role: "user",
                });
                setAddingUser(true);
                setAddUserError("");
              }}
              className="bg-green-100 text-green-800 px-4 py-2 rounded-full hover:bg-green-200 transition-colors"
            >
              ➕ Add New User
            </button>
          )}

          {/* Add User Form */}
          {addingUser && (
            <div className="glass-card rounded-2xl p-6 mb-6">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">Add New User</h4>
              {addUserError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">{addUserError}</div>
              )}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAddUserLoading(true);
                  setAddUserError("");
                  const submitData = new FormData();
                  Object.keys(addUserForm).forEach((key) => {
                    if (key === "profile_image" && addUserForm[key]) {
                      submitData.append(key, addUserForm[key]);
                    } else if (key !== "profile_image" && addUserForm[key] !== null) {
                      submitData.append(key, addUserForm[key]);
                    }
                  });
                  try {
                    const response = await fetch(`${baseUrl}/api/team/create/`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                      },
                      body: submitData,
                    });
                    if (response.ok) {
                      setAddingUser(false);
                      setAddUserForm({
                        first_name: "",
                        last_name: "",
                        username: "",
                        email: "",
                        password: "",
                        bio: "",
                        github_link: "",
                        profile_image: null,
                        role: "user",
                      });
                      setAddUserError("");
                      if (typeof fetchUsers === "function") fetchUsers();
                    } else {
                      const errorData = await response.json();
                      setAddUserError(errorData.error || "Failed to add user");
                    }
                  } catch (error) {
                    setAddUserError("Network error. Please try again.");
                  } finally {
                    setAddUserLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={addUserForm.first_name}
                      onChange={e => setAddUserForm(f => ({ ...f, first_name: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={addUserForm.last_name}
                      onChange={e => setAddUserForm(f => ({ ...f, last_name: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={addUserForm.username}
                      onChange={e => setAddUserForm(f => ({ ...f, username: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={addUserForm.email}
                      onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={addUserForm.password}
                    onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={addUserForm.bio}
                    onChange={e => setAddUserForm(f => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                    placeholder="Example: Cloud chef aspiring to architect delicious solutions, blending AWS skills with a passion for recipes."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Link</label>
                  <input
                    type="url"
                    name="github_link"
                    value={addUserForm.github_link}
                    onChange={e => setAddUserForm(f => ({ ...f, github_link: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                  <input
                    type="file"
                    name="profile_image"
                    accept="image/*"
                    onChange={e => setAddUserForm(f => ({ ...f, profile_image: e.target.files[0] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={addUserForm.role}
                    onChange={e => setAddUserForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blush-pink focus:border-transparent"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={addUserLoading}
                    className="flex-1 bg-blush-pink text-white py-3 rounded-xl hover:bg-blush-pink/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addUserLoading ? "Saving..." : "Add User 🎉"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingUser(false);
                      setAddUserError("");
                    }}
                    disabled={addUserLoading}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

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
