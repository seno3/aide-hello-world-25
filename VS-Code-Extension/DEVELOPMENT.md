# Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- VS Code 1.74.0+
- TypeScript knowledge

### Installation
```bash
cd VS-Code-Extension
npm install
npm run compile
```

### Development
1. Open this folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Test your changes in the new window

### Building
```bash
# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npx vsce package
```

## 📁 Project Structure

```
VS-Code-Extension/
├── src/                    # TypeScript source files
│   ├── extension.ts       # Main extension entry point
│   ├── quizGenerator.ts   # Quiz logic
│   ├── codeExplainer.ts   # Explanation logic
│   ├── uiManager.ts       # UI and webview management
│   └── aiService.ts       # AI integration
├── out/                   # Compiled JavaScript files
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript configuration
├── README.md              # User documentation
├── CHANGELOG.md           # Version history
├── LICENSE                # MIT license
└── .vscodeignore         # Files to exclude from package
```

## 🔧 Key Components

### Extension Entry Point (`extension.ts`)
- Registers commands and event listeners
- Handles poke feature setup
- Manages paste interception

### UI Manager (`uiManager.ts`)
- Creates webview panels
- Generates HTML/CSS/JavaScript for modals
- Handles webview communication

### Quiz Generator (`quizGenerator.ts`)
- AI-powered question generation
- Fallback rule-based questions
- Language detection

### Code Explainer (`codeExplainer.ts`)
- Line-by-line analysis
- Code categorization
- Summary generation

### AI Service (`aiService.ts`)
- OpenAI integration
- Configuration management
- Error handling and fallbacks

## 🧪 Testing

### Manual Testing
1. Launch Extension Development Host (`F5`)
2. Test commands:
   - "Quiz Me on This Code"
   - "Explain This Code"
   - "Test Poke Modal"
3. Test poke feature (enable in settings first)

### Debug Console
- Check Developer Tools for console output
- Look for `🚀`, `🔍`, `🔴` prefixed debug messages

## ⚙️ Configuration

### Settings
- `codeQuizExplainer.poke`: Enable/disable poke feature
- `codeQuizExplainer.quizDifficulty`: Quiz difficulty level
- `codeQuizExplainer.questionCount`: Number of questions
- `codeQuizExplainer.explanationDetail`: Explanation detail level

### AI Setup (Optional)
1. Copy `env.example` to `.env`
2. Add your OpenAI API key
3. Configure in VS Code settings

## 📦 Publishing

### Preparation
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Test thoroughly
4. Run `npm run compile`

### Package
```bash
npx vsce package
```

### Publish
```bash
npx vsce publish
```

## 🐛 Troubleshooting

### Common Issues
1. **Extension not loading**: Check console for errors
2. **Commands not appearing**: Verify `package.json` contributions
3. **Webview not showing**: Check HTML generation in UI manager
4. **Paste not working**: Enable poke feature in settings

### Debug Tips
- Use extensive console logging (already implemented)
- Test in clean Extension Development Host
- Check VS Code version compatibility
- Verify all dependencies are installed
