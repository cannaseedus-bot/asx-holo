#!/usr/bin/env bash
# =====================================================================
# 🚀 ASX Holographic Browser Auto-Installer (setup-asx.sh)
# Safe for Git Bash / WSL / PowerShell / Mac / Linux
# =====================================================================

# Colors
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}   🔮 ASX HOLOGRAPHIC BROWSER — AUTO INSTALL & SETUP SCRIPT${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# -----------------------------------------------------------------------------
# STEP 1: Verify Node.js
# -----------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}❌ Node.js not found. Please install Node.js (v18 or later).${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Node.js version $(node -v) detected.${NC}"
fi

# -----------------------------------------------------------------------------
# STEP 2: Verify npm
# -----------------------------------------------------------------------------
if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ npm version $(npm -v) detected.${NC}"
fi

# -----------------------------------------------------------------------------
# STEP 3: Create project structure if missing
# -----------------------------------------------------------------------------
mkdir -p runtime style
echo -e "${GREEN}📁 Ensured folder structure: runtime/, style/${NC}"

# -----------------------------------------------------------------------------
# STEP 4: Initialize package.json (skip if already exists)
# -----------------------------------------------------------------------------
if [ ! -f "package.json" ]; then
  echo -e "${YELLOW}📝 Creating package.json...${NC}"
  npm init -y >/dev/null 2>&1
fi

# -----------------------------------------------------------------------------
# STEP 5: Install dependencies
# -----------------------------------------------------------------------------
echo -e "${YELLOW}📦 Installing required packages: express, cors, node-fetch${NC}"
npm install express cors node-fetch@2 --save >/dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Dependencies installed successfully.${NC}"
else
  echo -e "${RED}❌ npm install failed. Please check your connection.${NC}"
  exit 1
fi

# -----------------------------------------------------------------------------
# STEP 6: Create or verify essential files
# -----------------------------------------------------------------------------
check_or_create() {
  local file=$1
  local content=$2
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}🧩 Creating missing file: ${file}${NC}"
    echo "$content" > "$file"
  else
    echo -e "${GREEN}✅ Found: ${file}${NC}"
  fi
}

# Create .gitignore
check_or_create ".gitignore" "node_modules/
*.log
.DS_Store
.env
"

# -----------------------------------------------------------------------------
# STEP 7: Start server
# -----------------------------------------------------------------------------
echo -e "${YELLOW}🚀 Starting ASX Browser server...${NC}"
if [ -f "server.mjs" ]; then
  node server.mjs
else
  echo -e "${RED}❌ Missing server.mjs — please add the file before running.${NC}"
  exit 1
fi

# -----------------------------------------------------------------------------
# STEP 8: Final message
# -----------------------------------------------------------------------------
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${YELLOW}▶ Open your browser at:${NC} ${CYAN}http://localhost:8080${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"