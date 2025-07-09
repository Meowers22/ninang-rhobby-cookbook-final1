# 👩‍🍳 Ninang Rhobby's Cookbook - Complete Implementation

A heartwarming family-style recipe-sharing web application that feels like you're at your lola's table — warm, loving, and filled with care.

## 🌟 Features

### 🏠 **Homepage**
- **Welcome Message** - Warm greeting from Ninang Rhobby (editable by Super Admin)
- **Face of Ninang Rhobby** - Profile image section (editable by Super Admin)
- **Bacsilog Hall of Fame** - Dynamic highest-rated recipe display
- **Top 3 Dishes** - Best recipes by average rating
- **Signature Dishes** - Special marked recipes (6 featured)
- **Recently Added** - Newest approved recipes (6 featured)

### 👥 **User Roles & Permissions**

#### 👶 **User**
- ✅ Submit/edit/delete own recipes
- ✅ Rate recipes (1-5 stars, one rating per user)
- ✅ Tag/remove signature status (own recipes only)
- ✅ Upload/edit own profile photo
- ✅ View all approved recipes
- ✅ Auto-scale recipe ingredients by servings

#### 🧑‍🍳 **Admin**
- ✅ All User permissions
- ✅ Approve/decline any recipe
- ✅ Edit any recipe
- ✅ Tag own recipes as signature dishes
- ✅ Update photos for own recipes
- ✅ View pending and declined recipes

#### 👑 **Super Admin**
- ✅ All Admin permissions
- ✅ Complete user management (create, edit, delete, promote/demote)
- ✅ Edit any recipe regardless of owner
- ✅ Tag any recipe as signature dish
- ✅ Update photos for any recipe
- ✅ Edit homepage content (welcome message, Ninang Rhobby's image)
- ✅ Manage team members on About Us page
- ✅ Add new team members

### ⚡ **Real-Time Features**
- **WebSocket Integration** - Live updates for

- **Family-Style Interface**: Warm, loving design with pink, lavender, and peach colors
- **User Roles**: User, Admin, and Super Admin with different permissions
- **Recipe Management**: Create, edit, rate, and share recipes
- **Real-Time Updates**: Live updates via WebSockets
- **Signature Dishes**: Mark special recipes as signature dishes
- **Hall of Fame**: Dynamic ranking of highest-rated recipes
- **Responsive Design**: Works beautifully on all devices
- **LAN Compatible**: Access from any device on your network

## 🧱 Tech Stack

### Frontend
- React.js (JavaScript only, no TypeScript)
- TailwindCSS with custom theme
- React Router DOM
- WebSocket integration

### Backend
- Django + Django REST Framework
- JWT Authentication
- Django Channels for WebSockets
- SQLite (development) / PostgreSQL (production)
- Custom User model with profile images

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd ninang-rhobby-cookbook
   \`\`\`

2. **Start the application**
   \`\`\`bash
   npm start
   \`\`\`

That's it! The setup script will:
- Install all Python and Node.js dependencies
- Set up the database and run migrations
- Create super admin accounts
- Populate sample data (including Ninang Rhobby's Ultimate Bacsilog!)
- Start both backend (port 8000) and frontend (port 3000) servers

### Access the Application

- **Frontend**: http://localhost:3000 (or http://YOUR_COMPUTER_IP:3000 for LAN)
- **Backend API**: http://localhost:8000 (or http://YOUR_COMPUTER_IP:8000 for LAN)
- **Admin Panel**: http://localhost:8000/admin (or http://YOUR_COMPUTER_IP:8000/admin for LAN)

### Default Super Admin Accounts

The application comes pre-seeded with 5 super admin accounts:

| Username | Password | Name |
|----------|----------|------|
| rhobby | password123 | Rhobby Jay Calixtro |
| rixzel | password123 | Rixzel Jhay Avendano |
| joshua | password123 | Joshua Robert Bejo |
| john | password123 | John Michael Ocampo |
| guian | password123 | Guian Karlo Pimentel |

## 🔧 Development

### Project Structure
\`\`\`
ninang-rhobby-cookbook/
├── backend/                 # Django backend
│   ├── cookbook/           # Main Django project
│   ├── recipes/            # Recipes app
│   ├── requirements.txt    # Python dependencies
│   └── populate_data.py    # Database seeding script
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   └── index.js           # App entry point
├── scripts/               # Setup and utility scripts
└── package.json          # Node.js dependencies
\`\`\`

### API Endpoints

#### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update profile

#### Recipes
- `GET /api/recipes/` - List recipes
- `POST /api/recipes/` - Create recipe
- `GET /api/recipes/{id}/` - Get recipe details
- `PUT /api/recipes/{id}/` - Update recipe
- `DELETE /api/recipes/{id}/` - Delete recipe
- `POST /api/recipes/{id}/rate/` - Rate recipe
- `POST /api/recipes/{id}/approve/` - Approve recipe
- `POST /api/recipes/{id}/decline/` - Decline recipe
- `POST /api/recipes/{id}/signature/` - Toggle signature status

#### Homepage
- `GET /api/homepage/` - Get homepage data
- `PUT /api/homepage/update/` - Update homepage content

#### User Management (Super Admin only)
- `GET /api/users/` - List all users
- `PUT /api/users/{id}/role/` - Update user role

### WebSocket Events
- Recipe creation, updates, deletions
- Rating changes
- Approval/decline status changes
- Signature dish toggles

## 🌐 Network Access

The application is configured to accept connections from any IP address on your local network:

- Backend binds to `0.0.0.0:8000`
- Frontend binds to `0.0.0.0:3000`
- CORS is configured to allow all origins in development

Access from other devices using your computer's IP address:
- `http://YOUR_IP_ADDRESS:3000` (frontend)
- `http://YOUR_IP_ADDRESS:8000` (backend)

## 🎨 Design Philosophy

The application embodies the warmth and love of Filipino family cooking:

- **Colors**: Blush pink, lavender, soft peach, and milky white
- **Typography**: Playfair Display for headings, Inter for body text
- **Animations**: Gentle heart-pulse effects and fade-ins
- **Language**: Warm, familial tone with Filipino terms of endearment
- **Layout**: Rounded corners, glassmorphism effects, and spacious design

## 🤝 Contributing

This project was lovingly crafted by our development team. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is created for educational and family use. Please respect the love and effort put into every line of code! 💕

## 🙏 Acknowledgments

Special thanks to:
- All the titas and lolas who inspired this project
- The Filipino developer community
- Everyone who believes that good food brings people together

---

**Kain na, mga anak! Enjoy cooking and sharing! 🍽️❤️**
