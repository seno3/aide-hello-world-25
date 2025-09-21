# 🎓 Teach-Before-Apply (TBA) Extension

A VS Code extension that proactively teaches before code is inserted, helping developers learn while they code.

## Features

### 🧠 Core Learning System
- **Intercepts** paste/completion/save events
- **Generates** compact learning cards with explanations
- **Requires** explicit confirmation before applying changes
- **Provides** micro-quizzes to test understanding
- **Logs** all learning events locally

### 📚 Personal Textbook Generator
- **Tracks** every explanation, quiz, and choice
- **Exports** daily learnings to Markdown and PDF
- **Generates** comprehensive learning reports
- **Command**: `TBA: Export Today's Learnings`

### 🧬 Learning DNA Spiral / Mind Map
- **Visualizes** concept relationships with D3.js
- **Updates** in real-time as you learn
- **Shows** concept frequency and connections
- **Interactive** node exploration

### 🐉 Boss Fight Mode
- **Triggers** every 5 accepted changes
- **Injects** buggy code snippets to fix
- **Tests** your understanding with challenges
- **Rewards** success with animations
- **Command**: `TBA: Toggle Boss Fight Mode`

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd tba-overlay
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile TypeScript**:
   ```bash
   npm run compile
   ```

4. **Launch Extension Development Host**:
   - Press `F5` in VS Code
   - Or use `Ctrl+Shift+P` → "Developer: Reload Window"

## Usage

### Getting Started

1. **Open a supported file** (JavaScript, TypeScript, Python, SQL, etc.)
2. **Start coding** - the extension will detect changes
3. **Learning cards appear** automatically when you make significant changes
4. **Answer quizzes** to test your understanding
5. **Apply or skip** changes based on your learning

### Commands

Access via Command Palette (`Ctrl+Shift+P`):

- **`TBA: Open Learning Panel`** - Opens the main learning interface
- **`TBA: Export Today's Learnings`** - Generates your personal textbook
- **`TBA: Toggle Boss Fight Mode`** - Enables/disables boss challenges

### Learning Cards

Each learning card includes:

- **🤔 Why?** - Explanation of the concept
- **📝 Code Changes** - Visual diff of what changed
- **🧠 Quick Check** - Multiple choice or fill-in-the-blank quiz
- **🔄 Alternative Approaches** - Different ways to solve the problem
- **✅ Apply/Skip** - Choose whether to apply the changes

### Risk Assessment

The extension automatically detects risky operations:

- **🔴 High Risk**: Security-sensitive code, destructive operations
- **🟡 Medium Risk**: Database operations, file system changes
- **🟢 Low Risk**: Safe code changes

### Boss Fights

Every 5 accepted changes triggers a boss fight:

1. **Buggy code** is presented
2. **Test output** shows the failure
3. **Fix the bug** in the provided textarea
4. **Test your solution** against the challenge
5. **Celebrate victory** with animations

## Supported Languages

- JavaScript/TypeScript
- Python
- SQL
- Java
- C#
- C++
- Go
- Rust

## Architecture

```
src/
├── extension.ts              # Main extension entry point
├── core/
│   ├── ai.ts                # Mock AI service for teaching cards
│   ├── risk.ts              # Risk classification system
│   ├── boss.ts              # Boss fight management
│   └── telemetry.ts         # Type definitions
├── storage/
│   ├── logger.ts            # JSONL learning history
│   └── export.ts            # Markdown/PDF export
├── client/
│   ├── panel.html           # Webview interface
│   ├── panel.ts             # Panel logic
│   ├── visualizer.ts        # D3.js visualization
│   └── styles.css           # Styling
└── vscode/
    └── commands.ts          # Command registration
```

## Configuration

### Learning History

Learning events are stored in `~/.tba/history.jsonl`:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "file": "/path/to/file.js",
  "mode": "explain",
  "risk": "low",
  "concept_tags": ["async-await", "error-handling"],
  "quiz_correct": true,
  "applied": true,
  "latency_ms": 1250
}
```

### Export Options

The Personal Textbook Generator supports:

- **Markdown export** - Always available
- **PDF export** - Requires puppeteer (included)
- **Date filtering** - Today's learnings or all time
- **Concept statistics** - Learning progress tracking

## Development

### Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

### Testing

1. **Open the project** in VS Code
2. **Press F5** to launch Extension Development Host
3. **Open a test file** with supported language
4. **Make code changes** to trigger learning cards
5. **Test all features**:
   - Learning cards
   - Quizzes
   - Boss fights
   - Export functionality
   - Learning visualizer

### Mock Data

The extension includes comprehensive mock teaching cards for:

- **Debouncing** - Performance optimization
- **SQL Injection** - Security best practices
- **Async/Await** - Asynchronous programming
- **React Hooks** - Modern React patterns
- **Error Handling** - Robust code practices

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## Roadmap

### Phase 1 (Current)
- ✅ Mock AI teaching cards
- ✅ Risk classification
- ✅ Boss fight challenges
- ✅ Learning history logging
- ✅ Personal textbook export
- ✅ D3.js visualization

### Phase 2 (Future)
- 🔄 Real LLM integration
- 🔄 Custom learning paths
- 🔄 Team learning analytics
- 🔄 Integration with popular frameworks
- 🔄 Advanced code analysis

### Phase 3 (Advanced)
- 🔄 AI-powered code suggestions
- 🔄 Personalized learning recommendations
- 🔄 Integration with learning platforms
- 🔄 Collaborative learning features

## Troubleshooting

### Common Issues

1. **Learning cards not appearing**:
   - Check if the file language is supported
   - Ensure changes are significant (>50 characters)
   - Verify extension is activated

2. **Export not working**:
   - Check `~/.tba/` directory permissions
   - Ensure puppeteer is installed
   - Try Markdown-only export

3. **Boss fights not triggering**:
   - Verify Boss Fight Mode is enabled
   - Check that you've applied 5 changes
   - Reset counter if needed

### Debug Mode

Enable debug logging:

1. Open VS Code Developer Tools (`Help` → `Toggle Developer Tools`)
2. Check Console for TBA extension logs
3. Look for error messages and stack traces

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **D3.js** for visualization capabilities
- **VS Code Extension API** for integration
- **Puppeteer** for PDF generation
- **TypeScript** for type safety

---

**Happy Learning! 🎓**

Start coding and let TBA help you become a better developer through continuous learning and understanding.