# 🤖 AI Integration Setup Guide

This guide shows you how to add AI-powered quiz generation and code explanation to your VS Code extension.

## 🚀 Quick Start

### Option 1: Using VS Code Settings (Recommended)

1. **Open VS Code Settings**:
   - `File` > `Preferences` > `Settings` (Windows/Linux)
   - `Code` > `Preferences` > `Settings` (Mac)
   - Or press `Ctrl+,` / `Cmd+,`

2. **Search for "Code Quiz"** in the settings

3. **Configure AI Provider**:
   - Set `Code Quiz Explainer: Ai Provider` to `openai`
   - Add your `Code Quiz Explainer: Openai Api Key`
   - Choose your model (default: `gpt-4`)

4. **Restart VS Code** and test!

### Option 2: Using Environment Variables

1. **Create a `.env` file** in the extension root:
   ```bash
   cp env.example .env
   ```

2. **Edit `.env`** and add your API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Restart VS Code** to load environment variables

## 🔑 Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. Add it to VS Code settings or `.env` file

### Cost Considerations
- **GPT-4**: ~$0.03-0.06 per quiz/explanation
- **GPT-3.5-turbo**: ~$0.002-0.006 per quiz/explanation
- Free tier: $5 credit for new accounts

## ⚙️ Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `aiProvider` | `mock` | AI service (`openai`, `anthropic`, `local`, `mock`) |
| `openaiApiKey` | `""` | Your OpenAI API key |
| `openaiModel` | `gpt-4` | Model to use (`gpt-4`, `gpt-3.5-turbo`) |
| `openaiBaseURL` | `""` | Custom API endpoint (for compatible services) |
| `quizDifficulty` | `intermediate` | Quiz difficulty (`beginner`, `intermediate`, `advanced`) |
| `questionCount` | `5` | Number of quiz questions (1-10) |
| `explanationDetail` | `detailed` | Explanation depth (`basic`, `detailed`, `expert`) |

## 🧪 Testing AI Integration

1. **Test with Mock Data** (no API key needed):
   - Set `aiProvider` to `mock`
   - Use extension normally - it will use fallback logic

2. **Test with Real AI**:
   - Set `aiProvider` to `openai`
   - Add your API key
   - Try the commands on some code

3. **Verify in Debug Console**:
   - Press `F5` to launch Extension Development Host
   - Check the Debug Console for AI service logs

## 🔧 Advanced Setup

### Using Different Models

```json
// In VS Code settings.json
{
  "codeQuizExplainer.openaiModel": "gpt-3.5-turbo",  // Cheaper, faster
  "codeQuizExplainer.openaiModel": "gpt-4",          // Better quality
  "codeQuizExplainer.openaiModel": "gpt-4-turbo"     // Latest model
}
```

### Using Compatible APIs (OpenAI-like)

```json
{
  "codeQuizExplainer.openaiBaseURL": "https://api.groq.com/openai/v1",
  "codeQuizExplainer.openaiApiKey": "gsk_your_groq_key"
}
```

### Local AI Setup (Future)

```json
{
  "codeQuizExplainer.aiProvider": "local",
  "codeQuizExplainer.openaiBaseURL": "http://localhost:8080/v1",
  "codeQuizExplainer.openaiModel": "codellama-7b"
}
```

## 🚨 Troubleshooting

### Common Issues

**"AI service unavailable, using fallback"**
- Check your API key is correct
- Verify you have credits/quota remaining
- Check internet connection

**"Invalid JSON response from OpenAI"**
- Try a different model (gpt-3.5-turbo vs gpt-4)
- Check if the code snippet is too large
- Retry the operation

**Commands not showing up**
- Make sure you're in the Extension Development Host window
- Check the Debug Console for activation errors
- Verify the extension compiled successfully

### Debug Steps

1. **Check Extension Activation**:
   ```
   Look for: "Code Quiz & Explainer extension loaded successfully!"
   ```

2. **Check AI Configuration**:
   ```
   Look for: "AI not configured, falling back to mock data"
   ```

3. **Check API Calls**:
   ```
   Look for: "AI quiz generation failed:" or "AI explanation failed:"
   ```

## 📈 Performance Tips

1. **Use GPT-3.5-turbo** for faster, cheaper responses
2. **Limit question count** to 3-5 for quicker generation
3. **Set explanation detail** to `basic` for shorter responses
4. **Cache results** (future enhancement) to avoid repeated API calls

## 🔮 Future AI Providers

The extension is designed to support multiple AI providers:

- **Anthropic Claude** (coming soon)
- **Local models** via Ollama/LM Studio
- **Azure OpenAI** 
- **Google Gemini**
- **Custom endpoints**

## 💡 Tips for Better Results

### For Quiz Generation
- Provide clean, well-commented code
- Use descriptive variable and function names
- Include a variety of programming constructs

### For Code Explanation
- Paste complete functions/classes when possible
- Include relevant context (imports, etc.)
- Use consistent coding style

## 🛠️ Extending AI Integration

Want to add more AI providers? Check out `src/aiService.ts`:

```typescript
// Add new provider
case 'anthropic':
  return await this.generateAnthropicQuiz(prompt);

// Add new prompt templates
private buildCustomPrompt(request: AIRequest): string {
  // Your custom prompt logic
}
```

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look at the Debug Console output
3. Try with mock provider first
4. Create an issue with error logs

---

**Happy AI-powered learning!** 🎓✨
