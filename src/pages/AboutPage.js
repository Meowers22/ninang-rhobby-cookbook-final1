"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import TeamMemberManager from "../components/TeamMemberManager"
import baseUrl from "../utils/baseUrl"

const AboutPage = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { refreshTrigger } = useWebSocket()
  const [imageKeys, setImageKeys] = useState({})
  const [mounted, setMounted] = useState(false)

  // Prevent flicker by ensuring component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchTeamMembers()
    }
  }, [mounted])

  // Refresh team members when WebSocket updates occur
  useEffect(() => {
    if (mounted) {
      fetchTeamMembers()
    }
  }, [refreshTrigger, mounted])

  const fetchTeamMembers = async () => {
    try {
      setError(null)
      // Always try public endpoint first for consistency
      const response = await fetch(`${baseUrl}/api/team/public/`)

      if (response.ok) {
        const users = await response.json()
        setTeamMembers(users || [])

        // Initialize image keys for cache busting
        const keys = {}
        users.forEach((member) => {
          keys[member.id] = Date.now()
        })
        setImageKeys(keys)
      } else {
        throw new Error("Failed to fetch team members")
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      setError(error.message)
      // Set empty array but don't fail completely
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }

  // Update image key for a specific member to force refresh
  const updateMemberImageKey = (memberId) => {
    setImageKeys((prev) => ({
      ...prev,
      [memberId]: Date.now(),
    }))
  }

  // Don't render anything until mounted to prevent flicker
  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-600">Loading team information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="glass-card rounded-3xl p-8">
          <h1 className="text-4xl md:text-6xl font-playfair font-bold text-gray-800 mb-6">
            About Our Kitchen Family 👨‍👩‍👧‍👦
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're a passionate team of developers who believe that good code is like good food — it brings people
            together, nourishes the soul, and creates lasting memories. Welcome to our digital kitchen, where technology
            meets tradition!
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mb-16">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-6 text-center">Our Mission 🎯</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Preserve Traditions</h3>
              <p className="text-gray-600">
                Keep family recipes alive and share the stories behind every dish, connecting generations through food.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Build Community</h3>
              <p className="text-gray-600">
                Create a warm, welcoming space where food lovers can share, discover, and celebrate culinary creativity
                together.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Spread Joy</h3>
              <p className="text-gray-600">
                Make cooking and sharing recipes as delightful as enjoying the final dish — with love in every click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-4">Meet Our Development Team 👨‍💻</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The talented individuals who cooked up this digital cookbook with passion, dedication, and a lot of coffee
            (and probably some midnight snacks).
          </p>
        </div>

        {/* Team Management for Super Admins only */}
        {user && user.role === "super_admin" ? (
          <TeamMemberManager />
        ) : (
          // Team Members Display - Only for non-super_admins
          error ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Team</h3>
              <p className="text-gray-600">
                We're having trouble loading our team information right now. Please try again later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <div key={member.id} className="glass-card rounded-2xl p-6 text-center heart-pulse">
                    <div className="mb-4">
                      {member.profile_image ? (
                        <img
                          src={`${baseUrl}${member.profile_image}?v=${imageKeys[member.id] || Date.now()}`}
                          alt={member.first_name}
                          className="w-24 h-24 object-cover rounded-full mx-auto"
                          key={imageKeys[member.id]}
                          onError={(e) => {
                            e.target.style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-blush-pink rounded-full flex items-center justify-center mx-auto">
                          <span className="text-3xl text-white">👨‍💻</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-playfair font-bold text-gray-800 mb-2">
                      {member.first_name} {member.last_name}
                    </h3>

                    <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm mb-3">
                      👑 Super Admin
                    </span>

                    {member.bio && <p className="text-gray-600 text-sm mb-4 leading-relaxed">{member.bio}</p>}

                    {member.github_link && (
                      <a
                        href={member.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blush-pink hover:text-blush-pink/80 transition-colors"
                      >
                        <span>🔗</span>
                        <span>Portfolio</span>
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Our Amazing Team</h3>
                  <p className="text-gray-600">
                    Meet the passionate developers behind Ninang Rhobby's Cookbook! Our team is working hard to bring you
                    the best recipe-sharing experience.
                  </p>
                </div>
              )}
            </div>
          )
        )}
      </section>

      {/* Technology Stack */}
      <section className="mb-16">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-6 text-center">
            Our Recipe for Success 🧑‍🍳
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Frontend Ingredients</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="text-blush-pink">⚛️</span>
                  <span>React.js - For dynamic, interactive user interfaces</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blush-pink">🎨</span>
                  <span>TailwindCSS - For beautiful, responsive styling</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blush-pink">🔄</span>
                  <span>WebSockets - For real-time updates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blush-pink">📱</span>
                  <span>Responsive Design - Works on all devices</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Backend Seasonings</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="text-blush-pink">🐍</span>
                  <span>Django - Robust Python web framework</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blush-pink">🔐</span>
                  <span>JWT Authentication - Secure user sessions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blush-pink">📊</span>
                  <span>SQLite/PostgreSQL - Reliable data storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blush-pink">⚡</span>
                  <span>Django Channels - Real-time capabilities</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section>
        <div className="glass-card rounded-3xl p-8 text-center">
          <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-4">Get in Touch! 📧</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Have questions, suggestions, or just want to share your cooking adventures? We'd love to hear from you!
            After all, the best recipes are shared with friends.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:hello@ninangrhobby.com"
              className="bg-blush-pink text-white px-6 py-3 rounded-full hover:bg-blush-pink/80 transition-colors"
            >
              📧 Email Us
            </a>
            <a
              href="https://github.com/ninang-rhobby-cookbook"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 text-white px-6 py-3 rounded-full hover:bg-gray-700 transition-colors"
            >
              🔗 View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
