"use client"

import { createContext, useContext, useEffect, useState } from "react"

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [lastMessage, setLastMessage] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0)

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = window.location.hostname;
    const wsPort = 8000;
    const ws = new WebSocket(`${wsProtocol}://${wsHost}:${wsPort}/ws/recipes/`)

    ws.onopen = () => {
      console.log("WebSocket connected")
      setSocket(ws)
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setLastMessage(message)

      // Force refresh for all updates
      setRefreshTrigger((prev) => prev + 1)

      // Special handling for image-related updates
      if (
        message.data &&
        (message.data.action === "photo_update" ||
          message.data.action === "profile_update" ||
          message.data.action === "homepage_update" ||
          message.data.action === "create_team_member" ||
          message.data.action === "update" ||
          message.data.action === "create")
      ) {
        setImageRefreshTrigger((prev) => prev + 1)
        // Additional delay to ensure backend processing is complete
        setTimeout(() => {
          setImageRefreshTrigger((prev) => prev + 1)
        }, 1000)
      }
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected")
      setSocket(null)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return () => {
      ws.close()
    }
  }, [])

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const triggerImageRefresh = () => {
    setImageRefreshTrigger((prev) => prev + 1)
  }

  const value = {
    socket,
    lastMessage,
    refreshTrigger,
    imageRefreshTrigger,
    triggerRefresh,
    triggerImageRefresh,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
