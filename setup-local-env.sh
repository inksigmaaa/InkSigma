#!/bin/bash

# InkSigma - Setup Local Environment Script
# This script helps you switch from production to local development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   InkSigma - Local Environment Setup  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Step 1: Backup production configs
echo -e "${BLUE}[1/6]${NC} Backing up production environment files..."

if [ -f "backend/.env" ]; then
    if [ ! -f "backend/.env.production" ]; then
        cp backend/.env backend/.env.production
        print_success "Backed up backend/.env to backend/.env.production"
    else
        print_warning "backend/.env.production already exists, skipping backup"
    fi
else
    print_warning "backend/.env not found"
fi

if [ -f ".env" ]; then
    if [ ! -f ".env.production" ]; then
        cp .env .env.production
        print_success "Backed up .env to .env.production"
    else
        print_warning ".env.production already exists, skipping backup"
    fi
else
    print_warning ".env not found"
fi

# Step 2: Copy local configs
echo -e "${BLUE}[2/6]${NC} Setting up local environment files..."

if [ -f "backend/.env.local" ]; then
    cp backend/.env.local backend/.env
    print_success "Copied backend/.env.local to backend/.env"
else
    print_error "backend/.env.local not found!"
    exit 1
fi

if [ -f ".env.local" ]; then
    cp .env.local .env
    print_success "Copied .env.local to .env"
else
    print_error ".env.local not found!"
    exit 1
fi

# Step 3: Check PostgreSQL
echo -e "${BLUE}[3/6]${NC} Checking PostgreSQL..."

if command -v psql &> /dev/null; then
    print_success "PostgreSQL is installed"
else
    print_error "PostgreSQL not found. Install with: brew install postgresql"
    exit 1
fi

# Step 4: Check/Create local database
echo -e "${BLUE}[4/6]${NC} Checking local database..."

if psql -U gugan -lqt | cut -d \| -f 1 | grep -qw inksigma; then
    print_success "Database 'inksigma' exists"
else
    print_warning "Database 'inksigma' not found"
    read -p "Create database 'inksigma'? (y/n): " create_db
    
    if [ "$create_db" = "y" ]; then
        createdb -U gugan inksigma
        print_success "Created database 'inksigma'"
    else
        print_error "Database required for local development"
        exit 1
    fi
fi

# Step 5: Run migrations
echo -e "${BLUE}[5/6]${NC} Running database migrations..."

read -p "Run database migrations? (y/n): " run_migrations

if [ "$run_migrations" = "y" ]; then
    cd backend
    npm run db:push
    cd ..
    print_success "Migrations complete!"
else
    print_warning "Skipped migrations. Run manually: cd backend && npm run db:push"
fi

# Step 6: Check hosts file
echo -e "${BLUE}[6/6]${NC} Checking hosts file..."

if grep -q "inksigma.local" /etc/hosts; then
    print_success "Hosts file configured"
else
    print_warning "Hosts file not configured"
    echo ""
    echo -e "${YELLOW}Add these lines to /etc/hosts:${NC}"
    echo "127.0.0.1 inksigma.local"
    echo "127.0.0.1 api.inksigma.local"
    echo "127.0.0.1 dashboard.inksigma.local"
    echo ""
    echo "Run: sudo nano /etc/hosts"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Local Environment Setup Complete!  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

print_info "Environment files configured for local development"
print_info "Production configs backed up to .env.production"
echo ""

echo -e "${YELLOW}⚠ IMPORTANT: Update Google OAuth Redirect URIs${NC}"
echo "Go to: https://console.cloud.google.com"
echo "Add these redirect URIs:"
echo "  - http://api.inksigma.local:5000/api/auth/callback/google"
echo "  - http://localhost:5000/api/auth/callback/google"
echo ""

echo -e "${BLUE}Next steps:${NC}"
echo "1. Update Google OAuth redirect URIs (see above)"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: npm run dev"
echo "4. Visit: http://inksigma.local:3000"
echo ""

read -p "Start the application now? (y/n): " start_app

if [ "$start_app" = "y" ]; then
    print_info "Starting application..."
    print_info "Backend: http://api.inksigma.local:5000"
    print_info "Frontend: http://inksigma.local:3000"
    echo ""
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/backend && npm run dev"'
        sleep 2
        npm run dev
    else
        print_info "Starting backend in background..."
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        print_info "Starting frontend..."
        npm run dev
        
        trap "kill $BACKEND_PID" EXIT
    fi
else
    print_info "Run manually:"
    echo "  Terminal 1: cd backend && npm run dev"
    echo "  Terminal 2: npm run dev"
fi
