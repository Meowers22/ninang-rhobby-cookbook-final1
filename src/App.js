import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { WebSocketProvider } from "./contexts/WebSocketContext"
import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import RecipesPage from "./pages/RecipesPage"
import RecipeDetailPage from "./pages/RecipeDetailPage"
import CreateRecipePage from "./pages/CreateRecipePage"
import EditRecipePage from "./pages/EditRecipePage"
import ProfilePage from "./pages/ProfilePage"
import MyRecipesPage from "./pages/MyRecipesPage"
import AdminDashboard from "./pages/AdminDashboard"
import AboutPage from "./pages/AboutPage"

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-milky-white to-lavender">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                <Route path="/recipes/create" element={<CreateRecipePage />} />
                <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my-recipes" element={<MyRecipesPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App
