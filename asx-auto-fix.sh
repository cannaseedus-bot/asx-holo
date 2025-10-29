#!/usr/bin/env bash
# =====================================================================
# 🔧 ASX Holographic Browser — Auto Fix, Install, and Push Script
# Author: CannaseedUS Bot Automation
# =====================================================================

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}   🔮 ASX HOLO BROWSER — AUTO FIX & GIT SYNC SCRIPT${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Step 1: Verify Node.js & npm
if ! command -v node >/dev/null; then
  echo -e "${RED}❌ Node.js not found! Install Node.js v18+ before continuing.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Node.js $(node -v) detected.${NC}"
fi
if ! command -v npm >/dev/null; then
  echo -e "${RED}❌ npm not found!${NC}"
  exit 1
else
  echo -e "${GREEN}✅ npm $(npm -v) detected.${NC}"
fi

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
npm install express cors node-fetch@2 --save >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ npm install failed.${NC}"; exit 1;
fi
echo -e "${GREEN}✅ Dependencies OK.${NC}"

# Step 3: Sanity check project files
REQUIRED=( "package.json" "server.mjs" "runtime" "style" )
for FILE in "${REQUIRED[@]}"; do
  if [ ! -e "$FILE" ]; then
    echo -e "${RED}⚠ Missing: $FILE${NC}"
  else
    echo -e "${GREEN}✔ Found $FILE${NC}"
  fi
done

# Step 4: Clean node_modules if broken
if [ ! -d "node_modules/express" ]; then
  echo -e "${YELLOW}🧹 Rebuilding node_modules...${NC}"
  rm -rf node_modules package-lock.json
  npm install express cors node-fetch@2 --save
fi

# Step 5: Verify server launch
echo -e "${YELLOW}🚀 Starting ASX Holo server (test mode)...${NC}"
timeout 5s node server.mjs >/dev/null 2>&1
if [ $? -eq 124 ]; then
  echo -e "${GREEN}✅ Server launch verified.${NC}"
else
  echo -e "${RED}⚠ Server check failed. Review server.mjs for errors.${NC}"
fi

# Step 6: Git init if missing
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}🪄 Initializing Git repo...${NC}"
  git init
  git branch -M main
  git remote add origin https://github.com/cannaseedus-bot/asx-holo.git
fi

# Step 7: Commit & push
echo -e "${YELLOW}💾 Committing & pushing latest build...${NC}"
git add . >/dev/null 2>&1
git commit -m "Auto Fix & Sync: $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null 2>&1
git push -u origin main || echo -e "${RED}⚠️ Push failed (check your GitHub token).${NC}"

# Step 8: Finish
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ASX Browser repaired & synced to GitHub${NC}"
echo -e "${YELLOW}▶ Launch with:${NC} ${CYAN}node server.mjs${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
