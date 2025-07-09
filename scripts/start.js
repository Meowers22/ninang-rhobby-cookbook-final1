#!/usr/bin/env node
/**
 * Windows-Compatible Single Entry Point for Ninang Rhobby's Cookbook
 * Handles locked database files and smart setup detection
 */

const { spawn, execSync } = require("child_process")
const path = require("path")
const fs = require("fs")

console.log("🍳 Welcome to Ninang Rhobby's Cookbook!")
console.log("=" * 60)

/**
 * Check if Python is available and get the correct command
 */
function checkPython() {
  const pythonCommands = ["python", "python3", "py"]

  for (const cmd of pythonCommands) {
    try {
      execSync(`${cmd} --version`, { stdio: "pipe" })
      return cmd
    } catch (error) {
      continue
    }
  }

  console.error("❌ Python not found. Please install Python 3.8+ from https://python.org")
  process.exit(1)
}

/**
 * Find the correct npm command for Windows
 */
function findNpmCommand() {
  const npmCommands = ["npm", "npm.cmd"]

  for (const cmd of npmCommands) {
    try {
      execSync(`${cmd} --version`, { stdio: "pipe" })
      return cmd
    } catch (error) {
      continue
    }
  }

  console.error("❌ npm not found. Please reinstall Node.js from https://nodejs.org")
  process.exit(1)
}

/**
 * Open browser automatically
 */
function openBrowser(url) {
  const start = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open"

  setTimeout(() => {
    try {
      execSync(`${start} ${url}`, { stdio: "ignore" })
      console.log(`🌐 Opened browser: ${url}`)
    } catch (error) {
      console.log(`💡 Please open your browser manually: ${url}`)
    }
  }, 3000)
}

/**
 * Check if database is properly set up
 */
function isDatabaseReady(backendDir) {
  const dbFile = path.join(backendDir, "db.sqlite3")
  const migrationsDir = path.join(backendDir, "recipes", "migrations")

  // Check if database file exists
  if (!fs.existsSync(dbFile)) {
    return false
  }

  // Check if migrations directory exists with files
  if (!fs.existsSync(migrationsDir)) {
    return false
  }

  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".py") && f !== "__init__.py")
  if (migrationFiles.length === 0) {
    return false
  }

  return true
}

/**
 * Smart setup that only runs when needed
 */
