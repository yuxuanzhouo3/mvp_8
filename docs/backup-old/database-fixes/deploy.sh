#!/bin/bash

echo "🚀 Deploying Privacy Policy Page..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Check if privacy page exists
    if [ -f "app/privacy/page.tsx" ]; then
        echo "✅ Privacy policy page found at app/privacy/page.tsx"
        echo ""
        echo "🎯 Next steps:"
        echo "1. Deploy to your hosting platform (Vercel, Netlify, etc.)"
        echo "2. Set up custom domain: mornhub.help"
        echo "3. Privacy policy will be available at: https://mornhub.help/privacy"
        echo ""
        echo "📋 For WeChat Open Platform, use this URL:"
        echo "   https://mornhub.help/privacy"
    else
        echo "❌ Privacy policy page not found!"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📖 For detailed deployment instructions, see: deploy-privacy-policy.md" 