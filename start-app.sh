#!/bin/bash

# SynapseCore + AIVectorVault Integration Startup Script
# This script helps start the integrated application and runs basic verification checks

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║    SynapseCore + AIVectorVault Integration Launcher       ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js to run this application.${NC}"
    exit 1
fi

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Are you in the correct directory?${NC}"
    exit 1
fi

# Check if node_modules exists, if not, install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install dependencies.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Dependencies installed successfully.${NC}"
fi

# Run pre-flight checks
echo -e "${BLUE}Running pre-flight checks...${NC}"

# Check for required files
required_files=(
    "src/App.tsx"
    "src/services/vectorVaultService.ts"
    "src/services/authService.ts"
    "src/components/vectorvault/VectorBaseSelector.tsx"
    "src/components/vectorvault/SaveToVaultButton.tsx"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Missing required file: $file${NC}"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -gt 0 ]; then
    echo -e "${RED}Error: $missing_files required files are missing.${NC}"
    exit 1
fi

echo -e "${GREEN}All required files present.${NC}"

# Start the development server
echo -e "${BLUE}Starting the development server...${NC}"
echo -e "${YELLOW}The application will be available at http://localhost:5173${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""
echo -e "${CYAN}=== GETTING STARTED ===${NC}"
echo -e "Create an account on the Sign Up tab (email + password)."
echo -e "Accounts are confirmed instantly and land straight in the app."
echo -e "Chat works out of the box via the Veritas AI gateway — add your own"
echo -e "provider API keys later under AI Settings for BYOK models."
echo ""
echo -e "${CYAN}=== MANUAL TESTING ===${NC}"
echo -e "A manual testing guide is available at: ${GREEN}./tests/manual-testing.md${NC}"
echo ""

# Start the application
npm run dev
