/**
 * Modern UI Manager Module
 * 
 * This module creates stunning, modern WebView panels with advanced animations,
 * glassmorphism effects, and interactive elements for the ultimate UX.
 */

import * as vscode from 'vscode';
import { Quiz, QuizQuestion } from './quizGenerator';
import { CodeExplanation, CodeExplainer } from './codeExplainer';

export class UIManager {
    private context: vscode.ExtensionContext;
    private codeExplainer?: CodeExplainer;

    constructor(context: vscode.ExtensionContext, codeExplainer?: CodeExplainer) {
        this.context = context;
        this.codeExplainer = codeExplainer;
    }

    /**
     * Show a quiz in a modern, animated WebView panel
     */
    async showQuizPanel(quiz: Quiz, originalCode: string): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codeQuiz',
            '🧠 Code Quiz Challenge',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.context.extensionUri]
            }
        );

        panel.webview.html = this.generateModernQuizHTML(quiz, originalCode);

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'submitAnswer':
                        this.handleQuizAnswer(panel, message.questionId, message.answer, quiz);
                        break;
                    case 'nextQuestion':
                        this.showNextQuestion(panel, message.questionIndex, quiz);
                        break;
                    case 'restartQuiz':
                        panel.webview.html = this.generateModernQuizHTML(quiz, originalCode);
                        break;
                    case 'playSound':
                        // Could integrate with VS Code's audio capabilities
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * Show a code explanation in a modern, interactive WebView panel
     */
    async showExplanationPanel(explanation: CodeExplanation, originalCode: string): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'codeExplanation',
            '📚 Code Explanation',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.context.extensionUri]
            }
        );

        panel.webview.html = this.generateModernExplanationHTML(explanation, originalCode);

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'highlightLine':
                        console.log('Highlight line:', message.lineNumber);
                        break;
                    case 'toggleSection':
                        // Handle section toggling
                        break;
                    case 'clarify':
                        // Acknowledge receipt to the webview
                        panel.webview.postMessage({ command: 'clarifyAck' });
                        if (!this.codeExplainer) {
                            panel.webview.postMessage({ command: 'clarifyResult', error: 'Clarification not available.' });
                            return;
                        }
                        (async () => {
                            try {
                                const answer = await this.codeExplainer!.clarify(originalCode, message.question || '');
                                panel.webview.postMessage({ command: 'clarifyResult', answer });
                            } catch (err: any) {
                                panel.webview.postMessage({ command: 'clarifyResult', error: String(err) });
                            }
                        })();
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * Generate modern, animated HTML for quiz panel
     */
    private generateModernQuizHTML(quiz: Quiz, originalCode: string): string {
        const firstQuestion = quiz.questions[0];
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Quiz Challenge</title>
            <style>
                ${this.getModernStyles()}
            </style>
        </head>
        <body>
            <!-- Animated Background -->
            <div class="animated-bg">
                <div class="floating-shapes">
                    <div class="shape shape-1"></div>
                    <div class="shape shape-2"></div>
                    <div class="shape shape-3"></div>
                    <div class="shape shape-4"></div>
                    <div class="shape shape-5"></div>
                </div>
            </div>

            <!-- Main Container -->
            <div class="quiz-container">
                <!-- Header with Glassmorphism -->
                <div class="quiz-header glass-card">
                    <div class="header-content">
                        <div class="quiz-icon">🧠</div>
                        <h1 class="quiz-title">${quiz.title}</h1>
                        <p class="quiz-subtitle">Test your coding knowledge with style</p>
                    </div>
                    
                    <!-- Advanced Progress Bar -->
                    <div class="progress-container">
                        <div class="progress-track">
                            <div class="progress-fill" id="progressFill">
                                <div class="progress-glow"></div>
                            </div>
                        </div>
                        <div class="progress-text">
                            <span class="current-question" id="currentQuestion">1</span>
                            <span class="separator">/</span>
                            <span class="total-questions">${quiz.totalQuestions}</span>
                        </div>
                    </div>
                </div>

                <!-- Question Container -->
                <div class="question-wrapper" id="questionContainer">
                    ${this.generateModernQuestionHTML(firstQuestion, 0)}
                </div>

                <!-- Quiz Complete Screen -->
                <div class="quiz-complete glass-card" id="quizComplete">
                    <div class="completion-animation">
                        <div class="trophy-icon">🏆</div>
                        <div class="celebration-particles">
                            <div class="particle"></div>
                            <div class="particle"></div>
                            <div class="particle"></div>
                            <div class="particle"></div>
                            <div class="particle"></div>
                        </div>
                    </div>
                    <h2 class="completion-title">Amazing Work!</h2>
                    <div class="score-display" id="scoreDisplay"></div>
                    <p class="completion-message">You've mastered this code like a pro! 🚀</p>
                    <button class="modern-btn primary-btn pulse" onclick="restartQuiz()">
                        <span class="btn-text">Challenge Again</span>
                        <div class="btn-ripple"></div>
                    </button>
                </div>
            </div>

            <!-- Floating Action Button -->
            <div class="fab-container">
                <button class="fab" onclick="toggleTheme()">
                    <span class="fab-icon">🎨</span>
                </button>
            </div>

            <script>
                ${this.getModernQuizJavaScript(quiz)}
            </script>
        </body>
        </html>`;
    }

    /**
     * Generate modern HTML for a single quiz question
     */
    private generateModernQuestionHTML(question: QuizQuestion, index: number): string {
        let optionsHTML = '';
        
        if (question.type === 'multiple-choice' && question.options) {
            optionsHTML = `
                <div class="options-grid">
                    ${question.options.map((option, optionIndex) => `
                        <div class="option-card" onclick="selectOption(${optionIndex})" data-option="${option}">
                            <div class="option-content">
                                <div class="option-letter">${String.fromCharCode(65 + optionIndex)}</div>
                                <div class="option-text">${option}</div>
                            </div>
                            <div class="option-ripple"></div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            optionsHTML = `
                <div class="text-input-container">
                    <textarea class="modern-textarea" id="textAnswer" placeholder="Share your thoughts..." rows="4"></textarea>
                    <div class="input-focus-line"></div>
                </div>
            `;
        }

        return `
            <div class="question-card glass-card slide-in">
                <div class="question-header">
                    <div class="question-number">Q${index + 1}</div>
                    <div class="question-type-badge ${question.type}">${question.type.replace('-', ' ')}</div>
                </div>
                
                <div class="question-content">
                    <h3 class="question-text">${question.question}</h3>
                    
                    ${question.codeSnippet ? `
                        <div class="code-snippet-container">
                            <div class="code-header">
                                <div class="code-dots">
                                    <span class="dot red"></span>
                                    <span class="dot yellow"></span>
                                    <span class="dot green"></span>
                                </div>
                                <span class="code-title">Code Snippet</span>
                            </div>
                            <pre class="code-snippet"><code>${this.escapeHtml(question.codeSnippet)}</code></pre>
                        </div>
                    ` : ''}
                    
                    ${optionsHTML}
                </div>
                
                <div class="question-actions">
                    <button class="modern-btn primary-btn" onclick="submitAnswer('${question.id}')">
                        <span class="btn-text">Submit Answer</span>
                        <div class="btn-loading">
                            <div class="loading-spinner"></div>
                        </div>
                        <div class="btn-ripple"></div>
                    </button>
                </div>
                
                <div class="explanation-panel" id="explanation-${question.id}">
                    <div class="explanation-header">
                        <span class="explanation-icon">💡</span>
                        <span class="explanation-title">Explanation</span>
                    </div>
                    <div class="explanation-content">
                        ${question.explanation}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate modern HTML for explanation panel
     */
    private generateModernExplanationHTML(explanation: CodeExplanation, originalCode: string): string {
        const selectedLineCount = originalCode
            ? originalCode.replace(/\n$/, '').split('\n').length
            : 0;
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Explanation</title>
            <style>
                ${this.getModernStyles()}
                ${this.getExplanationStyles()}
            </style>
        </head>
        <body>
            <!-- Animated Background -->
            <div class="animated-bg">
                <div class="floating-shapes">
                    <div class="shape shape-1"></div>
                    <div class="shape shape-2"></div>
                    <div class="shape shape-3"></div>
                </div>
            </div>

            <div class="explanation-container">
                <!-- Header -->
                <div class="explanation-header glass-card">
                    <div class="header-icon">📚</div>
                    <div class="header-content">
                        <h1>${explanation.title}</h1>
                        <p class="header-subtitle">Deep dive into your code</p>
                    </div>
                </div>

                <!-- Overview Card -->
                <div class="overview-card glass-card slide-in">
                    <div class="card-header">
                        <span class="card-icon">🎯</span>
                        <h2>Overview</h2>
                    </div>
                    <p class="overview-text">${explanation.overview}</p>
                </div>

                <!-- Ask Clarifying Questions -->
                <div class="clarify-card glass-card slide-in">
                    <div class="card-header">
                        <span class="card-icon">💬</span>
                        <h2>Ask Clarifying Questions</h2>
                    </div>
                    <p class="overview-text">Have follow-up questions about the overview? Ask for more detail or different angles.</p>
                    <div class="clarify-inputs">
                        <textarea id="clarifyInput" class="modern-textarea" rows="3" placeholder="Ask a follow-up... (Shift+Enter for newline)"></textarea>
                        <button id="clarifyBtn" class="modern-btn primary-btn">
                            <span class="btn-text">Ask AI</span>
                            <div class="btn-loading"><div class="loading-spinner"></div></div>
                            <div class="btn-ripple"></div>
                        </button>
                    </div>
                    <div id="clarifyResults" class="clarify-results chat-list"></div>
                </div>

                <!-- Stats Dashboard removed per request -->

                <!-- Line Explanations -->
                <div class="line-explanations-section">
                    <div class="section-header glass-card">
                        <h2>
                            <span class="section-icon">🔍</span>
                            Line-by-Line Analysis
                        </h2>
                    </div>

                    <div class="line-explanations">
                        ${explanation.lineByLineExplanations.map((lineExp, index) => `
                            <div class="line-explanation-card glass-card importance-${lineExp.importance} category-${lineExp.category}" 
                                 onclick="highlightLine(${lineExp.lineNumber})"
                                 style="--delay: ${index * 0.05}s">
                                <div class="line-header">
                                    <div class="line-number-badge">${lineExp.lineNumber}</div>
                                    <div class="category-badge ${lineExp.category}">${lineExp.category}</div>
                                    <div class="importance-indicator ${lineExp.importance}"></div>
                                </div>
                                <div class="line-code-container">
                                    <pre class="line-code"><code>${this.escapeHtml(lineExp.code)}</code></pre>
                                </div>
                                <div class="line-explanation-text">
                                    ${lineExp.explanation}
                                </div>
                                <div class="hover-effect"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                
            </div>

            <script>
                ${this.getModernExplanationJavaScript()}
            </script>
        </body>
        </html>`;
    }

    /**
     * Modern CSS styles with glassmorphism, animations, and advanced effects
     */
    private getModernStyles(): string {
        return `
            :root {
                --primary-color: #d4af37;
                --primary-light: #e6c65c;
                --primary-dark: #b8860b;
                --secondary-color: #996515;
                --success-color: #10b981;
                --warning-color: #f59e0b;
                --error-color: #ef4444;
                --glass-bg: rgba(255, 255, 255, 0.1);
                --glass-border: rgba(255, 255, 255, 0.2);
                --shadow-light: 0 8px 32px rgba(0, 0, 0, 0.1);
                --shadow-heavy: 0 20px 60px rgba(0, 0, 0, 0.2);
                --gradient-primary: linear-gradient(135deg, #d4af37, #b8860b);
                --gradient-success: linear-gradient(135deg, var(--success-color), #059669);
                --gradient-glass: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: radial-gradient(1200px 800px at 10% 10%, rgba(212, 175, 55, 0.08), transparent 60%),
                            radial-gradient(1200px 800px at 90% 20%, rgba(184, 134, 11, 0.08), transparent 60%),
                            #0a0a0a;
                color: var(--vscode-foreground, #ffffff);
                min-height: 100vh;
                overflow-x: hidden;
                position: relative;
            }

            /* Animated Background */
            .animated-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                overflow: hidden;
            }

            .floating-shapes {
                position: absolute;
                width: 100%;
                height: 100%;
            }

            .shape {
                position: absolute;
                border-radius: 50%;
                background: var(--gradient-glass);
                backdrop-filter: blur(10px);
                animation: float 20s infinite linear;
            }

            .shape-1 { width: 80px; height: 80px; top: 20%; left: 10%; animation-delay: 0s; }
            .shape-2 { width: 120px; height: 120px; top: 60%; left: 80%; animation-delay: -5s; }
            .shape-3 { width: 60px; height: 60px; top: 80%; left: 20%; animation-delay: -10s; }
            .shape-4 { width: 100px; height: 100px; top: 30%; left: 70%; animation-delay: -15s; }
            .shape-5 { width: 40px; height: 40px; top: 10%; left: 60%; animation-delay: -8s; }

            @keyframes float {
                0% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
                50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
                100% { transform: translateY(0px) rotate(360deg); opacity: 0.7; }
            }

            /* Glassmorphism Cards */
            .glass-card {
                background: var(--glass-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--glass-border);
                border-radius: 20px;
                box-shadow: var(--shadow-light);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .glass-card:hover {
                transform: translateY(-5px);
                box-shadow: var(--shadow-heavy);
                border-color: rgba(255, 255, 255, 0.3);
            }

            /* Main Container */
            .quiz-container {
                max-width: 900px;
                margin: 0 auto;
                padding: 20px;
                position: relative;
                z-index: 1;
            }

            /* Header Styles */
            .quiz-header {
                text-align: center;
                padding: 40px 30px;
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }

            .header-content {
                position: relative;
                z-index: 2;
            }

            .quiz-icon {
                font-size: 4rem;
                margin-bottom: 20px;
                animation: bounce 2s infinite;
            }

            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }

            .quiz-title {
                font-size: 2.5rem;
                font-weight: 700;
                background: var(--gradient-primary);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 10px;
            }

            .quiz-subtitle {
                font-size: 1.1rem;
                opacity: 0.8;
                margin-bottom: 30px;
            }

            /* Advanced Progress Bar */
            .progress-container {
                position: relative;
                margin-top: 30px;
            }

            .progress-track {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }

            .progress-fill {
                height: 100%;
                background: var(--gradient-primary);
                border-radius: 10px;
                width: 0%;
                transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .progress-glow {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            .progress-text {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-top: 15px;
                font-size: 1.1rem;
                font-weight: 600;
            }

            .current-question {
                color: var(--primary-light);
                font-size: 1.3rem;
            }

            .separator {
                margin: 0 10px;
                opacity: 0.6;
            }

            /* Question Styles */
            .question-wrapper {
                margin-bottom: 30px;
            }

            .question-card {
                padding: 40px;
                margin-bottom: 20px;
                position: relative;
                overflow: hidden;
            }

            .slide-in {
                animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .question-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 25px;
            }

            .question-number {
                background: var(--gradient-primary);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 0.9rem;
            }

            .question-type-badge {
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: 500;
                text-transform: capitalize;
            }

            .question-type-badge.multiple-choice {
                background: rgba(16, 185, 129, 0.2);
                color: var(--success-color);
                border: 1px solid rgba(16, 185, 129, 0.3);
            }

            .question-type-badge.open-ended {
                background: rgba(245, 158, 11, 0.2);
                color: var(--warning-color);
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .question-text {
                font-size: 1.4rem;
                font-weight: 600;
                line-height: 1.6;
                margin-bottom: 25px;
                color: var(--vscode-foreground, #ffffff);
            }

            /* Code Snippet Styles */
            .code-snippet-container {
                margin: 25px 0;
                border-radius: 15px;
                overflow: hidden;
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
            }

            .code-header {
                display: flex;
                align-items: center;
                padding: 15px 20px;
                background: rgba(0, 0, 0, 0.2);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .code-dots {
                display: flex;
                gap: 8px;
                margin-right: 15px;
            }

            .dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
            }

            .dot.red { background: #ff5f57; }
            .dot.yellow { background: #ffbd2e; }
            .dot.green { background: #28ca42; }

            .code-title {
                font-size: 0.9rem;
                opacity: 0.8;
            }

            .code-snippet {
                padding: 20px;
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                font-size: 0.9rem;
                line-height: 1.6;
                color: #e1e5e9;
                overflow-x: auto;
                margin: 0;
            }

            /* Options Grid */
            .options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
                margin: 25px 0;
            }

            .option-card {
                position: relative;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }

            .option-card:hover {
                transform: translateY(-3px);
                border-color: var(--primary-light);
                background: rgba(255, 255, 255, 0.1);
            }

            .option-card.selected {
                border-color: var(--primary-color);
                background: rgba(212, 175, 55, 0.2);
                transform: translateY(-3px);
            }

            .option-card.correct {
                border-color: var(--success-color);
                background: rgba(16, 185, 129, 0.2);
                animation: correctPulse 0.6s ease-out;
            }

            .option-card.incorrect {
                border-color: var(--error-color);
                background: rgba(239, 68, 68, 0.2);
                animation: shake 0.6s ease-out;
            }

            @keyframes correctPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            .option-content {
                display: flex;
                align-items: center;
                gap: 15px;
                position: relative;
                z-index: 2;
            }

            .option-letter {
                width: 40px;
                height: 40px;
                background: var(--gradient-primary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                color: white;
                flex-shrink: 0;
            }

            .option-text {
                font-size: 1rem;
                line-height: 1.5;
            }

            .option-ripple {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.6s, height 0.6s;
            }

            .option-card:active .option-ripple {
                width: 300px;
                height: 300px;
            }

            /* Text Input */
            .text-input-container {
                position: relative;
                margin: 25px 0;
            }

            .modern-textarea {
                width: 100%;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                color: var(--vscode-foreground, #ffffff);
                font-size: 1rem;
                line-height: 1.6;
                resize: vertical;
                transition: all 0.3s ease;
            }

            .modern-textarea:focus {
                outline: none;
                border-color: var(--primary-color);
                background: rgba(255, 255, 255, 0.1);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
            }

            .input-focus-line {
                position: absolute;
                bottom: 0;
                left: 50%;
                width: 0;
                height: 2px;
                background: var(--gradient-primary);
                transition: all 0.3s ease;
                transform: translateX(-50%);
            }

            .modern-textarea:focus + .input-focus-line {
                width: 100%;
            }

            /* Modern Buttons */
            .modern-btn {
                position: relative;
                padding: 15px 30px;
                border: none;
                border-radius: 25px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                min-width: 150px;
            }

            .primary-btn {
                background: var(--gradient-primary);
                color: white;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35);
            }

            .primary-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(212, 175, 55, 0.55);
            }

            .primary-btn:active {
                transform: translateY(0);
            }

            .pulse {
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35); }
                50% { box-shadow: 0 4px 25px rgba(212, 175, 55, 0.7); }
                100% { box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35); }
            }

            .btn-ripple {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.6s, height 0.6s;
            }

            .modern-btn:active .btn-ripple {
                width: 300px;
                height: 300px;
            }

            .btn-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .question-actions {
                text-align: center;
                margin-top: 30px;
            }

            /* Explanation Panel */
            .explanation-panel {
                margin-top: 30px;
                padding: 25px;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 15px;
                transform: translateY(20px);
                opacity: 0;
                transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                max-height: 0;
                overflow: hidden;
            }

            .explanation-panel.show {
                transform: translateY(0);
                opacity: 1;
                max-height: 500px;
            }

            .ai-feedback {
                margin-top: 15px;
                padding: 12px;
                background: rgba(255, 215, 0, 0.1);
                border: 1px solid var(--primary-color);
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.4;
            }

            .explanation-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
            }

            .explanation-icon {
                font-size: 1.5rem;
            }

            .explanation-title {
                font-size: 1.2rem;
                font-weight: 600;
                color: var(--success-color);
            }

            .explanation-content {
                line-height: 1.6;
                color: var(--vscode-foreground, #ffffff);
            }

            /* Quiz Complete */
            .quiz-complete {
                text-align: center;
                padding: 60px 40px;
                display: none;
                position: relative;
                overflow: hidden;
            }

            .completion-animation {
                position: relative;
                margin-bottom: 30px;
            }

            .trophy-icon {
                font-size: 5rem;
                animation: trophyBounce 1s ease-out;
            }

            @keyframes trophyBounce {
                0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                50% { transform: scale(1.2) rotate(-90deg); opacity: 1; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }

            .celebration-particles {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .particle {
                position: absolute;
                width: 10px;
                height: 10px;
                background: var(--gradient-primary);
                border-radius: 50%;
                animation: explode 1.5s ease-out infinite;
            }

            .particle:nth-child(1) { animation-delay: 0.1s; transform: rotate(0deg) translateX(50px); }
            .particle:nth-child(2) { animation-delay: 0.2s; transform: rotate(72deg) translateX(50px); }
            .particle:nth-child(3) { animation-delay: 0.3s; transform: rotate(144deg) translateX(50px); }
            .particle:nth-child(4) { animation-delay: 0.4s; transform: rotate(216deg) translateX(50px); }
            .particle:nth-child(5) { animation-delay: 0.5s; transform: rotate(288deg) translateX(50px); }

            @keyframes explode {
                0% { opacity: 1; transform: scale(0); }
                50% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(0); }
            }

            .completion-title {
                font-size: 2.5rem;
                font-weight: 700;
                background: var(--gradient-primary);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 20px;
            }

            .score-display {
                font-size: 3rem;
                font-weight: 800;
                background: var(--gradient-success);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 20px 0;
            }

            .completion-message {
                font-size: 1.2rem;
                opacity: 0.9;
                margin-bottom: 30px;
            }

            /* Floating Action Button */
            .fab-container {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 1000;
            }

            .fab {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: var(--gradient-primary);
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(212, 175, 55, 0.35);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .fab:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 30px rgba(212, 175, 55, 0.55);
            }

            .fab-icon {
                transition: transform 0.3s ease;
            }

            .fab:hover .fab-icon {
                transform: rotate(180deg);
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .quiz-container {
                    padding: 15px;
                }

                .quiz-title {
                    font-size: 2rem;
                }

                .question-card {
                    padding: 25px;
                }

                .options-grid {
                    grid-template-columns: 1fr;
                }

                .fab-container {
                    bottom: 20px;
                    right: 20px;
                }
            }
        `;
    }

    /**
     * Additional styles for explanation panel
     */
    private getExplanationStyles(): string {
        return `
            .explanation-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }

            .explanation-header {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 28px;
                margin-bottom: 20px;
                text-align: left;
            }

            .header-icon {
                font-size: 4rem;
                animation: bounce 2s infinite;
            }

            .header-content h1 {
                font-size: 2.1rem;
                font-weight: 700;
                background: var(--gradient-primary);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 6px;
            }

            .header-subtitle {
                font-size: 1.1rem;
                opacity: 0.8;
            }

            .overview-card {
                padding: 22px;
                margin-bottom: 20px;
            }

            .clarify-card {
                padding: 22px;
                margin-top: 10px;
            }

            .clarify-inputs {
                display: flex;
                gap: 10px;
                align-items: flex-start;
                margin-top: 10px;
                flex-wrap: wrap;
            }

            .clarify-results {
                margin-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .clarify-item {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px;
                line-height: 1.5;
            }

            .chat-list .clarify-item.user {
                border-color: rgba(212, 175, 55, 0.5);
                background: rgba(212, 175, 55, 0.1);
            }

            .chat-list .clarify-item.ai {
                border-color: rgba(16, 185, 129, 0.5);
                background: rgba(16, 185, 129, 0.08);
            }

            .card-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 12px;
            }

            .card-icon {
                font-size: 1.8rem;
            }

            .card-header h2 {
                font-size: 1.3rem;
                font-weight: 600;
            }

            .overview-text {
                font-size: 1rem;
                line-height: 1.6;
                opacity: 0.9;
            }

            /* Stats Dashboard */
            .stats-dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }

            .stat-card {
                padding: 22px 16px;
                text-align: center;
                animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                animation-delay: var(--delay, 0s);
                animation-fill-mode: both;
            }

            .stat-icon {
                font-size: 2rem;
                margin-bottom: 10px;
            }

            .stat-number {
                font-size: 2.2rem;
                font-weight: 800;
                background: var(--gradient-primary);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 8px;
            }

            .stat-label {
                font-size: 0.85rem;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            /* Line Explanations Section */
            .line-explanations-section {
                margin-top: 20px;
            }

            .section-header {
                padding: 20px;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 12px;
            }

            .section-header h2 {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 1.4rem;
                font-weight: 600;
            }

            .section-icon {
                font-size: 1.5rem;
            }

            .filter-tabs {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .filter-tab {
                padding: 8px 16px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.05);
                border-radius: 20px;
                color: var(--vscode-foreground, #ffffff);
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .filter-tab:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .filter-tab.active {
                background: var(--gradient-primary);
                border-color: var(--primary-color);
                color: white;
            }

            .line-explanations {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .line-explanation-card {
                padding: 18px;
                cursor: pointer;
                position: relative;
                overflow: hidden;
                animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                animation-delay: var(--delay, 0s);
                animation-fill-mode: both;
            }

            .line-explanation-card:hover {
                transform: translateX(10px);
            }

            .line-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }

            .line-number-badge {
                width: 34px;
                height: 34px;
                background: var(--gradient-primary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                color: white;
                font-size: 0.85rem;
            }

            .category-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 500;
                text-transform: capitalize;
            }

            .category-badge.declaration {
                background: rgba(16, 185, 129, 0.2);
                color: var(--success-color);
                border: 1px solid rgba(16, 185, 129, 0.3);
            }

            .category-badge.assignment {
                background: rgba(245, 158, 11, 0.2);
                color: var(--warning-color);
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .category-badge.function-call {
                background: rgba(99, 102, 241, 0.2);
                color: var(--primary-light);
                border: 1px solid rgba(99, 102, 241, 0.3);
            }

            .category-badge.control-flow {
                background: rgba(239, 68, 68, 0.2);
                color: var(--error-color);
                border: 1px solid rgba(239, 68, 68, 0.3);
            }

            .category-badge.comment {
                background: rgba(156, 163, 175, 0.2);
                color: #9ca3af;
                border: 1px solid rgba(156, 163, 175, 0.3);
            }

            .category-badge.other {
                background: rgba(236, 72, 153, 0.2);
                color: var(--secondary-color);
                border: 1px solid rgba(236, 72, 153, 0.3);
            }

            .importance-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-left: auto;
            }

            .importance-indicator.high {
                background: var(--error-color);
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
            }

            .importance-indicator.medium {
                background: var(--warning-color);
                box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
            }

            .importance-indicator.low {
                background: var(--success-color);
                box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
            }

            .line-code-container {
                margin: 15px 0;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                overflow: hidden;
            }

            .line-code {
                padding: 15px 20px;
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                font-size: 0.9rem;
                line-height: 1.5;
                color: #e1e5e9;
                margin: 0;
                overflow-x: auto;
            }

            .line-explanation-text {
                font-size: 1rem;
                line-height: 1.6;
                opacity: 0.9;
            }

            .hover-effect {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                transition: left 0.5s ease;
            }

            .line-explanation-card:hover .hover-effect {
                left: 100%;
            }

            /* Responsive Design for Explanation */
            @media (max-width: 768px) {
                .explanation-container {
                    padding: 15px;
                }

                .explanation-header {
                    flex-direction: column;
                    text-align: center;
                    padding: 30px 20px;
                }

                .stats-dashboard {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }

                .section-header {
                    flex-direction: column;
                    align-items: stretch;
                }

                .filter-tabs {
                    justify-content: center;
                }

                .line-explanation-card {
                    padding: 20px;
                }

                .line-header {
                    flex-wrap: wrap;
                }
            }
        `;
    }

    /**
     * Modern JavaScript for quiz functionality with animations
     */
    private getModernQuizJavaScript(quiz: Quiz): string {
        return `
            const vscode = acquireVsCodeApi();
            let currentQuestionIndex = 0;
            let selectedOption = null;
            let score = 0;
            let isSubmitting = false;
            const quiz = ${JSON.stringify(quiz)};
            
            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                updateProgressBar();
                animateStatsCounters();
            });

            // Listen for AI evaluation results from the extension
            window.addEventListener('message', (event) => {
                const message = event.data || {};
                if (message.command === 'shortAnswerEvaluation') {
                    const { questionId, result } = message;
                    const question = quiz.questions[currentQuestionIndex];
                    const submitBtn = document.querySelector('.modern-btn');
                    
                    // Remove loading state
                    if (submitBtn) {
                        submitBtn.querySelector('.btn-loading').style.opacity = '0';
                        submitBtn.querySelector('.btn-text').style.opacity = '1';
                    }
                    
                    // Handle the AI evaluation result
                    const score_pct = Math.round((result.score || 0) * 100);
                    const verdict = result.verdict || 'incorrect';
                    
                    if (verdict === 'correct' || score_pct >= 70) {
                        score++;
                        playSuccessAnimation();
                    } else if (verdict === 'partial' || score_pct >= 30) {
                        playSuccessAnimation(); // Still positive feedback for partial credit
                    } else {
                        playErrorAnimation();
                    }
                    
                    // Show explanation with AI feedback
                    const explanation = document.getElementById('explanation-' + questionId);
                    if (explanation) {
                        const feedbackDiv = document.createElement('div');
                        feedbackDiv.className = 'ai-feedback';
                        feedbackDiv.innerHTML = '<strong>AI Evaluation:</strong> ' + verdict.toUpperCase() + ' (' + score_pct + '%)<br/>' + (result.feedback || '');
                        explanation.appendChild(feedbackDiv);
                        explanation.classList.add('show');
                    }
                    
                    // Update button for next action
                    if (currentQuestionIndex < quiz.questions.length - 1) {
                        submitBtn.querySelector('.btn-text').textContent = 'Next Question →';
                        submitBtn.onclick = () => nextQuestion();
                    } else {
                        submitBtn.querySelector('.btn-text').textContent = 'Finish Quiz 🎉';
                        submitBtn.onclick = () => finishQuiz();
                    }
                    
                    isSubmitting = false;
                }
            });

            function selectOption(optionIndex) {
                if (isSubmitting) return;
                
                const options = document.querySelectorAll('.option-card');
                options.forEach(opt => opt.classList.remove('selected'));
                options[optionIndex].classList.add('selected');
                selectedOption = options[optionIndex].dataset.option;
                
                // Add ripple effect
                const ripple = options[optionIndex].querySelector('.option-ripple');
                ripple.style.width = '300px';
                ripple.style.height = '300px';
                setTimeout(() => {
                    ripple.style.width = '0';
                    ripple.style.height = '0';
                }, 600);
            }
            
            async function submitAnswer(questionId) {
                if (isSubmitting) return;
                
                const question = quiz.questions[currentQuestionIndex];
                let userAnswer = selectedOption;
                
                if (question.type === 'open-ended') {
                    userAnswer = document.getElementById('textAnswer').value.trim();
                }
                
                if (!userAnswer) {
                    showNotification('Please provide an answer before submitting.', 'warning');
                    return;
                }
                
                isSubmitting = true;
                const submitBtn = document.querySelector('.modern-btn');
                
                // Show loading state
                submitBtn.querySelector('.btn-text').style.opacity = '0';
                submitBtn.querySelector('.btn-loading').style.opacity = '1';
                
                if (question.type === 'open-ended') {
                    // Offload to extension for AI evaluation
                    vscode.postMessage({ command: 'submitAnswer', questionId, answer: userAnswer });
                } else {
                    // Simulate processing time for better UX
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const isCorrect = userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
                    if (isCorrect) {
                        score++;
                        playSuccessAnimation();
                    } else {
                        playErrorAnimation();
                    }
                    // Visual feedback for MCQ
                    const options = document.querySelectorAll('.option-card');
                    options.forEach(opt => {
                        if (opt.dataset.option === question.correctAnswer) {
                            opt.classList.add('correct');
                        } else if (opt.dataset.option === userAnswer && !isCorrect) {
                            opt.classList.add('incorrect');
                        }
                    });
                    // Show explanation
                    const explanation = document.getElementById('explanation-' + questionId);
                    explanation.classList.add('show');
                    // Update button
                    submitBtn.querySelector('.btn-loading').style.opacity = '0';
                    submitBtn.querySelector('.btn-text').style.opacity = '1';
                    if (currentQuestionIndex < quiz.questions.length - 1) {
                        submitBtn.querySelector('.btn-text').textContent = 'Next Question →';
                        submitBtn.onclick = () => nextQuestion();
                    } else {
                        submitBtn.querySelector('.btn-text').textContent = 'Finish Quiz 🎉';
                        submitBtn.onclick = () => finishQuiz();
                    }
                    isSubmitting = false;
                }
            }
            
            function nextQuestion() {
                // Slide out current question
                const currentCard = document.querySelector('.question-card');
                currentCard.style.transform = 'translateX(-100%)';
                currentCard.style.opacity = '0';
                
                setTimeout(() => {
                    currentQuestionIndex++;
                    updateProgressBar();
                    showQuestion(currentQuestionIndex);
                }, 300);
            }
            
            function showQuestion(index) {
                const question = quiz.questions[index];
                document.getElementById('currentQuestion').textContent = index + 1;
                document.getElementById('questionContainer').innerHTML = generateQuestionHTML(question, index);
                selectedOption = null;
                isSubmitting = false;
                
                // Animate in new question
                setTimeout(() => {
                    const newCard = document.querySelector('.question-card');
                    newCard.style.transform = 'translateX(0)';
                    newCard.style.opacity = '1';
                }, 50);
            }
            
            function generateQuestionHTML(question, index) {
                let optionsHTML = '';
                
                if (question.type === 'multiple-choice' && question.options) {
                    optionsHTML = \`
                        <div class="options-grid">
                            \${question.options.map((option, optionIndex) => \`
                                <div class="option-card" onclick="selectOption(\${optionIndex})" data-option="\${option}">
                                    <div class="option-content">
                                        <div class="option-letter">\${String.fromCharCode(65 + optionIndex)}</div>
                                        <div class="option-text">\${option}</div>
                                    </div>
                                    <div class="option-ripple"></div>
                                </div>
                            \`).join('')}
                        </div>
                    \`;
                } else {
                    optionsHTML = \`
                        <div class="text-input-container">
                            <textarea class="modern-textarea" id="textAnswer" placeholder="Share your thoughts..." rows="4"></textarea>
                            <div class="input-focus-line"></div>
                        </div>
                    \`;
                }
                
                return \`
                    <div class="question-card glass-card slide-in">
                        <div class="question-header">
                            <div class="question-number">Q\${index + 1}</div>
                            <div class="question-type-badge \${question.type}">\${question.type.replace('-', ' ')}</div>
                        </div>
                        
                        <div class="question-content">
                            <h3 class="question-text">\${question.question}</h3>
                            
                            \${question.codeSnippet ? \`
                                <div class="code-snippet-container">
                                    <div class="code-header">
                                        <div class="code-dots">
                                            <span class="dot red"></span>
                                            <span class="dot yellow"></span>
                                            <span class="dot green"></span>
                                        </div>
                                        <span class="code-title">Code Snippet</span>
                                    </div>
                                    <pre class="code-snippet"><code>\${escapeHtml(question.codeSnippet)}</code></pre>
                                </div>
                            \` : ''}
                            
                            \${optionsHTML}
                        </div>
                        
                        <div class="question-actions">
                            <button class="modern-btn primary-btn" onclick="submitAnswer('\${question.id}')">
                                <span class="btn-text">Submit Answer</span>
                                <div class="btn-loading">
                                    <div class="loading-spinner"></div>
                                </div>
                                <div class="btn-ripple"></div>
                            </button>
                        </div>
                        
                        <div class="explanation-panel" id="explanation-\${question.id}">
                            <div class="explanation-header">
                                <span class="explanation-icon">💡</span>
                                <span class="explanation-title">Explanation</span>
                            </div>
                            <div class="explanation-content">
                                \${question.explanation}
                            </div>
                        </div>
                    </div>
                \`;
            }
            
            function finishQuiz() {
                const percentage = Math.round((score / quiz.questions.length) * 100);
                
                // Hide current content with animation
                document.getElementById('questionContainer').style.transform = 'translateY(-50px)';
                document.getElementById('questionContainer').style.opacity = '0';
                document.querySelector('.quiz-header').style.transform = 'translateY(-50px)';
                document.querySelector('.quiz-header').style.opacity = '0';
                
                setTimeout(() => {
                    document.getElementById('scoreDisplay').textContent = \`\${score}/\${quiz.questions.length} (\${percentage}%)\`;
                    document.getElementById('questionContainer').style.display = 'none';
                    document.getElementById('quizComplete').style.display = 'block';
                    document.querySelector('.quiz-header').style.display = 'none';
                    
                    // Trigger celebration animation
                    setTimeout(() => {
                        document.querySelector('.quiz-complete').style.transform = 'scale(1)';
                        document.querySelector('.quiz-complete').style.opacity = '1';
                    }, 100);
                }, 500);
            }
            
            function updateProgressBar() {
                const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
                const progressFill = document.getElementById('progressFill');
                progressFill.style.width = progress + '%';
                
                // Add pulse effect when progress updates
                progressFill.style.transform = 'scaleY(1.2)';
                setTimeout(() => {
                    progressFill.style.transform = 'scaleY(1)';
                }, 200);
            }
            
            function restartQuiz() {
                // Add exit animation
                document.querySelector('.quiz-complete').style.transform = 'scale(0.8)';
                document.querySelector('.quiz-complete').style.opacity = '0';
                
                setTimeout(() => {
                    vscode.postMessage({
                        command: 'restartQuiz'
                    });
                }, 300);
            }
            
            function toggleTheme() {
                // Theme toggle functionality
                document.body.classList.toggle('dark-theme');
                showNotification('Theme toggled!', 'info');
            }
            
            function playSuccessAnimation() {
                // Create success particles
                createParticles('success');
                showNotification('Correct! 🎉', 'success');
            }
            
            function playErrorAnimation() {
                // Shake animation for incorrect answer
                document.querySelector('.question-card').style.animation = 'shake 0.6s ease-out';
                setTimeout(() => {
                    document.querySelector('.question-card').style.animation = '';
                }, 600);
                showNotification('Not quite right, but keep learning! 💪', 'info');
            }
            
            function createParticles(type) {
                const colors = type === 'success' ? ['#10b981', '#34d399', '#6ee7b7'] : ['#ef4444', '#f87171', '#fca5a5'];
                
                for (let i = 0; i < 10; i++) {
                    const particle = document.createElement('div');
                    particle.style.position = 'fixed';
                    particle.style.width = '6px';
                    particle.style.height = '6px';
                    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    particle.style.borderRadius = '50%';
                    particle.style.pointerEvents = 'none';
                    particle.style.zIndex = '9999';
                    
                    const startX = window.innerWidth / 2;
                    const startY = window.innerHeight / 2;
                    particle.style.left = startX + 'px';
                    particle.style.top = startY + 'px';
                    
                    document.body.appendChild(particle);
                    
                    const angle = (Math.PI * 2 * i) / 10;
                    const velocity = 100 + Math.random() * 100;
                    const endX = startX + Math.cos(angle) * velocity;
                    const endY = startY + Math.sin(angle) * velocity;
                    
                    particle.animate([
                        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                        { transform: \`translate(\${endX - startX}px, \${endY - startY}px) scale(0)\`, opacity: 0 }
                    ], {
                        duration: 1000,
                        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }).onfinish = () => particle.remove();
                }
            }
            
            function showNotification(message, type = 'info') {
                const notification = document.createElement('div');
                notification.className = \`notification \${type}\`;
                notification.textContent = message;
                notification.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: 10px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    transform: translateX(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                \`;
                
                if (type === 'success') {
                    notification.style.borderColor = 'var(--success-color)';
                } else if (type === 'warning') {
                    notification.style.borderColor = 'var(--warning-color)';
                }
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.transform = 'translateX(0)';
                }, 100);
                
                setTimeout(() => {
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }
            
            function animateStatsCounters() {
                const counters = document.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    const target = parseInt(counter.dataset.target);
                    let current = 0;
                    const increment = target / 50;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            counter.textContent = target;
                            clearInterval(timer);
                        } else {
                            counter.textContent = Math.floor(current);
                        }
                    }, 30);
                });
            }
            
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
        `;
    }

    /**
     * Modern JavaScript for explanation functionality
     */
    private getModernExplanationJavaScript(): string {
        return `
            const vscode = acquireVsCodeApi();
            
            document.addEventListener('DOMContentLoaded', function() {
                animateStatsCounters();
                setupIntersectionObserver();
                setupClarifyBox();
            });
            
            function highlightLine(lineNumber) {
                // Add highlight effect
                const cards = document.querySelectorAll('.line-explanation-card');
                cards.forEach(card => card.classList.remove('highlighted'));
                
                const targetCard = document.querySelector(\`[onclick="highlightLine(\${lineNumber})"]\`);
                if (targetCard) {
                    targetCard.classList.add('highlighted');
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                vscode.postMessage({
                    command: 'highlightLine',
                    lineNumber: lineNumber
                });
                
                showNotification(\`Line \${lineNumber} highlighted in editor\`, 'info');
            }
            
            
            function animateStatsCounters() {
                const counters = document.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    const raw = counter.dataset.target;
                    let target = Number(raw);
                    if (!Number.isFinite(target)) target = 0;
                    // Defensive: if zero, still display 0 immediately
                    if (target <= 0) {
                        counter.textContent = '0';
                        return;
                    }
                    let current = 0;
                    const increment = Math.max(1, Math.floor(target / 50));
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            counter.textContent = String(target);
                            clearInterval(timer);
                        } else {
                            counter.textContent = String(Math.floor(current));
                        }
                    }, 30);
                });
            }
            
            function setupIntersectionObserver() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.transform = 'translateX(0)';
                            entry.target.style.opacity = '1';
                        }
                    });
                }, { threshold: 0.1 });
                
                document.querySelectorAll('.line-explanation-card').forEach(card => {
                    observer.observe(card);
                });
            }
            
            function setupClarifyBox() {
                const input = document.getElementById('clarifyInput');
                const btn = document.getElementById('clarifyBtn');
                const results = document.getElementById('clarifyResults');
                if (!input || !btn || !results) return;

                let pendingTimer = null;
                let lastPendingId = null;

                const submitClarify = async () => {
                    const question = input.value.trim();
                    if (!question) {
                        showNotification('Please type a question to clarify.', 'warning');
                        return;
                    }
                    btn.querySelector('.btn-text').style.opacity = '0';
                    btn.querySelector('.btn-loading').style.opacity = '1';
                    // Add a pending placeholder so users see immediate feedback
                    lastPendingId = 'pending-' + Date.now();
                    const pending = document.createElement('div');
                    pending.className = 'clarify-item user';
                    pending.id = lastPendingId;
                    pending.textContent = question;
                    results.prepend(pending);
                    try {
                        vscode.postMessage({ command: 'clarify', question });
                        // Fallback timeout to restore button state and show error if no response
                        pendingTimer = setTimeout(() => {
                            btn.querySelector('.btn-loading').style.opacity = '0';
                            btn.querySelector('.btn-text').style.opacity = '1';
                            const item = document.getElementById(lastPendingId);
                            if (item) {
                                item.classList.add('ai');
                                item.textContent = 'No response received. Please try again.';
                            }
                        }, 15000);
                    } catch (e) {
                        showNotification('Failed to send clarification request.', 'warning');
                        const item = document.getElementById(lastPendingId);
                        if (item) {
                            item.classList.add('ai');
                            item.textContent = 'Failed to send clarification request.';
                        }
                    }
                };

                btn.addEventListener('click', submitClarify);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitClarify();
                    }
                });

                window.addEventListener('message', event => {
                    const message = event.data || {};
                    if (message.command === 'shortAnswerEvaluation') {
                        const questionId = message.questionId;
                        const result = message.result || {};
                        const feedback = document.createElement('div');
                        feedback.className = 'clarify-item';
                        const pct = Math.round((Number(result.score) || 0) * 100);
                        const verdict = String(result.verdict || '').toUpperCase();
                        const text = String(result.feedback || '');
                        feedback.innerHTML = '<strong>Evaluation:</strong> ' + verdict + ' (score ' + pct + '%)<br/>' + text.replace(/\n/g,'<br/>');
                        const exp = document.getElementById('explanation-' + questionId);
                        if (exp) {
                            exp.appendChild(feedback);
                            exp.classList.add('show');
                        } else {
                            document.body.appendChild(feedback);
                        }
                        return;
                    }
                    if (message.command === 'clarifyAck') {
                        // Can add any additional UX here if needed
                        return;
                    }
                    if (message.command === 'clarifyResult') {
                        if (pendingTimer) {
                            clearTimeout(pendingTimer);
                            pendingTimer = null;
                        }
                        btn.querySelector('.btn-loading').style.opacity = '0';
                        btn.querySelector('.btn-text').style.opacity = '1';
                        if (message.error) {
                            showNotification('Clarification failed: ' + message.error, 'warning');
                            const item = document.getElementById(lastPendingId);
                            if (item) {
                                item.classList.add('ai');
                                item.textContent = 'Clarification failed: ' + message.error;
                            }
                            return;
                        }
                        let item = document.getElementById(lastPendingId);
                        // Convert pending user bubble to AI bubble below it
                        if (item) {
                            const ai = document.createElement('div');
                            ai.className = 'clarify-item ai';
                            ai.innerHTML = String(message.answer || '').replace(/\n/g, '<br/>');
                            item.insertAdjacentElement('afterend', ai);
                        } else {
                            const ai = document.createElement('div');
                            ai.className = 'clarify-item ai';
                            ai.innerHTML = String(message.answer || '').replace(/\n/g, '<br/>');
                            results.prepend(ai);
                        }
                        input.value = '';
                    }
                });
            }

            function showNotification(message, type = 'info') {
                const notification = document.createElement('div');
                notification.className = \`notification \${type}\`;
                notification.textContent = message;
                notification.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: 10px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    transform: translateX(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                \`;
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.transform = 'translateX(0)';
                }, 100);
                
                setTimeout(() => {
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }
        `;
    }

    // Keep existing helper methods
    private handleQuizAnswer(panel: vscode.WebviewPanel, questionId: string, answer: string, quiz: Quiz): void {
        const question = quiz.questions.find(q => q.id === questionId);
        if (!question) {
            return;
        }
        console.log(`User answered question ${questionId}: ${answer}`);
        if (question.type === 'open-ended') {
            const codeSnippet = question.codeSnippet || '';
            const languageGuess = 'JavaScript';
            const aiServiceModule = require('./aiService');
            const aiService = new aiServiceModule.AIService();
            aiService.evaluateShortAnswer({
                question: question.question,
                correctAnswer: question.correctAnswer,
                userAnswer: answer,
                codeSnippet,
                language: languageGuess
            }).then((result: any) => {
                panel.webview.postMessage({
                    command: 'shortAnswerEvaluation',
                    questionId,
                    result
                });
            }).catch((err: any) => {
                panel.webview.postMessage({
                    command: 'shortAnswerEvaluation',
                    questionId,
                    result: { score: 0, verdict: 'incorrect', feedback: String(err) }
                });
            });
        }
    }

    private showNextQuestion(panel: vscode.WebviewPanel, questionIndex: number, quiz: Quiz): void {
        if (questionIndex < quiz.questions.length) {
            console.log(`Showing question ${questionIndex + 1}`);
        }
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}