async function runSmartSetup() {
  const pythonCmd = checkPython()
  const npmCmd = findNpmCommand()
  const projectRoot = path.resolve(__dirname, "..")
  const backendDir = path.join(projectRoot, "backend")

  console.log("🔧 Checking setup status...\n")
  console.log(`📍 Project root: ${projectRoot}`)
  console.log(`📍 Backend directory: ${backendDir}`)

  // Check if directories exist
  if (!fs.existsSync(backendDir)) {
    console.error(`❌ Backend directory not found: ${backendDir}`)
    return false
  }

  try {
    // Step 1: Always ensure Node.js dependencies are installed
    console.log("📦 Checking Node.js dependencies...")
    const nodeModulesExists = fs.existsSync(path.join(projectRoot, "node_modules"))
    if (!nodeModulesExists) {
      console.log("Installing Node.js dependencies...")
      execSync(`${npmCmd} install`, {
        cwd: projectRoot,
        stdio: "inherit",
      })
      console.log("✅ Node.js dependencies installed")
    } else {
      console.log("✅ Node.js dependencies already installed")
    }

    // Step 2: Install concurrently if needed
    try {
      require.resolve("concurrently")
      console.log("✅ Concurrently already available")
    } catch {
      console.log("📦 Installing concurrently...")
      execSync(`${npmCmd} install concurrently`, {
        cwd: projectRoot,
        stdio: "pipe",
      })
      console.log("✅ Concurrently installed")
    }

    // Step 3: Check if database setup is needed
    const dbReady = isDatabaseReady(backendDir)

    if (dbReady) {
      console.log("✅ Database appears to be ready")
      console.log("🚀 Skipping database setup - starting servers directly!")
      return true
    }

    console.log("🗄️ Database setup needed...")

    // Step 4: Install Python dependencies if needed
    console.log("📦 Checking Python dependencies...")
    try {
      execSync(`${pythonCmd} -c "import django; import rest_framework"`, { stdio: "pipe" })
      console.log("✅ Python dependencies already installed")
    } catch {
      console.log("Installing Python dependencies...")
      execSync(`${pythonCmd} -m pip install -r requirements.txt`, {
        cwd: backendDir,
        stdio: "inherit",
      })
      console.log("✅ Python dependencies installed")
    }

    // Always ensure Python dependencies are installed (fix for fresh clones)
    try {
      execSync(`${pythonCmd} -m pip install -r requirements.txt`, {
        cwd: backendDir,
        stdio: "inherit",
      })
      console.log("✅ Python dependencies installed (forced)")
    } catch (error) {
      console.error("❌ Failed to install Python dependencies:", error.message)
      return false
    }

    // Step 5: Setup database (only if not ready)
    console.log("🗄️ Setting up database...")

    // Try to remove old database (skip if locked)
    const dbFile = path.join(backendDir, "db.sqlite3")
    if (fs.existsSync(dbFile)) {
      try {
        fs.unlinkSync(dbFile)
        console.log("✅ Removed old database")
      } catch (error) {
        if (error.code === "EBUSY" || error.code === "EPERM") {
          console.log("⚠️ Database file is locked (server running?) - continuing anyway...")
        } else {
          throw error
        }
      }
    }

    // Clean migration files (skip if locked)
    const migrationsDir = path.join(backendDir, "recipes", "migrations")
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
      for (const file of files) {
        if (file.endsWith(".py") && file !== "__init__.py") {
          try {
            fs.unlinkSync(path.join(migrationsDir, file))
          } catch (error) {
            if (error.code === "EBUSY" || error.code === "EPERM") {
              console.log(`⚠️ Migration file ${file} is locked - skipping...`)
            } else {
              throw error
            }
          }
        }
      }
    } else {
      fs.mkdirSync(migrationsDir, { recursive: true })
    }

    // Ensure __init__.py exists
    const initFile = path.join(migrationsDir, "__init__.py")
    if (!fs.existsSync(initFile)) {
      fs.writeFileSync(initFile, "")
    }

    // Create migrations
    console.log("🔄 Creating database migrations...")
    try {
      execSync(`${pythonCmd} manage.py makemigrations recipes`, {
        cwd: backendDir,
        stdio: "inherit",
      })
    } catch (error) {
      console.log("⚠️ Migration creation failed - database might already be set up")
    }

    // Run migrations
    console.log("🔄 Running database migrations...")
    try {
      execSync(`${pythonCmd} manage.py migrate`, {
        cwd: backendDir,
        stdio: "inherit",
      })
    } catch (error) {
      console.log("⚠️ Migration failed - database might already be set up")
    }

    // Step 6: Populate data (only if database is empty)
    console.log("👑 Checking for admin accounts...")
    try {
      const result = execSync(
        `${pythonCmd} -c "import django; django.setup(); from recipes.models import User; print(User.objects.filter(role='super_admin').count())"`,
        {
          cwd: backendDir,
          stdio: "pipe",
          encoding: "utf8",
        },
      )

      const adminCount = Number.parseInt(result.trim())
      if (adminCount > 0) {
        console.log(`✅ Found ${adminCount} super admin accounts - skipping data population`)
      } else {
        console.log("Creating admin accounts and sample data...")
        execSync(`${pythonCmd} populate_data.py`, {
          cwd: backendDir,
          stdio: "inherit",
        })
      }
    } catch (error) {
      console.log("Creating admin accounts and sample data...")
      try {
        execSync(`${pythonCmd} populate_data.py`, {
          cwd: backendDir,
          stdio: "inherit",
        })
      } catch (populateError) {
        console.log("⚠️ Data population failed - might already be populated")
      }
    }

    // Step 7: Create media directories
    console.log("📁 Creating media directories...")
    const mediaDirs = [
      path.join(backendDir, "media"),
      path.join(backendDir, "media", "profiles"),
      path.join(backendDir, "media", "recipes"),
      path.join(backendDir, "media", "homepage"),
    ]

    for (const dir of mediaDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }

    console.log("\n✅ Setup completed successfully!")
    return true
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message)
    console.log("\n💡 The database might already be set up. Trying to start servers anyway...")
    return true // Continue even if setup fails
  }
}

