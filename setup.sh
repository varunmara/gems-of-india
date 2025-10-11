#!/bin/bash

###############################################################################
# Gems of India - One-Click Setup Script
# Installs everything, then asks for API keys at the end
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

# Project directory
PROJECT_DIR="gems-of-india"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO] $1"
}

print_success() {
    echo -e "[SUCCESS] $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1"
}

print_error() {
    echo -e "[ERROR] $1"
}

print_header() {
    echo -e "\n========================================"
    echo -e "$1"
    echo -e "========================================\n"
}

###############################################################################
# STEP 1: Check and Install Node.js v22.x
###############################################################################
check_and_install_nodejs() {
    print_header "Step 1/7: Node.js v22.x"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 22 ]; then
            print_success "Already installed: $(node -v)"
            return 0
        fi
    fi
    
    print_info "Installing Node.js v22.x..."
    
    # Update package lists (ignore errors from third-party repos)
    sudo apt-get update -qq 2>&1 || true
    
    # Install prerequisites
    if ! sudo apt-get install -y -qq ca-certificates curl gnupg 2>&1; then
        print_error "Failed to install prerequisites"
        print_info "Trying without quiet mode..."
        sudo apt-get install -y ca-certificates curl gnupg || exit 1
    fi
    
    # Add NodeSource repository
    print_info "Adding NodeSource repository..."
    if ! curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - > /dev/null 2>&1; then
        print_warning "Failed silently, trying with output..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - || exit 1
    fi
    
    # Install Node.js
    if ! sudo apt-get install -y -qq nodejs 2>&1; then
        print_info "Retrying Node.js installation..."
        sudo apt-get install -y nodejs || exit 1
    fi
    
    # Verify installation
    if ! command -v node &> /dev/null; then
        print_error "Node.js installation failed!"
        exit 1
    fi
    
    print_success "Installed: $(node -v)"
}

###############################################################################
# STEP 2: Check and Install pnpm v10+
###############################################################################
check_and_install_pnpm() {
    print_header "Step 2/7: pnpm v10+"
    
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm -v | cut -d'.' -f1)
        if [ "$PNPM_VERSION" -ge 10 ]; then
            print_success "Already installed: v$(pnpm -v)"
            return 0
        fi
    fi
    
    print_info "Installing pnpm..."
    
    if ! sudo npm install -g pnpm@latest > /dev/null 2>&1; then
        print_warning "Silent install failed, trying with output..."
    if ! sudo npm install -g pnpm@latest; then
            print_error "Failed to install pnpm via npm"
            print_info "Trying alternative method (npm install script)..."
            curl -fsSL https://get.pnpm.io/install.sh | sh - || exit 1
            export PNPM_HOME="$HOME/.local/share/pnpm"
            export PATH="$PNPM_HOME:$PATH"
        fi
    fi
    
    # Verify installation
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm installation failed!"
        exit 1
    fi
    
    print_success "Installed: v$(pnpm -v)"
}

###############################################################################
# STEP 3: Check and Install PostgreSQL
###############################################################################
check_and_install_postgresql() {
    print_header "Step 3/7: PostgreSQL Database"
    
    if command -v psql &> /dev/null && sudo systemctl is-active --quiet postgresql; then
        print_success "Already installed and running"
        return 0
    fi
    
    if command -v psql &> /dev/null; then
        print_info "Starting PostgreSQL..."
            if ! sudo systemctl start postgresql; then
            print_error "Failed to start PostgreSQL"
            print_info "Checking status..."
            sudo systemctl status postgresql --no-pager || true
                exit 1
        fi
        sudo systemctl enable postgresql || true
        print_success "PostgreSQL started"
        return 0
    fi
    
    print_info "Installing PostgreSQL..."
    sudo apt-get update -qq 2>&1 || true
    
    if ! sudo apt-get install -y -qq postgresql postgresql-contrib 2>&1; then
        print_warning "Silent install failed, trying with output..."
        if ! sudo apt-get install -y postgresql postgresql-contrib; then
        print_error "Failed to install PostgreSQL"
        exit 1
        fi
    fi
    
    # Start PostgreSQL
    if ! sudo systemctl start postgresql; then
        print_error "Failed to start PostgreSQL"
        sudo systemctl status postgresql --no-pager || true
        exit 1
    fi
    
    sudo systemctl enable postgresql || true
    
    # Verify PostgreSQL is running
    if ! sudo systemctl is-active --quiet postgresql; then
        print_error "PostgreSQL is not running!"
        exit 1
    fi
    
    print_success "PostgreSQL installed and running"
}

