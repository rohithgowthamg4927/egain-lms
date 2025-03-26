
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== LMS Application Starter ===${NC}"
echo "This script will help you start both the backend and frontend"

# Check if database exists and run setup if needed
echo -e "${BLUE}Checking database setup...${NC}"
if npx prisma db pull --print >/dev/null 2>&1; then
  echo -e "${GREEN}Database exists and is connected!${NC}"
else
  echo -e "${RED}Database not found or connection issues.${NC}"
  read -p "Do you want to run database setup? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Running database setup...${NC}"
    npx prisma generate
    npx prisma db push
    
    read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      node scripts/update-package-json.js
      node scripts/seed-database.js
    fi
  fi
fi

# Start backend in a new terminal
echo -e "${BLUE}Starting backend server...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && cd backend && ts-node api.ts"'
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd \"$(pwd)/backend\" && ts-node api.ts; exec bash"
  elif command -v xterm &> /dev/null; then
    xterm -e "cd \"$(pwd)/backend\" && ts-node api.ts; exec bash" &
  else
    echo -e "${RED}Could not find a suitable terminal. Please start the backend manually in another terminal:${NC}"
    echo "cd \"$(pwd)/backend\" && ts-node api.ts"
  fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows with Git Bash
  start cmd.exe /k "cd /d \"$(pwd)\\backend\" && ts-node api.ts"
else
  echo -e "${RED}Unknown operating system. Please start the backend manually in another terminal:${NC}"
  echo "cd \"$(pwd)/backend\" && ts-node api.ts"
fi

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
npm run dev