/**
 * Start both servers with beautiful logging and auto-open browser
 */
async function startServers() {
  console.log("\n🚀 Starting both servers with live logs...\n")

  const projectRoot = path.resolve(__dirname, "..")

  try {
    // Import concurrently
    const concurrently = require("concurrently")

    // Get LAN IP address
    const os = require('os');
    function getLocalExternalIp() {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
      return 'localhost';
    }
    const lanIp = getLocalExternalIp();

    // Open browser to LAN IP if not localhost
    openBrowser(`http://${lanIp}:3000`)

    const { result } = concurrently(
      [
        {
          command: "python manage.py runserver 0.0.0.0:8000",
          name: "🐍 BACKEND",
          cwd: path.join(projectRoot, "backend"),
          prefixColor: "blue",
          // Always show backend output and errors
          raw: true,
        },
        {
          command: "react-scripts start",
          name: "⚛️  FRONTEND",
          cwd: projectRoot,
          prefixColor: "green",
          env: {
            ...process.env,
            BROWSER: "none",
            HOST: "0.0.0.0",
            PORT: "3000",
          },
        },
      ],
      {
        prefix: "name",
        killOthers: ["failure", "success"],
        restartTries: 3,
        timestampFormat: "HH:mm:ss",
        // Always show output
        raw: true,
      },
    )

    // Display beautiful startup information
    console.log("\n" + "🌟".repeat(30))
    console.log("🎉 Ninang Rhobby's Cookbook is now LIVE!")
    console.log("🌟".repeat(30))
    console.log(`🌐 Frontend:  http://localhost:3000`)
    console.log(`⚙️  Backend:   http://localhost:8000`)
    console.log(`👑 Admin:     http://localhost:8000/admin`)
    console.log(`🏠 LAN:       http://${lanIp}:3000`)
    console.log("\n👑 SUPER ADMIN ACCOUNTS:")
    console.log("   Username: rhobby  | Password: password123")
    console.log("   Username: rixzel  | Password: password123")
    console.log("   Username: joshua  | Password: password123")
    console.log("   Username: john    | Password: password123")
    console.log("   Username: guian   | Password: password123")
    console.log("\n📊 LIVE LOGS (Both Servers):")
    console.log("   🐍 Blue  = Django Backend (API calls, database)")
    console.log("   ⚛️  Green = React Frontend (UI, user interactions)")
    console.log("\n💡 Press Ctrl+C to stop both servers")
    console.log("🌟".repeat(30) + "\n")

    await result
  } catch (error) {
    console.error("\n❌ Failed to start servers:", error)
    console.log("\n💡 If servers fail to start, try:")
    console.log("   1. Check if ports 3000 and 8000 are available")
    console.log("   2. Run as Administrator")
    console.log("   3. Restart your terminal")
    process.exit(1)
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Step 1: Run smart setup (skips if already done)
    const setupSuccess = await runSmartSetup()
    if (!setupSuccess) {
      throw new Error("Setup failed")
    }

    // Step 2: Start both servers with live logs
    await startServers()
  } catch (error) {
    console.error("\n❌ Startup failed:", error.message)
    console.log("\n🔧 Troubleshooting:")
    console.log("   1. Make sure Python and Node.js are installed")
    console.log("   2. Try running as Administrator")
    console.log("   3. Check if ports 3000 and 8000 are available")
    console.log("   4. Restart your terminal and try again")

    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down servers...")
  console.log("🍽️ Salamat, mga anak! Come back soon for more delicious recipes! 👋")
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("\n\n🛑 Servers terminated.")
  process.exit(0)
})

// Start the application
main()