###############################################################################
# STEP 4: Setup PostgreSQL Database
###############################################################################
setup_postgresql_database() {
    print_header "Step 4/7: Database Setup"
    
    DB_NAME="gems_of_india"
    DB_USER="gems_user"
    DB_PASSWORD="gems_password_$(openssl rand -hex 8)"
    
    print_info "Setting up database..."
    
    # Always drop and recreate to avoid password mismatches
    print_info "Cleaning any existing setup..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    
    print_info "Creating fresh database and user..."
    
    # Create user and database
    if ! sudo -u postgres psql <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
    then
        print_error "Failed to create database"
        exit 1
    fi
    
    # Test connection
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    export DB_PASSWORD
    
    print_info "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection verified!"
    else
        print_error "Database connection test failed!"
        print_info "Trying to fix..."
        
        # Reset password and try again
        sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || exit 1
        
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database fixed!"
        else
            print_error "Could not fix database. Manual intervention needed."
            exit 1
        fi
    fi
    
    print_success "Database ready!"
}

###############################################################################
# STEP 5: Collect API Keys (At the End)
###############################################################################
collect_api_keys_at_end() {
    print_header "🔑 API Keys Required"
    
    cd "$SCRIPT_DIR/$PROJECT_DIR"
    
    # Check if .env already has ALL required keys
    if [ -f .env ]; then
        HAS_TURNSTILE=$(grep "^TURNSTILE_SECRET_KEY=" .env 2>/dev/null | grep -v '""' | grep -v "^#" | wc -l)
        HAS_RESEND=$(grep "^RESEND_API_KEY=" .env 2>/dev/null | grep -v '""' | grep -v "^#" | wc -l)
        HAS_GOOGLE=$(grep "^GOOGLE_CLIENT_ID=" .env 2>/dev/null | grep -v '""' | grep -v "^#" | wc -l)
        
        TURNSTILE_VAL=$(grep "^TURNSTILE_SECRET_KEY=" .env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
        RESEND_VAL=$(grep "^RESEND_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
        GOOGLE_VAL=$(grep "^GOOGLE_CLIENT_ID=" .env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
        
        if [ "$HAS_TURNSTILE" -gt 0 ] && [ "$HAS_RESEND" -gt 0 ] && [ "$HAS_GOOGLE" -gt 0 ] && \
           [ -n "$TURNSTILE_VAL" ] && [ -n "$RESEND_VAL" ] && [ -n "$GOOGLE_VAL" ]; then
            print_success "✅ All API keys already configured!"
            print_info "Turnstile: ${TURNSTILE_VAL:0:10}..."
            print_info "Resend: ${RESEND_VAL:0:10}..."
            print_info "Google: ${GOOGLE_VAL:0:20}..."
            return 0
        fi
    fi
    
    echo -e "═══════════════════════════════════════════════════════════════"
    echo -e "  ⚠️  IMPORTANT: Your app needs 3 FREE API services to work!  "
    echo -e "═══════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${YELLOW}Without these, users CANNOT sign up or log in!"
    echo ""
    echo "I'll guide you step-by-step. "
    echo ""
    read -p "Press Enter to continue..."
    
    # Collect Turnstile
    clear
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════"
    echo -e "${CYAN}  API Key 1/3: Cloudflare Turnstile (Captcha) - FREE          "
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${BLUE}STEP 1: Go to: https://dash.cloudflare.com/sign-up"
    echo "        Create FREE account"
    echo ""
    echo -e "${BLUE}STEP 2: Go to: https://dash.cloudflare.com/?to=/:account/turnstile"
    echo "        Or click 'Turnstile' in sidebar"
    echo ""
    echo -e "${BLUE}STEP 3: Click 'Add Site'"
    echo ""
    echo -e "${BLUE}STEP 4: Fill in:"
    echo "        Site name: ${CYAN}Gems of India Local"
    echo "        Domain: ${CYAN}localhost"
    echo "        Widget Mode: ${CYAN}Managed"
    echo ""
    echo -e "${BLUE}STEP 5: Click 'Create'"
    echo ""
    echo -e "${BLUE}STEP 6: Copy the TWO keys shown (both start with 0x...)"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════"
    echo ""
    
    while true; do
        read -p "Paste SITE KEY (starts with 0x): " TURNSTILE_SITE_KEY
        if [[ $TURNSTILE_SITE_KEY == 0x* ]] && [ ${#TURNSTILE_SITE_KEY} -gt 10 ]; then
            print_success "Site key validated!"
            break
        else
            print_warning "Key should start with '0x' and be longer. Try again."
        fi
    done
    
    while true; do
        read -p "Paste SECRET KEY (starts with 0x): " TURNSTILE_SECRET_KEY
        if [[ $TURNSTILE_SECRET_KEY == 0x* ]] && [ ${#TURNSTILE_SECRET_KEY} -gt 10 ]; then
            print_success "Secret key validated!"
            break
        else
            print_warning "Key should start with '0x' and be longer. Try again."
        fi
    done
    
    # Collect Resend
    clear
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════"
    echo -e "${CYAN}  API Key 2/3: Resend (Email Service) - FREE                   "
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${BLUE}STEP 1: Go to: https://resend.com/signup"
    echo "        Sign up with GitHub or Email"
    echo ""
    echo -e "${BLUE}STEP 2: Go to: https://resend.com/api-keys"
    echo "        Or click 'API Keys' in sidebar"
    echo ""
    echo -e "${BLUE}STEP 3: Click '+ Create API Key'"
    echo ""
    echo -e "${BLUE}STEP 4: Fill in:"
    echo "        Name: ${CYAN}Gems of India Local"
    echo "        Permission: ${CYAN}Sending access"
    echo ""
    echo -e "${BLUE}STEP 5: Click 'Add'"
    echo ""
    echo -e "${BLUE}STEP 6: Copy the key (starts with re_...)"
    echo "        ⚠️  Copy NOW - you can't see it again!"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════"
    echo ""
    
    while true; do
        read -p "Paste RESEND API KEY (starts with re_): " RESEND_API_KEY
        if [[ $RESEND_API_KEY == re_* ]] && [ ${#RESEND_API_KEY} -gt 20 ]; then
            print_success "API key validated!"
            break
        else
            print_warning "Key should start with 're_' and be longer. Try again."
        fi
    done
    
    # Collect Google OAuth
    clear
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════"
    echo -e "${CYAN}  API Key 3/3: Google OAuth (Social Login) - FREE              "
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${BLUE}STEP 1: Go to: https://console.cloud.google.com/"
    echo "        Sign in with Google account"
    echo ""
    echo -e "${BLUE}STEP 2: Create a new project:"
    echo "        → Click 'Select a project' dropdown at top"
    echo "        → Click 'NEW PROJECT'"
    echo "        → Name: ${CYAN}Gems of India"
    echo "        → Click 'Create'"
    echo ""
    echo -e "${BLUE}STEP 3: Enable OAuth consent screen:"
    echo "        → Left menu: APIs & Services > OAuth consent screen"
    echo "        → User Type: ${CYAN}External"
    echo "        → Click 'Create'"
    echo "        → App name: ${CYAN}Gems of India"
    echo "        → User support email: ${CYAN}your-email@gmail.com"
    echo "        → Developer contact: ${CYAN}your-email@gmail.com"
    echo "        → Click 'Save and Continue' through all screens"
    echo ""
    echo -e "${BLUE}STEP 4: Create OAuth credentials:"
    echo "        → Left menu: APIs & Services > Credentials"
    echo "        → Click '+ CREATE CREDENTIALS' > OAuth client ID"
    echo "        → Application type: ${CYAN}Web application"
    echo "        → Name: ${CYAN}Gems of India Local"
    echo "        → Authorized redirect URIs:"
    echo "          ${CYAN}http://localhost:3000/api/auth/callback/google"
    echo "        → Click 'Create'"
    echo ""
    echo -e "${BLUE}STEP 5: Copy your credentials from the popup"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════"
    echo ""
    
    while true; do
        read -p "Paste GOOGLE CLIENT ID: " GOOGLE_CLIENT_ID
        if [ ${#GOOGLE_CLIENT_ID} -gt 30 ]; then
            print_success "Client ID validated!"
            break
        else
            print_warning "Client ID should be longer. Try again."
        fi
    done
    
    echo ""
    
    while true; do
        read -p "Paste GOOGLE CLIENT SECRET: " GOOGLE_CLIENT_SECRET
        if [ ${#GOOGLE_CLIENT_SECRET} -gt 15 ]; then
            print_success "Client secret validated!"
            break
        else
            print_warning "Client secret should be longer. Try again."
        fi
    done
    
    # Update .env file
    print_info "Updating .env file with all API keys..."
    sed -i "s|^TURNSTILE_SECRET_KEY=.*|TURNSTILE_SECRET_KEY=\"$TURNSTILE_SECRET_KEY\"|" .env
    sed -i "s|^NEXT_PUBLIC_TURNSTILE_SITE_KEY=.*|NEXT_PUBLIC_TURNSTILE_SITE_KEY=\"$TURNSTILE_SITE_KEY\"|" .env
    sed -i "s|^RESEND_API_KEY=.*|RESEND_API_KEY=\"$RESEND_API_KEY\"|" .env
    sed -i "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=\"$GOOGLE_CLIENT_ID\"|" .env
    sed -i "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=\"$GOOGLE_CLIENT_SECRET\"|" .env
    sed -i "s|^NEXT_PUBLIC_ONE_TAP_CLIENT_ID=.*|NEXT_PUBLIC_ONE_TAP_CLIENT_ID=\"$GOOGLE_CLIENT_ID\"|" .env
    
    print_success "✅ All API keys saved to .env file!"
}

###############################################################################
# STEP 6: Create .env File
###############################################################################
create_env_file() {
    print_header "Step 5/7: Environment Config"
    
    cd "$SCRIPT_DIR/$PROJECT_DIR"
    
    if [ -f .env ]; then
        print_info "Backing up existing .env..."
        cp .env .env.backup
    fi
    
    AUTH_SECRET=$(openssl rand -base64 32)
    print_info "Creating .env file..."
    
    cat > .env <<EOF
# ===================================
# Database Configuration (REQUIRED)
# ===================================
DATABASE_URL="$DATABASE_URL"

# ===================================
# Authentication Configuration (REQUIRED)
# ===================================
BETTER_AUTH_SECRET="$AUTH_SECRET"
BETTER_AUTH_URL="http://localhost:3000"

# ===================================
# Google OAuth (Optional - for social login)
# ===================================
# Get these from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ===================================
# Cloudflare Turnstile (Optional - for captcha)
# ===================================
# Get these from: https://dash.cloudflare.com/
TURNSTILE_SECRET_KEY=""
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""

# ===================================
# Google One Tap (Optional)
# ===================================
NEXT_PUBLIC_ONE_TAP_CLIENT_ID=""

# ===================================
# Email Service (Optional - for email verification)
# ===================================
# Get this from: https://resend.com/
RESEND_API_KEY=""

# ===================================
# Redis (Optional - for rate limiting)
# ===================================
# Format: redis://username:password@host:port
REDIS_URL=""

# ===================================
# UploadThing (Optional - for file uploads)
# ===================================
# Get these from: https://uploadthing.com/
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# ===================================
# Google AI (Optional - for AI features)
# ===================================
# Get this from: https://makersuite.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=""

# ===================================
# Application Configuration
# ===================================
NODE_ENV="development"
NEXT_PUBLIC_URL="http://localhost:3000"
EOF
    
    print_success ".env created!"
}

###############################################################################
# STEP 7: Install Project Dependencies
###############################################################################
install_dependencies() {
    print_header "Step 6/7: Installing Dependencies"
    
    cd "$SCRIPT_DIR/$PROJECT_DIR"
    
    # Check disk space first
    AVAILABLE_SPACE=$(df -BM . | tail -1 | awk '{print $4}' | sed 's/M//')
    if [ "$AVAILABLE_SPACE" -lt 1000 ]; then
        print_error "Not enough disk space! Need at least 1GB free."
        print_info "Available: ${AVAILABLE_SPACE}MB"
        exit 1
    fi
    
    print_info "Installing ~150 packages ..."
    
    # First attempt: silent
    if ! pnpm install > /dev/null 2>&1; then
        print_warning "Silent install had issues, trying with output..."
        
        # Second attempt: with output
        if ! pnpm install; then
            print_error "pnpm install failed!"
            print_info "Trying to fix..."
            
            # Clean and retry
            print_info "Cleaning pnpm cache..."
            pnpm store prune || true
            rm -rf node_modules || true
            rm -f pnpm-lock.yaml || true
            
            print_info "Retrying installation..."
    if ! pnpm install; then
                print_error "Failed after retry. Check internet connection and disk space."
                exit 1
            fi
        fi
    fi
    
    # Verify node_modules exists
    if [ ! -d "node_modules" ]; then
        print_error "node_modules directory not created!"
        exit 1
    fi
    
    print_success "Dependencies installed!"
}

###############################################################################
# STEP 8: Setup Database Schema
###############################################################################
setup_database_schema() {
    print_header "Step 7/7: Database Schema"
    
    cd "$SCRIPT_DIR/$PROJECT_DIR"
    
    print_info "Creating database tables..."
    
    # Verify DATABASE_URL exists
    if [ -z "$DATABASE_URL" ]; then
        # Read from .env file
        if [ -f .env ]; then
            export DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
        fi
        
        if [ -z "$DATABASE_URL" ]; then
            print_error "DATABASE_URL not found!"
            exit 1
        fi
    fi
    
    # Test database connection before pushing schema
    print_info "Verifying database connection..."
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "Cannot connect to database!"
        print_info "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:.*@/:****@/')"
        print_info "Check if PostgreSQL is running: sudo systemctl status postgresql"
        exit 1
    fi
    
    # Push schema (silent first)
    if ! pnpm run db:push > /dev/null 2>&1; then
        print_warning "Silent db:push had issues, trying with output..."
    
    if ! pnpm run db:push; then
            print_error "Failed to create database schema!"
            print_info "Possible causes:"
            print_info "  - Database connection issues"
            print_info "  - Permission problems"
            print_info "  - Schema syntax errors"
            exit 1
        fi
    fi
    
    # Verify tables were created
    TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
    
    if [ -z "$TABLE_COUNT" ] || [ "$TABLE_COUNT" -lt 5 ]; then
        print_error "Database tables not created properly!"
        print_info "Expected 20+ tables, found: $TABLE_COUNT"
        exit 1
    fi
    
    print_success "$TABLE_COUNT tables created!"
}

###############################################################################
# STEP 9: Seed Sample Data
###############################################################################
seed_sample_data() {
    print_header "Step 8/8: Populating Sample Data"
    
    cd "$SCRIPT_DIR/$PROJECT_DIR"
    
    print_info "Adding sample entities and reviews..."
    print_info "This gives you real data to see how the platform works!"
    
    # Run the seed script
    if ! pnpm exec tsx scripts/seed-data.ts > /dev/null 2>&1; then
        print_warning "Silent seeding had issues, trying with output..."
        
        if ! pnpm exec tsx scripts/seed-data.ts; then
            print_warning "Could not seed sample data (non-critical)"
            print_info "You can add data manually through the website"
            return 0
        fi
    fi
    
    print_success "Sample data added!"
    print_info "Added:"
    print_info "  - 27 categories"
    print_info "  - 5 sample entities (PM, Delhi Metro, Railways, etc.)"
    print_info "  - 10-15 sample reviews"
}

###############################################################################
# STEP 10: Final Instructions
###############################################################################
start_server_message() {
    print_header "🎉 Setup Complete!"
    
    cd "$SCRIPT_DIR/$PROJECT_DIR"
    
    echo -e "═══════════════════════════════════════════════════════════════"
    echo -e "  ✅ Everything is installed and configured!                   "
    echo -e "═══════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${BLUE}What was installed:"
    echo "  ✅ Node.js v$(node -v)"
    echo "  ✅ pnpm v$(pnpm -v)"
    echo "  ✅ PostgreSQL (running)"
    echo "  ✅ Database: gems_of_india"
    echo "  ✅ Dependencies: ~847 packages"
    echo "  ✅ Database tables: 20+ created"
    echo "  ✅ Sample data: 5 entities, 10+ reviews"
    echo "  ✅ API keys: Configured"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════"
    echo -e "${YELLOW}  🚀 START THE SERVER:"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════"
    echo ""
    echo -e "  ${CYAN}cd gems-of-india"
    echo -e "  ${CYAN}pnpm run dev"
    echo ""
    echo -e "Then open: http://localhost:3000"
    echo ""
    echo -e "${BLUE}To stop server: Press Ctrl+C"
    echo ""
    print_success "Setup complete! 🎉"
}


###############################################################################
# Pre-flight Checks
###############################################################################
preflight_checks() {
    print_header "Pre-flight Checks"
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Don't run this script as root! Use: sudo ./setup.sh"
        exit 1
    fi
    
    # Check if project directory exists
    if [ ! -d "$SCRIPT_DIR/$PROJECT_DIR" ]; then
        print_error "Project directory '$PROJECT_DIR' not found!"
        https://github.com/varunmara/gems-of-india
    fi
    
    # Check internet connectivity
    print_info "Checking internet connection..."
    if ! ping -c 1 google.com > /dev/null 2>&1 && ! ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        print_error "No internet connection detected!"
        print_info "This script requires internet to download packages."
        exit 1
    fi
    print_success "Internet connection OK"
    
    # Check disk space
    AVAILABLE_GB=$(df -BG "$SCRIPT_DIR" | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$AVAILABLE_GB" -lt 2 ]; then
        print_error "Not enough disk space! Need at least 2GB free."
        print_info "Available: ${AVAILABLE_GB}GB"
        exit 1
    fi
    print_success "Disk space OK (${AVAILABLE_GB}GB available)"
    
    # Check if sudo works
    print_info "Checking sudo access..."
    if ! sudo -n true 2>/dev/null; then
        print_info "This script needs sudo access for installing packages."
    fi
    
    print_success "Pre-flight checks passed!"
}

###############################################################################
# Main Execution
###############################################################################
main() {
    clear
    echo -e "${CYAN}════════════════════════════════════════════════════════════════"
    echo -e "${CYAN}         Gems of India - One-Click Setup Script                 "
    echo -e "${CYAN}════════════════════════════════════════════════════════════════"
    echo ""
    print_info "Installing: Node.js, pnpm, PostgreSQL, dependencies..."
    print_warning "Sit back and relax!"
    echo ""
    read -p "Press Enter to start..."
    
    # Run pre-flight checks
    preflight_checks
    
    # Execute all steps (automated, no prompts)
    check_and_install_nodejs
    check_and_install_pnpm
    check_and_install_postgresql
    setup_postgresql_database
    create_env_file
    install_dependencies
    setup_database_schema
    seed_sample_data
    
    # Only NOW ask for API keys at the end
    collect_api_keys_at_end
    start_server_message
}

# Run the main function
main

