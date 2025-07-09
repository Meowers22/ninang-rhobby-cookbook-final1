#!/usr/bin/env python3
"""
Fixed Setup Script for Ninang Rhobby's Cookbook
Properly handles Windows paths and dependencies
"""
import os
import sys
import subprocess
import sqlite3
import time
import platform
from pathlib import Path

def run_command(command, cwd=None, capture_output=False, show_output=True):
    """
    Run a command with better output handling
    """
    try:
        if capture_output:
            result = subprocess.run(command, shell=True, cwd=cwd, check=True, 
                                  capture_output=True, text=True)
            if show_output and result.stdout:
                print(result.stdout.strip())
        else:
            result = subprocess.run(command, shell=True, cwd=cwd, check=True)
        
        if show_output:
            print(f"✅ {command}")
        return True
    except subprocess.CalledProcessError as e:
        if show_output:
            print(f"❌ {command}")
            if hasattr(e, 'stderr') and e.stderr:
                print(f"Error: {e.stderr}")
        return False

def check_and_install_nodejs():
    """
    Quick Node.js and npm check
    """
    print("🔍 Checking Node.js and npm...")
    
    # Check Node.js
    try:
        node_version = subprocess.check_output(["node", "--version"], text=True, shell=True)
        print(f"✅ Node.js: {node_version.strip()}")
    except:
        print("❌ Node.js not found")
        return False
    
    # Check npm
    npm_commands = ["npm", "npm.cmd"]
    for npm_cmd in npm_commands:
        try:
            npm_version = subprocess.check_output([npm_cmd, "--version"], text=True, shell=True)
            print(f"✅ npm: {npm_version.strip()}")
            return True
        except:
            continue
    
    print("❌ npm not found")
    return False

def setup_database(backend_dir):
    """
    Enhanced database setup with forced migrations
    """
    print("\n🗄️ Setting up database...")
    
    # Remove old database
    db_file = backend_dir / "db.sqlite3"
    if db_file.exists():
        try:
            db_file.unlink()
            print("✅ Removed old database")
        except Exception as e:
            print(f"⚠️ Could not remove old database: {e}")
    
    # Clean migration files
    print("🧹 Cleaning migration files...")
    migrations_dir = backend_dir / "recipes" / "migrations"
    if migrations_dir.exists():
        for file in migrations_dir.glob("*.py"):
            if file.name != "__init__.py":
                try:
                    file.unlink()
                    print(f"✅ Removed {file.name}")
                except:
                    pass
    
    # Ensure migrations directory exists
    migrations_dir.mkdir(exist_ok=True)
    init_file = migrations_dir / "__init__.py"
    if not init_file.exists():
        init_file.touch()
        print("✅ Created migrations/__init__.py")
    
    # Create migrations for recipes app
    print("🔄 Creating migrations for recipes app...")
    if not run_command("python manage.py makemigrations recipes", cwd=backend_dir, show_output=False):
        print("❌ Failed to create recipes migrations")
        return False
    
    # Run all migrations
    print("🔄 Running database migrations...")
    if not run_command("python manage.py migrate", cwd=backend_dir, show_output=False):
        print("❌ Failed to run migrations")
        return False
    
    # Verify tables
    try:
        conn = sqlite3.connect(str(db_file))
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'recipes_%';")
        recipe_tables = cursor.fetchall()
        conn.close()
        
        if len(recipe_tables) >= 4:  # User, Recipe, Rating, HomepageContent
            print("✅ Database tables created successfully")
            return True
        else:
            print(f"❌ Only {len(recipe_tables)} recipe tables found")
            return False
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False

def main():
    """
    Main setup function with proper path handling
    """
    print("🍳 Preparing Ninang Rhobby's Cookbook...")
    print("=" * 50)
    
    # Get the correct project root directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    backend_dir = project_root / "backend"
    
    print(f"📍 Script directory: {script_dir}")
    print(f"📍 Project root: {project_root}")
    print(f"📍 Backend directory: {backend_dir}")
    
    # Verify directories exist
    if not backend_dir.exists():
        print(f"❌ Backend directory not found: {backend_dir}")
        return False
    
    # Check requirements
    print("\n🔍 Checking system requirements...")
    try:
        python_version = subprocess.check_output([sys.executable, "--version"], text=True)
        print(f"✅ Python: {python_version.strip()}")
    except:
        print("❌ Python not found")
        return False
    
    if not check_and_install_nodejs():
        return False
    
    # Install Python dependencies
    print("\n📦 Installing Python dependencies...")
    requirements_file = backend_dir / "requirements.txt"
    if not requirements_file.exists():
        print(f"❌ Requirements file not found: {requirements_file}")
        return False
    
    if not run_command(f"pip install -r {requirements_file}", cwd=backend_dir, show_output=False):
        print("❌ Failed to install Python dependencies")
        return False
    
    # Install Node.js dependencies
    print("📦 Installing Node.js dependencies...")
    package_json = project_root / "package.json"
    if not package_json.exists():
        print(f"❌ package.json not found: {package_json}")
        return False
    
    npm_commands = ["npm install", "npm.cmd install"]
    npm_success = False
    
    for npm_cmd in npm_commands:
        if run_command(npm_cmd, cwd=project_root, show_output=False):
            npm_success = True
            break
    
    if not npm_success:
        print("❌ Failed to install Node.js dependencies")
        return False
    
    # Install concurrently for server management
    print("📦 Installing concurrently...")
    for npm_cmd in ["npm install concurrently", "npm.cmd install concurrently"]:
        if run_command(npm_cmd, cwd=project_root, show_output=False):
            break
    
    # Setup database
    if not setup_database(backend_dir):
        return False
    
    # Populate data
    print("\n👑 Creating admin accounts and sample data...")
    populate_script = backend_dir / "populate_data.py"
    if not populate_script.exists():
        print(f"❌ Populate script not found: {populate_script}")
        return False
    
    if not run_command(f"python {populate_script}", cwd=backend_dir, show_output=False):
        print("❌ Failed to populate data")
        return False
    
    # Create media directories
    print("📁 Creating media directories...")
    media_dirs = [
        backend_dir / "media",
        backend_dir / "media" / "profiles",
        backend_dir / "media" / "recipes",
        backend_dir / "media" / "homepage"
    ]
    
    for media_dir in media_dirs:
        media_dir.mkdir(exist_ok=True)
    
    print("\n" + "=" * 50)
    print("🎉 Setup complete! Starting servers...")
    print("=" * 50)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
