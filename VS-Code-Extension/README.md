# Code Quiz & Explainer VS Code Extension

A VS Code extension that helps you learn and understand code by quizzing you on pasted code and providing detailed explanations of every part of your code.

## Features

### 🧠 Interactive Code Quizzes
- **🤖 AI-Powered Questions**: GPT-4 generates intelligent, context-aware quiz questions
- **Automatic Quiz Activation**: When you paste code into the editor, get prompted to take a quiz about it
- **Manual Quiz Command**: Use "Quiz Me on This Code" from the Command Palette or `Ctrl+Shift+Q` (Windows/Linux) / `Cmd+Shift+Q` (Mac)
- **Multiple Question Types**: Both multiple-choice and open-ended questions
- **Smart Code Analysis**: Automatically identifies functions, variables, classes, and control flow statements
- **Progress Tracking**: Visual progress bar and scoring system
- **Difficulty Levels**: Beginner, intermediate, and advanced quiz modes

### 📚 Detailed Code Explanations
- **🤖 AI-Generated Explanations**: Deep, contextual code analysis using advanced language models
- **Line-by-Line Breakdown**: Get explanations for every line of code
- **Component Analysis**: Understand functions, variables, classes, and control structures
- **Visual Code Summary**: See statistics about your code's complexity and structure
- **Interactive Interface**: Click on lines to highlight them in the editor (planned feature)
- **Multiple Detail Levels**: Basic, detailed, and expert explanation modes

## Installation

### From Source (Development)

1. **Clone or download** this extension to your local machine
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Compile the TypeScript**:
   ```bash
   npm run compile
   ```
4. **Open in VS Code**:
   - Open the extension folder in VS Code
   - Press `F5` to launch a new Extension Development Host window
   - The extension will be active in the new window

5. **🤖 Enable AI Features** (Optional but Recommended):
   - See [AI_SETUP.md](AI_SETUP.md) for detailed instructions
   - **IMPORTANT**: Never commit API keys to version control!
   - Copy `.vscode/settings.example.json` to `.vscode/settings.json` and add your API key
   - Without AI: Extension works with built-in fallback logic

### Future: From VS Code Marketplace
*This extension will be available on the VS Code Marketplace once published.*

## Usage

### Taking a Quiz on Code

#### Method 1: Automatic (Paste Detection)
1. Copy some code from anywhere
2. Paste it into a VS Code editor
3. When prompted, click "Quiz Me!" to start an interactive quiz about the pasted code

#### Method 2: Manual Command
1. Select code in the editor (or have a file open)
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Type "Quiz Me on This Code" and press Enter
4. Or use the keyboard shortcut: `Ctrl+Shift+Q` / `Cmd+Shift+Q`

### Getting Code Explanations

1. Select code in the editor (or have a file open)
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Type "Explain This Code" and press Enter
4. View the detailed explanation in the side panel

## How It Works

### Code Analysis
The extension analyzes your code to identify:
- **Functions**: Function declarations and arrow functions
- **Variables**: const, let, and var declarations
- **Classes**: Class definitions and constructors
- **Control Flow**: if statements, loops, switch statements
- **Comments**: Documentation and inline comments

### Quiz Generation
Based on the analysis, the extension generates questions about:
- Function names and purposes
- Variable declarations and usage
- Code structure and flow
- Language-specific syntax
- Overall code complexity

### Explanation Generation
The explanation feature provides:
- **Overview**: High-level summary of what the code does
- **Statistics**: Line count, functions, variables, classes
- **Line-by-Line**: Detailed explanation of each line
- **Categorization**: Each line is categorized (declaration, assignment, control-flow, etc.)
- **Importance Levels**: Visual indicators for critical vs. informational lines

## Supported Languages

Currently optimized for:
- **JavaScript** (including ES6+)
- **TypeScript**
- **Basic support** for other languages (Python, Java, C++)

*Note: Language detection is currently basic and will be enhanced in future versions.*

## Extension Structure

The extension is built with a modular architecture:

```
src/
├── extension.ts       # Main activation and command registration
├── quizGenerator.ts   # Code analysis and quiz generation
├── codeExplainer.ts   # Line-by-line code explanation
└── uiManager.ts       # WebView UI management
```

## Future Enhancements

### Planned Features
- **AI Integration**: Replace mock quiz/explanation generation with AI models
- **Advanced Parsing**: Use AST (Abstract Syntax Tree) for better code analysis
- **More Languages**: Enhanced support for Python, Java, C++, Go, Rust, etc.
- **Difficulty Levels**: Beginner, intermediate, and advanced quiz modes
- **Learning Tracks**: Structured learning paths for different concepts
- **Progress Persistence**: Save quiz results and learning progress
- **Code Highlighting**: Highlight corresponding code lines from explanations

### AI Integration Points
The extension is structured to easily integrate with AI services:

1. **Quiz Generation**: Replace `QuizGenerator.generateQuiz()` with AI calls
2. **Code Explanation**: Replace `CodeExplainer.explainCode()` with AI analysis
3. **Smart Parsing**: Enhance code component detection with AI
4. **Personalized Learning**: Use AI to adapt quiz difficulty to user level

## Development

### Building
```bash
npm run compile
```

### Watching for Changes
```bash
npm run watch
```

### Testing
1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the commands in the new window

## Contributing

This extension is designed to be easily extensible. Key areas for contribution:

1. **Enhanced Code Parsing**: Improve language detection and AST parsing
2. **UI Improvements**: Better WebView designs and interactions
3. **Question Templates**: More diverse quiz question types
4. **Language Support**: Add support for more programming languages
5. **AI Integration**: Connect with OpenAI, Anthropic, or other AI services

## License

MIT License - feel free to use and modify as needed.

## Support

For issues, feature requests, or questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Include code samples when reporting bugs

---

**Happy Learning!** 🚀

*This extension helps you learn by doing - the best way to understand code is to actively engage with it through quizzes and explanations.*

