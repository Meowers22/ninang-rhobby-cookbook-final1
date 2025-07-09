"use client"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-blush-pink/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">👩‍🍳</span>
            <span className="text-xl font-playfair font-bold text-gray-800">Ninang Rhobby's Cookbook</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blush-pink transition-colors">
              Home
            </Link>
            <Link to="/recipes" className="text-gray-700 hover:text-blush-pink transition-colors">
              Recipes
            </Link>
            {user && (
              <Link to="/my-recipes" className="text-gray-700 hover:text-blush-pink transition-colors">
                My Recipes
              </Link>
            )}
            <Link to="/about" className="text-gray-700 hover:text-blush-pink transition-colors">
              About Us
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">Welcome, {user.first_name || user.username}!</span>
                <Link to="/profile" className="text-gray-700 hover:text-blush-pink transition-colors">
                  Profile
                </Link>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link to="/admin" className="text-gray-700 hover:text-blush-pink transition-colors">
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-blush-pink text-white px-4 py-2 rounded-full hover:bg-blush-pink/80 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blush-pink transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blush-pink text-white px-4 py-2 rounded-full hover:bg-blush-pink/80 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
