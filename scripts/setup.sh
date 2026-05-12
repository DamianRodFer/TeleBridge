#!/usr/bin/env bash
# TeleBridge Desktop App - Setup Script
# Run this after extracting the .tar file

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     🤖 TeleBridge - Setup Wizard        ║"
echo "║     Telegram Bot Manager v1.1            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detect project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Step 1: Check for bun or npm
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/5: Checking dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    echo -e "${GREEN}✓${NC} Found bun"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo -e "${GREEN}✓${NC} Found npm"
elif command -v node &> /dev/null; then
    echo -e "${YELLOW}!${NC} Node.js found but no package manager. Installing npm..."
    curl -fsSL https://npmjs.com/install.sh | sh
    PKG_MANAGER="npm"
else
    echo -e "${RED}✗${NC} Neither bun nor npm found."
    echo "  Please install Node.js first: https://nodejs.org/"
    echo "  Or bun: https://bun.sh/"
    exit 1
fi

# Step 2: Install project dependencies
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2/5: Installing dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_DIR"

if [ "$PKG_MANAGER" = "bun" ]; then
    bun install
else
    npm install
fi

echo -e "${GREEN}✓${NC} Dependencies installed"

# Step 3: Setup database
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3/5: Setting up database..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$PKG_MANAGER" = "bun" ]; then
    bun run db:push
else
    npx prisma db push
fi

echo -e "${GREEN}✓${NC} Database ready"

# Step 4: Build the Next.js app
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4/5: Building application..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$PKG_MANAGER" = "bun" ]; then
    bun run build
else
    npm run build
fi

echo -e "${GREEN}✓${NC} Application built"

# Step 5: Create desktop shortcut
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5/5: Creating desktop shortcut..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ICON_PATH="$PROJECT_DIR/build/icon.png"

# Create the launch script
cat > "$PROJECT_DIR/telebridge.sh" << EOF
#!/usr/bin/env bash
cd "$PROJECT_DIR"
$PKG_MANAGER run desktop
EOF
chmod +x "$PROJECT_DIR/telebridge.sh"

# Detect OS and create appropriate shortcut
OS="$(uname -s)"
case "$OS" in
    Linux*)
        DESKTOP_FILE="$HOME/Desktop/TeleBridge.desktop"
        APP_DIR="$HOME/.local/share/applications"
        mkdir -p "$APP_DIR"
        
        cat > "$DESKTOP_FILE" << DESKTOP
[Desktop Entry]
Name=TeleBridge
Comment=Telegram Bot Manager - Connect your bots to custom APIs
Exec=$PROJECT_DIR/telebridge.sh
Icon=$ICON_PATH
Terminal=true
Type=Application
Categories=Development;Network;
StartupNotify=true
DESKTOP
        
        cp "$DESKTOP_FILE" "$APP_DIR/TeleBridge.desktop"
        chmod +x "$DESKTOP_FILE"
        chmod +x "$APP_DIR/TeleBridge.desktop"
        
        echo -e "${GREEN}✓${NC} Desktop shortcut created: $DESKTOP_FILE"
        echo -e "${GREEN}✓${NC} Added to application menu"
        ;;
    Darwin*)
        # macOS - create an .app bundle
        APP_DIR="$HOME/Desktop/TeleBridge.app"
        mkdir -p "$APP_DIR/Contents/MacOS"
        mkdir -p "$APP_DIR/Contents/Resources"
        
        # Info.plist
        cat > "$APP_DIR/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>TeleBridge</string>
    <key>CFBundleDisplayName</key>
    <string>TeleBridge</string>
    <key>CFBundleIdentifier</key>
    <string>com.telebridge.app</string>
    <key>CFBundleVersion</key>
    <string>1.1.0</string>
    <key>CFBundleIconFile</key>
    <string>icon</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
PLIST
        
        # Launch script
        cat > "$APP_DIR/Contents/MacOS/TeleBridge" << LAUNCH
#!/bin/bash
cd "$PROJECT_DIR"
$PKG_MANAGER run desktop
LAUNCH
        chmod +x "$APP_DIR/Contents/MacOS/TeleBridge"
        
        # Copy icon
        cp "$ICON_PATH" "$APP_DIR/Contents/Resources/icon.png"
        
        echo -e "${GREEN}✓${NC} macOS app created: $APP_DIR"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        # Windows - create a shortcut using PowerShell
        SHORTCUT_PATH="$HOME/Desktop/TeleBridge.lnk"
        POWERSHELL_CMD="New-Object -ComObject WScript.Shell"
        
        echo -e "${YELLOW}!${NC} Windows detected. Creating shortcut via PowerShell..."
        powershell.exe -Command "
            \$ws = New-Object -ComObject WScript.Shell
            \$sc = \$ws.CreateShortcut('$SHORTCUT_PATH')
            \$sc.TargetPath = 'cmd.exe'
            \$sc.Arguments = '/k cd /d $PROJECT_DIR && $PKG_MANAGER run desktop'
            \$sc.IconLocation = '$ICON_PATH'
            \$sc.WorkingDirectory = '$PROJECT_DIR'
            \$sc.Description = 'TeleBridge - Telegram Bot Manager'
            \$sc.Save()
        " 2>/dev/null || {
            # Fallback: create a batch file
            BAT_FILE="$HOME/Desktop/TeleBridge.bat"
            echo "@echo off" > "$BAT_FILE"
            echo "cd /d $PROJECT_DIR" >> "$BAT_FILE"
            echo "$PKG_MANAGER run desktop" >> "$BAT_FILE"
            echo -e "${YELLOW}!${NC} Created batch file shortcut: $BAT_FILE"
        }
        echo -e "${GREEN}✓${NC} Desktop shortcut created"
        ;;
    *)
        echo -e "${YELLOW}!${NC} Unknown OS. You can launch TeleBridge manually:"
        echo "  cd $PROJECT_DIR && $PKG_MANAGER run desktop"
        ;;
esac

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     ✅ TeleBridge is ready!              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  🖥️  Double-click the desktop shortcut"
echo "  📋  Or run: cd $PROJECT_DIR && $PKG_MANAGER run desktop"
echo ""
echo "  The app will open in a desktop window."
echo ""
