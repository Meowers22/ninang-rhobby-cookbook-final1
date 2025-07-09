"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useWebSocket } from "../contexts/WebSocketContext"
import RecipeCard from "../components/RecipeCard"
import HomepageEditor from "../components/HomepageEditor"
import baseUrl from "../utils/baseUrl"

const HomePage = () => {
  const [homepageData, setHomepageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { lastMessage } = useWebSocket()

  useEffect(() => {
    fetchHomepageData()
  }, [])

  useEffect(() => {
    if (lastMessage) {
      // Refresh homepage data when recipes are updated
      fetchHomepageData()
    }
  }, [lastMessage])

  const fetchHomepageData = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/homepage/`)
      if (response.ok) {
        const data = await response.json()
        setHomepageData(data)
      }
    } catch (error) {
      console.error("Error fetching homepage data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleHomepageUpdate = (updatedContent) => {
    setHomepageData({
      ...homepageData,
      homepage_content: updatedContent,
    })
  }

  // Combine all recipes for search suggestions
  const allRecipes = [
    ...(homepageData?.top_dishes || []),
    ...(homepageData?.signature_dishes || []),
    ...(homepageData?.recent_recipes || []),
    ...(homepageData?.hall_of_fame ? [homepageData.hall_of_fame] : []),
  ];
  // Remove duplicates by id
  const uniqueRecipes = Array.from(new Map(allRecipes.map(r => [r.id, r])).values());
  // Filter for search suggestions
  const searchResults = searchTerm.trim()
    ? uniqueRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">👩‍🍳</div>
          <p className="text-gray-600">Loading delicious recipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Welcome Section */}
      <section className="text-center mb-16">
        <div className="glass-card rounded-3xl p-8 mb-8">
          <h1 className="text-4xl md:text-6xl font-playfair font-bold text-gray-800 mb-6">
            Welcome to Ninang Rhobby's Kitchen! 👩‍🍳
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {homepageData?.homepage_content?.welcome_message}
          </p>
        </div>

        {homepageData?.homepage_content?.aunt_rhobby_image && (
          <div className="mb-8">
            <img
              src={`${baseUrl}${homepageData.homepage_content.aunt_rhobby_image}`}
              alt="Ninang Rhobby"
              className="w-64 h-64 object-cover rounded-full mx-auto shadow-lg"
              onError={e => { e.target.onerror = null; e.target.src = '/placeholder-user.jpg'; }}
            />
          </div>
        )}
      </section>

      {/* Homepage Editor for Super Admins */}
      <HomepageEditor homepageContent={homepageData?.homepage_content} onUpdate={handleHomepageUpdate} />

      {/* Search Bar - above Hall of Fame */}
      <section className="mb-8 relative">
        <div className="flex justify-center relative w-full md:w-1/2 mx-auto">
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
        {searchTerm && searchResults.length > 0 && (
          <ul className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-full md:w-1/2 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 max-h-72 overflow-y-auto">
            {searchResults.map(recipe => (
              <li key={recipe.id}>
                <Link
                  to={`/recipes/${recipe.id}`}
                  className="block px-6 py-3 hover:bg-blush-pink/10 transition-colors cursor-pointer text-gray-800 font-playfair text-lg border-b last:border-b-0 border-gray-100"
                  onClick={() => setSearchTerm("")}
                >
                  {recipe.title}
                  {recipe.is_signature && <span className="ml-2 text-yellow-500">🌟</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {searchTerm && searchResults.length === 0 && (
          <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-full md:w-1/2 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 px-6 py-3 text-gray-400 text-center font-playfair">
            No recipes found.
          </div>
        )}
      </section>

      {/* Hall of Fame */}
      {homepageData?.hall_of_fame && (
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-4">🥇 Hall of Fame</h2>
            <p className="text-gray-600">
              The reigning champion of our kitchen! This recipe has earned the highest rating from our community.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <RecipeCard recipe={homepageData.hall_of_fame} />
          </div>
        </section>
      )}

      {/* Top 3 Dishes */}
      {homepageData?.top_dishes && homepageData.top_dishes.length > 0 && (
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-4">🏆 Top 3 Dishes</h2>
            <p className="text-gray-600">Our most beloved recipes, ranked by your ratings, mga anak!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homepageData.top_dishes.map((recipe, index) => (
              <div key={recipe.id} className="relative">
                <div className="absolute -top-4 -left-4 bg-yellow-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold z-10">
                  {index + 1}
                </div>
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Signature Dishes */}
      {homepageData?.signature_dishes && homepageData.signature_dishes.length > 0 && (
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-4">⭐ Signature Dishes</h2>
            <p className="text-gray-600">Special recipes that hold a special place in our hearts and stomachs!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homepageData.signature_dishes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      {homepageData?.recent_recipes && homepageData.recent_recipes.length > 0 && (
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-4">🕓 Recently Added Recipes</h2>
            <p className="text-gray-600">Fresh from the kitchen! Check out our newest additions, apo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homepageData.recent_recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="text-center">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-4">Ready to Share Your Own Recipe? 💕</h2>
          <p className="text-gray-600 mb-6">
            Join our family and share the recipes that make your heart (and stomach) happy!
          </p>
          <Link
            to="/recipes/create"
            className="bg-blush-pink text-white px-8 py-3 rounded-full text-lg hover:bg-blush-pink/80 transition-colors inline-block"
          >
            Share Your Recipe, Anak! 🍽️
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
