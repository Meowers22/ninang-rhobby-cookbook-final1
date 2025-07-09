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
