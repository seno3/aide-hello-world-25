/**
 * UI Manager Module
 * 
 * This module handles creating and managing WebView panels for displaying
 * quizzes and code explanations with clean, minimal UI.
 */

import * as vscode from 'vscode';
import { Quiz, QuizQuestion } from './quizGenerator';
import { CodeExplanation } from './codeExplainer';

// Define interfaces for mind map data structure
export interface MindMapNode {
    id: string;
    label: string;
    type: 'main' | 'category' | 'item' | 'detail';
    children?: MindMapNode[];
    color?: string;
    size?: number;
    x?: number;
    y?: number;
}

export interface MindMapData {
    title: string;
    rootNode: MindMapNode;
    nodes: MindMapNode[];
    connections: Array<{from: string, to: string}>;
}

export class UIManager {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Show a quiz in a WebView panel
     */
    async showQuizPanel(quiz: Quiz, originalCode: string): Promise<void> {
        // Create and show a new WebView panel
        const panel = vscode.window.createWebviewPanel(
            'codeQuiz', // Panel type identifier
            'Code Quiz', // Panel title
            vscode.ViewColumn.Two, // Show in second column
            {
                enableScripts: true, // Allow JavaScript in the WebView
                retainContextWhenHidden: true, // Keep panel state when hidden
                localResourceRoots: [this.context.extensionUri] // Security setting
            }
        );

        // Set the HTML content for the quiz
        panel.webview.html = this.generateQuizHTML(quiz, originalCode);

        // Handle messages from the WebView (user interactions)
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
                        panel.webview.html = this.generateQuizHTML(quiz, originalCode);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * Show a code explanation in a WebView panel
     */
    async showExplanationPanel(explanation: CodeExplanation, originalCode: string): Promise<void> {
        // Create and show a new WebView panel
        const panel = vscode.window.createWebviewPanel(
            'codeExplanation', // Panel type identifier
            'Code Explanation', // Panel title
            vscode.ViewColumn.Two, // Show in second column
            {
                enableScripts: true, // Allow JavaScript in the WebView
                retainContextWhenHidden: true, // Keep panel state when hidden
                localResourceRoots: [this.context.extensionUri] // Security setting
            }
        );

        // Set the HTML content for the explanation
        panel.webview.html = this.generateExplanationHTML(explanation, originalCode);

        // Handle messages from the WebView (user interactions)
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'highlightLine':
                        // TODO: Highlight the corresponding line in the editor
                        console.log('Highlight line:', message.lineNumber);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * Show a mind map in a WebView panel
     */
    async showMindMapPanel(mindMapData: MindMapData, originalCode: string): Promise<void> {
        // Create and show a new WebView panel
        const panel = vscode.window.createWebviewPanel(
            'codeMindMap', // Panel type identifier
            'Project Mind Map', // Panel title
            vscode.ViewColumn.Two, // Show in second column
            {
                enableScripts: true, // Allow JavaScript in the WebView
                retainContextWhenHidden: true, // Keep panel state when hidden
                localResourceRoots: [this.context.extensionUri] // Security setting
            }
        );

        // Set the HTML content for the mind map
        panel.webview.html = this.generateMindMapHTML(mindMapData, originalCode);

        // Handle messages from the WebView (user interactions)
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'nodeClicked':
                        console.log('Node clicked:', message.nodeId);
                        break;
                    case 'exportMindMap':
                        this.exportMindMap(panel, mindMapData);
                        break;
                    case 'centerView':
                        console.log('Center view requested');
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * Generate HTML content for the quiz panel
     */
    private generateQuizHTML(quiz: Quiz, originalCode: string): string {
        const firstQuestion = quiz.questions[0];
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Quiz</title>
            <style>
                ${this.getCommonStyles()}
                
                .quiz-container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 30px 20px;
                    animation: fadeInUp 0.8s ease-out;
                }
                
                .quiz-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.05) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                }
                
                .quiz-header h1 {
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 20px;
                }
                
                .quiz-progress {
                    background: rgba(255, 255, 255, 0.1);
                    height: 12px;
                    border-radius: 8px;
                    margin: 20px 0;
                    overflow: hidden;
                    position: relative;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .quiz-progress::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    animation: shimmer 2s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .quiz-progress-fill {
                    background: linear-gradient(45deg, var(--vscode-progressBar-foreground), var(--vscode-textLink-foreground));
                    height: 100%;
                    border-radius: 8px;
                    width: 0%;
                    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                
                .quiz-progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    border-radius: 8px;
                }
                
                .question-counter {
                    font-size: 1.1em;
                    font-weight: 500;
                    margin-top: 15px;
                    color: var(--vscode-descriptionForeground);
                }
                
                .question-container {
                    margin-bottom: 40px;
                    padding: 30px;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.02) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                    animation: slideInFromRight 0.6s ease-out;
                    position: relative;
                }
                
                .question-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    border-radius: 16px 16px 0 0;
                }
                
                .question-text {
                    font-size: 1.3em;
                    margin-bottom: 25px;
                    font-weight: 600;
                    line-height: 1.5;
                    color: var(--vscode-foreground);
                }
                
                .code-snippet {
                    background: linear-gradient(135deg, var(--vscode-textCodeBlock-background) 0%, rgba(255,255,255,0.02) 100%);
                    padding: 20px;
                    border-radius: 12px;
                    margin: 20px 0;
                    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
                    font-size: 0.95em;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    overflow-x: auto;
                    white-space: pre;
                    position: relative;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }
                
                .code-snippet::before {
                    content: '</>';
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    font-size: 0.8em;
                    color: var(--vscode-textLink-foreground);
                    opacity: 0.6;
                }
                
                .options-container {
                    margin: 30px 0;
                    display: grid;
                    gap: 12px;
                }
                
                .option {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, var(--vscode-button-secondaryBackground) 0%, rgba(255,255,255,0.02) 100%);
                    border: 2px solid transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-weight: 500;
                    position: relative;
                    overflow: hidden;
                }
                
                .option::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    transform: scaleY(0);
                    transition: transform 0.3s ease;
                }
                
                .option:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                    transform: translateX(8px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }
                
                .option:hover::before {
                    transform: scaleY(1);
                }
                
                .option.selected {
                    background: linear-gradient(135deg, var(--vscode-button-background) 0%, rgba(255,255,255,0.1) 100%);
                    border-color: var(--vscode-button-foreground);
                    color: var(--vscode-button-foreground);
                    transform: translateX(12px);
                    animation: pulse 1.5s infinite;
                }
                
                .option.correct {
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    color: white;
                    transform: scale(1.02);
                }
                
                .option.correct::after {
                    content: '✓';
                    margin-left: auto;
                    font-size: 1.2em;
                    font-weight: bold;
                }
                
                .option.incorrect {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    opacity: 0.7;
                }
                
                .option.incorrect::after {
                    content: '✗';
                    margin-left: auto;
                    font-size: 1.2em;
                    font-weight: bold;
                }
                
                .text-input {
                    width: 100%;
                    padding: 16px 20px;
                    border: 2px solid var(--vscode-input-border);
                    border-radius: 12px;
                    background: linear-gradient(135deg, var(--vscode-input-background) 0%, rgba(255,255,255,0.02) 100%);
                    color: var(--vscode-input-foreground);
                    font-size: 1em;
                    margin: 15px 0;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    resize: vertical;
                    min-height: 80px;
                }
                
                .text-input:focus {
                    outline: none;
                    border-color: var(--vscode-textLink-foreground);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    transform: translateY(-2px);
                }
                
                .explanation {
                    margin-top: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, var(--vscode-editorInfo-background) 0%, rgba(255,255,255,0.05) 100%);
                    border-left: 4px solid var(--vscode-editorInfo-foreground);
                    border-radius: 12px;
                    display: none;
                    animation: fadeInUp 0.5s ease-out;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }
                
                .explanation strong {
                    color: var(--vscode-textLink-foreground);
                    font-size: 1.1em;
                }
                
                .quiz-complete {
                    text-align: center;
                    padding: 60px 20px;
                    display: none;
                    animation: fadeInUp 0.8s ease-out;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.05) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }
                
                .quiz-complete h2 {
                    font-size: 2.5em;
                    margin-bottom: 20px;
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .score-display {
                    font-size: 3em;
                    margin: 30px 0;
                    font-weight: 700;
                    background: linear-gradient(45deg, #22c55e, #16a34a);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .score-message {
                    font-size: 1.2em;
                    margin: 20px 0;
                    color: var(--vscode-descriptionForeground);
                }
                
                /* Quiz Responsive Design */
                @media (max-width: 768px) {
                    .quiz-container {
                        padding: 20px 15px;
                        max-width: 100%;
                    }
                    
                    .quiz-header {
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .quiz-header h1 {
                        font-size: 1.8em;
                    }
                    
                    .question-container {
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .question-text {
                        font-size: 1.1em;
                    }
                    
                    .code-snippet {
                        padding: 15px;
                        font-size: 0.9em;
                    }
                    
                    .option {
                        padding: 14px 16px;
                        margin: 8px 0;
                    }
                    
                    .text-input {
                        padding: 14px 16px;
                        min-height: 70px;
                    }
                    
                    .score-display {
                        font-size: 2.2em;
                    }
                }
                
                @media (max-width: 480px) {
                    .quiz-container {
                        padding: 15px 10px;
                    }
                    
                    .quiz-header {
                        padding: 15px;
                        margin-bottom: 25px;
                    }
                    
                    .quiz-header h1 {
                        font-size: 1.5em;
                    }
                    
                    .quiz-progress {
                        height: 10px;
                    }
                    
                    .question-container {
                        padding: 15px;
                        margin-bottom: 25px;
                    }
                    
                    .question-text {
                        font-size: 1em;
                    }
                    
                    .code-snippet {
                        padding: 12px;
                        font-size: 0.85em;
                    }
                    
                    .option {
                        padding: 12px 14px;
                        font-size: 0.9em;
                    }
                    
                    .option:hover {
                        transform: translateX(4px);
                    }
                    
                    .option.selected {
                        transform: translateX(6px);
                    }
                    
                    .text-input {
                        padding: 12px 14px;
                        min-height: 60px;
                        font-size: 0.9em;
                    }
                    
                    .quiz-complete {
                        padding: 40px 15px;
                    }
                    
                    .score-display {
                        font-size: 2em;
                    }
                    
                    .button-primary {
                        width: 100%;
                        margin: 10px 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="quiz-container">
                <div class="quiz-header">
                    <h1>${quiz.title}</h1>
                    <div class="quiz-progress">
                        <div class="quiz-progress-fill" id="progressFill"></div>
                    </div>
                    <div class="question-counter">Question <span id="currentQuestion">1</span> of ${quiz.totalQuestions}</div>
                </div>
                
                <div id="questionContainer">
                    ${this.generateQuestionHTML(firstQuestion, 0)}
                </div>
                
                <div class="quiz-complete" id="quizComplete">
                    <h2>🎉 Quiz Complete!</h2>
                    <div class="score-display" id="scoreDisplay"></div>
                    <p class="score-message">Great job learning about the code!</p>
                    <button class="button button-primary" onclick="restartQuiz()">Take Quiz Again</button>
                </div>
            </div>

            <script>
                ${this.getQuizJavaScript(quiz)}
            </script>
        </body>
        </html>`;
    }

    /**
     * Generate HTML for a single quiz question
     */
    private generateQuestionHTML(question: QuizQuestion, index: number): string {
        let optionsHTML = '';
        
        if (question.type === 'multiple-choice' && question.options) {
            optionsHTML = `
                <div class="options-container">
                    ${question.options.map((option, optionIndex) => `
                        <div class="option" onclick="selectOption(${optionIndex})" data-option="${option}">
                            ${option}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            optionsHTML = `
                <div class="options-container">
                    <textarea class="text-input" id="textAnswer" placeholder="Type your answer here..." rows="3"></textarea>
                </div>
            `;
        }

        return `
            <div class="question-container">
                <div class="question-text">${question.question}</div>
                ${question.codeSnippet ? `<div class="code-snippet">${question.codeSnippet}</div>` : ''}
                ${optionsHTML}
                <button class="button button-primary" onclick="submitAnswer('${question.id}')">Submit Answer</button>
                <div class="explanation" id="explanation-${question.id}">
                    <strong>Explanation:</strong><br>
                    ${question.explanation}
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML content for the explanation panel
     */
    private generateExplanationHTML(explanation: CodeExplanation, originalCode: string): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Explanation</title>
            <style>
                ${this.getCommonStyles()}
                
                .explanation-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 30px 20px;
                    animation: fadeInUp 0.8s ease-out;
                }
                
                .explanation-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.05) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                }
                
                .explanation-header h1 {
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 20px;
                }
                
                .overview {
                    background: linear-gradient(135deg, var(--vscode-editorInfo-background) 0%, rgba(255,255,255,0.05) 100%);
                    padding: 30px;
                    border-radius: 16px;
                    margin-bottom: 40px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                    position: relative;
                    animation: slideInFromRight 0.6s ease-out;
                }
                
                .overview::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(45deg, var(--vscode-editorInfo-foreground), var(--vscode-textLink-foreground));
                    border-radius: 16px 16px 0 0;
                }
                
                .overview h2 {
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 20px;
                    font-size: 1.5em;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .overview h2::before {
                    content: '📊';
                    font-size: 1.2em;
                }
                
                .overview p {
                    font-size: 1.1em;
                    line-height: 1.7;
                    color: var(--vscode-foreground);
                }
                
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                    margin: 30px 0;
                }
                
                .summary-item {
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.02) 100%);
                    padding: 25px 20px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }
                
                .summary-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }
                
                .summary-item:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
                }
                
                .summary-item:hover::before {
                    transform: scaleX(1);
                }
                
                .summary-number {
                    font-size: 2.5em;
                    font-weight: 700;
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    display: block;
                    margin-bottom: 8px;
                }
                
                .summary-item div:last-child {
                    font-weight: 500;
                    color: var(--vscode-descriptionForeground);
                    font-size: 0.95em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .line-explanations {
                    margin-top: 40px;
                }
                
                .line-explanations h2 {
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 25px;
                    font-size: 1.5em;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .line-explanations h2::before {
                    content: '🔍';
                    font-size: 1.2em;
                }
                
                .line-explanation {
                    display: flex;
                    margin: 20px 0;
                    padding: 20px;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.02) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
                }
                
                .line-explanation:hover {
                    background: var(--vscode-list-hoverBackground);
                    transform: translateX(8px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                }
                
                .line-number {
                    flex-shrink: 0;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    color: white;
                    border-radius: 12px;
                    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
                    font-weight: 600;
                    margin-right: 20px;
                    font-size: 0.9em;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                
                .line-code {
                    flex: 1;
                    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
                    background: linear-gradient(135deg, var(--vscode-textCodeBlock-background) 0%, rgba(255,255,255,0.02) 100%);
                    padding: 15px 20px;
                    border-radius: 12px;
                    margin-right: 20px;
                    overflow-x: auto;
                    white-space: pre;
                    font-size: 0.95em;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    position: relative;
                }
                
                .line-code::before {
                    content: '</>';
                    position: absolute;
                    top: 8px;
                    right: 12px;
                    font-size: 0.7em;
                    color: var(--vscode-textLink-foreground);
                    opacity: 0.4;
                }
                
                .line-explanation-text {
                    flex: 2;
                    padding: 5px 0;
                }
                
                .line-explanation-text > div:last-child {
                    font-size: 1.05em;
                    line-height: 1.6;
                    margin-top: 8px;
                }
                
                .importance-high {
                    border-left: 4px solid #ef4444;
                }
                
                .importance-high .line-number {
                    background: linear-gradient(45deg, #ef4444, #dc2626);
                }
                
                .importance-medium {
                    border-left: 4px solid #f59e0b;
                }
                
                .importance-medium .line-number {
                    background: linear-gradient(45deg, #f59e0b, #d97706);
                }
                
                .importance-low {
                    border-left: 4px solid var(--vscode-editorInfo-foreground);
                }
                
                .category-tag {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.8em;
                    font-weight: 600;
                    margin-bottom: 10px;
                    background: linear-gradient(45deg, var(--vscode-badge-background), rgba(255, 255, 255, 0.1));
                    color: var(--vscode-badge-foreground);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                /* Explanation/Overview Responsive Design */
                @media (max-width: 768px) {
                    .explanation-container {
                        padding: 20px 15px;
                        max-width: 100%;
                    }
                    
                    .explanation-header {
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .explanation-header h1 {
                        font-size: 1.8em;
                    }
                    
                    .overview {
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .summary-grid {
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 15px;
                    }
                    
                    .summary-item {
                        padding: 20px 15px;
                    }
                    
                    .summary-number {
                        font-size: 2em;
                    }
                    
                    .line-explanation {
                        flex-direction: column;
                        padding: 15px;
                        gap: 15px;
                    }
                    
                    .line-number {
                        width: 40px;
                        height: 40px;
                        margin-right: 0;
                        margin-bottom: 10px;
                        align-self: flex-start;
                    }
                    
                    .line-code {
                        margin-right: 0;
                        margin-bottom: 15px;
                        padding: 12px 15px;
                    }
                    
                    .line-explanation-text {
                        padding: 0;
                    }
                }
                
                @media (max-width: 480px) {
                    .explanation-container {
                        padding: 15px 10px;
                    }
                    
                    .explanation-header {
                        padding: 15px;
                        margin-bottom: 25px;
                    }
                    
                    .explanation-header h1 {
                        font-size: 1.5em;
                    }
                    
                    .overview {
                        padding: 15px;
                        margin-bottom: 25px;
                    }
                    
                    .overview h2 {
                        font-size: 1.3em;
                    }
                    
                    .overview p {
                        font-size: 1em;
                    }
                    
                    .summary-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                    }
                    
                    .summary-item {
                        padding: 15px 10px;
                    }
                    
                    .summary-number {
                        font-size: 1.8em;
                    }
                    
                    .summary-item div:last-child {
                        font-size: 0.85em;
                    }
                    
                    .line-explanation {
                        padding: 12px;
                    }
                    
                    .line-number {
                        width: 35px;
                        height: 35px;
                        font-size: 0.8em;
                    }
                    
                    .line-code {
                        padding: 10px 12px;
                        font-size: 0.85em;
                    }
                    
                    .line-explanation-text > div:last-child {
                        font-size: 0.95em;
                    }
                    
                    .category-tag {
                        padding: 4px 8px;
                        font-size: 0.7em;
                    }
                }
            </style>
        </head>
        <body>
            <div class="explanation-container">
                <div class="explanation-header">
                    <h1>${explanation.title}</h1>
                </div>
                
                <div class="overview">
                    <h2>Overview</h2>
                    <p>${explanation.overview}</p>
                </div>
                
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-number">${explanation.summary.totalLines}</div>
                        <div>Lines of Code</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">${explanation.summary.functions.length}</div>
                        <div>Functions</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">${explanation.summary.variables.length}</div>
                        <div>Variables</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">${explanation.summary.classes.length}</div>
                        <div>Classes</div>
                    </div>
                </div>
                
                <div class="line-explanations">
                    <h2>Line-by-Line Explanation</h2>
                    ${explanation.lineByLineExplanations.map(lineExp => `
                        <div class="line-explanation importance-${lineExp.importance}" onclick="highlightLine(${lineExp.lineNumber})">
                            <div class="line-number">${lineExp.lineNumber}</div>
                            <div class="line-code">${this.escapeHtml(lineExp.code)}</div>
                            <div class="line-explanation-text">
                                <div class="category-tag">${lineExp.category}</div>
                                <div>${lineExp.explanation}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function highlightLine(lineNumber) {
                    vscode.postMessage({
                        command: 'highlightLine',
                        lineNumber: lineNumber
                    });
                }
            </script>
        </body>
        </html>`;
    }

    /**
     * Generate HTML content for the mind map panel
     */
    private generateMindMapHTML(mindMapData: MindMapData, originalCode: string): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Project Mind Map</title>
            <style>
                ${this.getCommonStyles()}
                
                .mindmap-container {
                    width: 100%;
                    height: 100vh;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    position: relative;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.02) 100%);
                }
                
                .mindmap-header {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    z-index: 100;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.05) 100%);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .mindmap-title {
                    font-size: 1.5em;
                    font-weight: 700;
                    background: linear-gradient(45deg, var(--vscode-textLink-foreground), var(--vscode-button-background));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin: 0;
                }
                
                .mindmap-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                
                .control-button {
                    background: linear-gradient(135deg, var(--vscode-button-secondaryBackground) 0%, rgba(255,255,255,0.02) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 8px 12px;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                
                .control-button:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                
                #mindmapCanvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                    cursor: grab;
                }
                
                #mindmapCanvas:active {
                    cursor: grabbing;
                }
                
                .node {
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .node-main {
                    fill: var(--vscode-textLink-foreground);
                    stroke: rgba(255, 255, 255, 0.3);
                    stroke-width: 3;
                    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
                }
                
                .node-category {
                    fill: var(--vscode-button-background);
                    stroke: rgba(255, 255, 255, 0.2);
                    stroke-width: 2;
                    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
                }
                
                .node-item {
                    fill: var(--vscode-button-secondaryBackground);
                    stroke: rgba(255, 255, 255, 0.1);
                    stroke-width: 1;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                }
                
                .node-detail {
                    fill: var(--vscode-editorInfo-background);
                    stroke: rgba(255, 255, 255, 0.1);
                    stroke-width: 1;
                    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));
                }
                
                .node:hover {
                    transform: scale(1.1);
                    filter: brightness(1.2) drop-shadow(0 6px 20px rgba(0, 0, 0, 0.4));
                }
                
                .node-text {
                    font-family: inherit;
                    font-size: 12px;
                    font-weight: 600;
                    fill: var(--vscode-foreground);
                    text-anchor: middle;
                    dominant-baseline: middle;
                    pointer-events: none;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
                }
                
                .node-text-main {
                    font-size: 16px;
                    font-weight: 700;
                }
                
                .node-text-category {
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .node-text-item {
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .node-text-detail {
                    font-size: 10px;
                    font-weight: 400;
                }
                
                .connection {
                    stroke: var(--vscode-textLink-foreground);
                    stroke-width: 2;
                    stroke-opacity: 0.6;
                    fill: none;
                    stroke-dasharray: 0;
                    transition: all 0.3s ease;
                }
                
                .connection:hover {
                    stroke-opacity: 1;
                    stroke-width: 3;
                }
                
                .connection-animated {
                    stroke-dasharray: 5 5;
                    animation: dash 1s linear infinite;
                }
                
                @keyframes dash {
                    to {
                        stroke-dashoffset: -10;
                    }
                }
                
                .tooltip {
                    position: absolute;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.05) 100%);
                    color: var(--vscode-foreground);
                    padding: 10px 15px;
                    border-radius: 8px;
                    font-size: 12px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    z-index: 1000;
                }
                
                .tooltip.visible {
                    opacity: 1;
                }
                
                .loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--vscode-foreground);
                    font-size: 1.2em;
                }
                
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255, 255, 255, 0.1);
                    border-left-color: var(--vscode-textLink-foreground);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Mind Map Responsive Design */
                @media (max-width: 768px) {
                    .mindmap-header {
                        flex-direction: column;
                        gap: 15px;
                        padding: 15px;
                        top: 10px;
                        left: 10px;
                        right: 10px;
                    }
                    
                    .mindmap-title {
                        font-size: 1.3em;
                        text-align: center;
                    }
                    
                    .mindmap-controls {
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 8px;
                    }
                    
                    .control-button {
                        padding: 6px 10px;
                        font-size: 0.8em;
                    }
                    
                    .node-text-main {
                        font-size: 14px;
                    }
                    
                    .node-text-category {
                        font-size: 12px;
                    }
                    
                    .node-text-item {
                        font-size: 10px;
                    }
                    
                    .node-text-detail {
                        font-size: 9px;
                    }
                    
                    .tooltip {
                        font-size: 11px;
                        padding: 8px 12px;
                    }
                }
                
                @media (max-width: 480px) {
                    .mindmap-header {
                        padding: 10px;
                        top: 5px;
                        left: 5px;
                        right: 5px;
                    }
                    
                    .mindmap-title {
                        font-size: 1.1em;
                    }
                    
                    .mindmap-controls {
                        gap: 6px;
                    }
                    
                    .control-button {
                        padding: 5px 8px;
                        font-size: 0.75em;
                    }
                    
                    .node-text-main {
                        font-size: 12px;
                    }
                    
                    .node-text-category {
                        font-size: 10px;
                    }
                    
                    .node-text-item {
                        font-size: 9px;
                    }
                    
                    .node-text-detail {
                        font-size: 8px;
                    }
                    
                    .tooltip {
                        font-size: 10px;
                        padding: 6px 10px;
                    }
                    
                    .loading {
                        font-size: 1em;
                    }
                    
                    .spinner {
                        width: 30px;
                        height: 30px;
                    }
                }
                
                /* Touch-friendly interactions for mobile */
                @media (hover: none) and (pointer: coarse) {
                    .node:hover {
                        transform: none;
                        filter: none;
                    }
                    
                    .node:active {
                        transform: scale(1.1);
                        filter: brightness(1.2);
                    }
                    
                    .control-button:hover {
                        transform: none;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    }
                    
                    .control-button:active {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    }
                }
            </style>
        </head>
        <body>
            <div class="mindmap-container">
                <div class="mindmap-header">
                    <h1 class="mindmap-title">${mindMapData.title}</h1>
                    <div class="mindmap-controls">
                        <button class="control-button" onclick="centerView()">🎯 Center</button>
                        <button class="control-button" onclick="zoomIn()">🔍 Zoom In</button>
                        <button class="control-button" onclick="zoomOut()">🔎 Zoom Out</button>
                        <button class="control-button" onclick="exportMindMap()">💾 Export</button>
                    </div>
                </div>
                
                <svg id="mindmapCanvas" width="100%" height="100%">
                    <defs>
                        <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="rgba(255,255,255,0.2)" />
                            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
                        </radialGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge> 
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                </svg>
                
                <div class="tooltip" id="tooltip"></div>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    Generating mind map...
                </div>
            </div>

            <script>
                ${this.getMindMapJavaScript(mindMapData)}
            </script>
        </body>
        </html>`;
    }

    /**
     * Get common CSS styles used across all panels
     */
    private getCommonStyles(): string {
        return `
            * {
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 14px;
                color: var(--vscode-foreground);
                background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(255,255,255,0.02) 100%);
                margin: 0;
                padding: 0;
                line-height: 1.6;
                min-height: 100vh;
            }
            
            h1, h2, h3 {
                color: var(--vscode-foreground);
                margin-top: 0;
                font-weight: 600;
                letter-spacing: -0.5px;
            }
            
            h1 {
                font-size: 2.2em;
                margin-bottom: 0.5em;
            }
            
            h2 {
                font-size: 1.6em;
                margin-bottom: 1em;
            }
            
            .button {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.95em;
                font-weight: 500;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                margin: 5px;
                position: relative;
                overflow: hidden;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                transition: left 0.6s;
            }
            
            .button:hover::before {
                left: 100%;
            }
            
            .button-primary {
                background: linear-gradient(45deg, var(--vscode-button-background), rgba(255, 255, 255, 0.1));
                color: var(--vscode-button-foreground);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            
            .button-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            }
            
            .button-primary:active {
                transform: translateY(0);
            }
            
            .button-secondary {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: 1px solid var(--vscode-button-border);
            }
            
            .button-secondary:hover {
                background: var(--vscode-button-secondaryHoverBackground);
                transform: translateY(-1px);
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideInFromRight {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .fade-in-up {
                animation: fadeInUp 0.6s ease-out;
            }
            
            .slide-in-right {
                animation: slideInFromRight 0.4s ease-out;
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                body {
                    font-size: 12px;
                }
                
                h1 {
                    font-size: 1.8em;
                }
                
                h2 {
                    font-size: 1.4em;
                }
                
                .button {
                    padding: 10px 18px;
                    font-size: 0.9em;
                }
            }
            
            @media (max-width: 480px) {
                body {
                    font-size: 11px;
                }
                
                h1 {
                    font-size: 1.6em;
                }
                
                h2 {
                    font-size: 1.2em;
                }
                
                .button {
                    padding: 8px 16px;
                    font-size: 0.85em;
                }
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .button {
                    border: 2px solid;
                }
                
                .option {
                    border: 2px solid;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }
            }
            
            /* Dark mode adjustments */
            @media (prefers-color-scheme: dark) {
                body {
                    background: linear-gradient(135deg, #1a1a1a 0%, rgba(255,255,255,0.02) 100%);
                }
            }
            
            /* Light mode adjustments */
            @media (prefers-color-scheme: light) {
                body {
                    background: linear-gradient(135deg, #ffffff 0%, rgba(0,0,0,0.02) 100%);
                }
            }
        `;
    }

    /**
     * Generate JavaScript for quiz functionality
     */
    private getQuizJavaScript(quiz: Quiz): string {
        return `
            const vscode = acquireVsCodeApi();
            let currentQuestionIndex = 0;
            let selectedOption = null;
            let score = 0;
            const quiz = ${JSON.stringify(quiz)};
            
            function selectOption(optionIndex) {
                const options = document.querySelectorAll('.option');
                options.forEach(opt => opt.classList.remove('selected'));
                options[optionIndex].classList.add('selected');
                selectedOption = options[optionIndex].dataset.option;
            }
            
            function submitAnswer(questionId) {
                const question = quiz.questions[currentQuestionIndex];
                let userAnswer = selectedOption;
                
                if (question.type === 'open-ended') {
                    userAnswer = document.getElementById('textAnswer').value.trim();
                }
                
                if (!userAnswer) {
                    alert('Please provide an answer before submitting.');
                    return;
                }
                
                // Check if answer is correct
                const isCorrect = userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
                if (isCorrect) {
                    score++;
                }
                
                // Show visual feedback
                if (question.type === 'multiple-choice') {
                    const options = document.querySelectorAll('.option');
                    options.forEach(opt => {
                        if (opt.dataset.option === question.correctAnswer) {
                            opt.classList.add('correct');
                        } else if (opt.dataset.option === userAnswer && !isCorrect) {
                            opt.classList.add('incorrect');
                        }
                    });
                }
                
                // Show explanation
                const explanation = document.getElementById('explanation-' + questionId);
                explanation.style.display = 'block';
                
                // Update submit button to next button
                const submitBtn = document.querySelector('.button-primary');
                if (currentQuestionIndex < quiz.questions.length - 1) {
                    submitBtn.textContent = 'Next Question';
                    submitBtn.onclick = () => nextQuestion();
                } else {
                    submitBtn.textContent = 'Finish Quiz';
                    submitBtn.onclick = () => finishQuiz();
                }
            }
            
            function nextQuestion() {
                currentQuestionIndex++;
                updateProgressBar();
                showQuestion(currentQuestionIndex);
            }
            
            function showQuestion(index) {
                const question = quiz.questions[index];
                document.getElementById('currentQuestion').textContent = index + 1;
                document.getElementById('questionContainer').innerHTML = generateQuestionHTML(question, index);
                selectedOption = null;
            }
            
            function generateQuestionHTML(question, index) {
                let optionsHTML = '';
                
                if (question.type === 'multiple-choice' && question.options) {
                    optionsHTML = \`
                        <div class="options-container">
                            \${question.options.map((option, optionIndex) => \`
                                <div class="option" onclick="selectOption(\${optionIndex})" data-option="\${option}">
                                    \${option}
                                </div>
                            \`).join('')}
                        </div>
                    \`;
                } else {
                    optionsHTML = \`
                        <div class="options-container">
                            <textarea class="text-input" id="textAnswer" placeholder="Type your answer here..." rows="3"></textarea>
                        </div>
                    \`;
                }
                
                return \`
                    <div class="question-container">
                        <div class="question-text">\${question.question}</div>
                        \${question.codeSnippet ? \`<div class="code-snippet">\${question.codeSnippet}</div>\` : ''}
                        \${optionsHTML}
                        <button class="button button-primary" onclick="submitAnswer('\${question.id}')">Submit Answer</button>
                        <div class="explanation" id="explanation-\${question.id}">
                            <strong>Explanation:</strong><br>
                            \${question.explanation}
                        </div>
                    </div>
                \`;
            }
            
            function finishQuiz() {
                const percentage = Math.round((score / quiz.questions.length) * 100);
                document.getElementById('scoreDisplay').textContent = \`\${score}/\${quiz.questions.length} (\${percentage}%)\`;
                document.getElementById('questionContainer').style.display = 'none';
                document.getElementById('quizComplete').style.display = 'block';
                document.querySelector('.quiz-header').style.display = 'none';
            }
            
            function updateProgressBar() {
                const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
                document.getElementById('progressFill').style.width = progress + '%';
            }
            
            function restartQuiz() {
                vscode.postMessage({
                    command: 'restartQuiz'
                });
            }
            
            // Initialize progress bar
            updateProgressBar();
        `;
    }

    /**
     * Generate JavaScript for mind map functionality
     */
    private getMindMapJavaScript(mindMapData: MindMapData): string {
        return `
            const vscode = acquireVsCodeApi();
            let mindMapData = ${JSON.stringify(mindMapData)};
            let scale = 1;
            let translateX = 0;
            let translateY = 0;
            let isDragging = false;
            let dragStart = { x: 0, y: 0 };
            
            const canvas = document.getElementById('mindmapCanvas');
            const tooltip = document.getElementById('tooltip');
            const loading = document.getElementById('loading');
            
            // Initialize mind map
            setTimeout(() => {
                initializeMindMap();
                loading.style.display = 'none';
            }, 500);
            
            function initializeMindMap() {
                const svg = canvas;
                const rect = svg.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Position nodes in a radial layout
                const nodes = mindMapData.nodes;
                const rootNode = mindMapData.rootNode;
                
                // Place root node at center
                rootNode.x = centerX;
                rootNode.y = centerY;
                
                // Position other nodes
                positionNodes(nodes, rootNode, centerX, centerY);
                
                // Draw connections first (so they appear behind nodes)
                drawConnections();
                
                // Draw nodes
                drawNodes();
                
                // Setup event listeners
                setupEventListeners();
            }
            
            function positionNodes(nodes, rootNode, centerX, centerY) {
                const categories = nodes.filter(n => n.type === 'category');
                const angleStep = (2 * Math.PI) / categories.length;
                const radius = 200;
                
                categories.forEach((node, index) => {
                    const angle = index * angleStep;
                    node.x = centerX + Math.cos(angle) * radius;
                    node.y = centerY + Math.sin(angle) * radius;
                    
                    // Position children of this category
                    const children = nodes.filter(n => 
                        n.type === 'item' && mindMapData.connections.some(c => 
                            c.from === node.id && c.to === n.id
                        )
                    );
                    
                    children.forEach((child, childIndex) => {
                        const childAngle = angle + (childIndex - children.length/2) * 0.3;
                        const childRadius = radius + 100;
                        child.x = centerX + Math.cos(childAngle) * childRadius;
                        child.y = centerY + Math.sin(childAngle) * childRadius;
                    });
                });
                
                // Position detail nodes
                const details = nodes.filter(n => n.type === 'detail');
                details.forEach(detail => {
                    const parent = nodes.find(n => 
                        mindMapData.connections.some(c => c.from === n.id && c.to === detail.id)
                    );
                    if (parent) {
                        const offset = 80;
                        detail.x = parent.x + (Math.random() - 0.5) * offset;
                        detail.y = parent.y + (Math.random() - 0.5) * offset;
                    }
                });
            }
            
            function drawConnections() {
                const svg = canvas;
                const connections = mindMapData.connections;
                const nodes = [mindMapData.rootNode, ...mindMapData.nodes];
                
                connections.forEach(conn => {
                    const fromNode = nodes.find(n => n.id === conn.from);
                    const toNode = nodes.find(n => n.id === conn.to);
                    
                    if (fromNode && toNode) {
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        
                        // Create curved path
                        const dx = toNode.x - fromNode.x;
                        const dy = toNode.y - fromNode.y;
                        const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;
                        
                        const pathData = \`M \${fromNode.x} \${fromNode.y} Q \${fromNode.x + dx/2 + dr} \${fromNode.y + dy/2 - dr} \${toNode.x} \${toNode.y}\`;
                        
                        line.setAttribute('d', pathData);
                        line.setAttribute('class', 'connection');
                        line.setAttribute('data-from', conn.from);
                        line.setAttribute('data-to', conn.to);
                        
                        svg.appendChild(line);
                    }
                });
            }
            
            function drawNodes() {
                const svg = canvas;
                const nodes = [mindMapData.rootNode, ...mindMapData.nodes];
                
                nodes.forEach(node => {
                    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    group.setAttribute('transform', \`translate(\${node.x}, \${node.y})\`);
                    
                    // Create node circle
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    const radius = getNodeRadius(node.type);
                    circle.setAttribute('r', radius);
                    circle.setAttribute('class', \`node node-\${node.type}\`);
                    circle.setAttribute('data-node-id', node.id);
                    
                    // Create text
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('class', \`node-text node-text-\${node.type}\`);
                    text.textContent = wrapText(node.label, radius);
                    
                    group.appendChild(circle);
                    group.appendChild(text);
                    svg.appendChild(group);
                    
                    // Add hover effects
                    group.addEventListener('mouseenter', (e) => showTooltip(e, node));
                    group.addEventListener('mouseleave', hideTooltip);
                    group.addEventListener('click', (e) => handleNodeClick(node));
                });
            }
            
            function getNodeRadius(type) {
                switch(type) {
                    case 'main': return 50;
                    case 'category': return 35;
                    case 'item': return 25;
                    case 'detail': return 18;
                    default: return 25;
                }
            }
            
            function wrapText(text, maxRadius) {
                const maxLength = Math.floor(maxRadius / 4);
                return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
            }
            
            function showTooltip(event, node) {
                tooltip.innerHTML = \`
                    <strong>\${node.label}</strong><br>
                    <small>Type: \${node.type}</small>
                \`;
                tooltip.style.left = (event.clientX + 10) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
                tooltip.classList.add('visible');
            }
            
            function hideTooltip() {
                tooltip.classList.remove('visible');
            }
            
            function handleNodeClick(node) {
                // Animate connections from this node
                const connections = document.querySelectorAll(\`[data-from="\${node.id}"], [data-to="\${node.id}"]\`);
                connections.forEach(conn => {
                    conn.classList.add('connection-animated');
                    setTimeout(() => conn.classList.remove('connection-animated'), 2000);
                });
                
                vscode.postMessage({
                    command: 'nodeClicked',
                    nodeId: node.id,
                    nodeData: node
                });
            }
            
            function setupEventListeners() {
                // Pan and zoom functionality
                canvas.addEventListener('mousedown', startDrag);
                canvas.addEventListener('mousemove', drag);
                canvas.addEventListener('mouseup', endDrag);
                canvas.addEventListener('wheel', zoom);
                
                // Prevent context menu
                canvas.addEventListener('contextmenu', e => e.preventDefault());
            }
            
            function startDrag(e) {
                if (e.target === canvas) {
                    isDragging = true;
                    dragStart.x = e.clientX - translateX;
                    dragStart.y = e.clientY - translateY;
                    canvas.style.cursor = 'grabbing';
                }
            }
            
            function drag(e) {
                if (isDragging) {
                    translateX = e.clientX - dragStart.x;
                    translateY = e.clientY - dragStart.y;
                    updateTransform();
                }
            }
            
            function endDrag() {
                isDragging = false;
                canvas.style.cursor = 'grab';
            }
            
            function zoom(e) {
                e.preventDefault();
                const zoomIntensity = 0.1;
                const newScale = e.deltaY > 0 ? scale * (1 - zoomIntensity) : scale * (1 + zoomIntensity);
                scale = Math.max(0.1, Math.min(3, newScale));
                updateTransform();
            }
            
            function updateTransform() {
                const transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
                canvas.style.transform = transform;
            }
            
            // Control functions
            function centerView() {
                scale = 1;
                translateX = 0;
                translateY = 0;
                updateTransform();
            }
            
            function zoomIn() {
                scale = Math.min(3, scale * 1.2);
                updateTransform();
            }
            
            function zoomOut() {
                scale = Math.max(0.1, scale * 0.8);
                updateTransform();
            }
            
            function exportMindMap() {
                vscode.postMessage({
                    command: 'exportMindMap',
                    mindMapData: mindMapData
                });
            }
            
            // Make functions globally available
            window.centerView = centerView;
            window.zoomIn = zoomIn;
            window.zoomOut = zoomOut;
            window.exportMindMap = exportMindMap;
        `;
    }

    /**
     * Handle quiz answer submission
     */
    private handleQuizAnswer(panel: vscode.WebviewPanel, questionId: string, answer: string, quiz: Quiz): void {
        // Find the question
        const question = quiz.questions.find(q => q.id === questionId);
        if (!question) {
            return;
        }

        // This method can be extended to track user progress, save results, etc.
        console.log(`User answered question ${questionId}: ${answer}`);
        
        // For now, the JavaScript in the WebView handles the answer checking
        // In the future, you could send the result back to the WebView or store it
    }

    /**
     * Show the next question in the quiz
     */
    private showNextQuestion(panel: vscode.WebviewPanel, questionIndex: number, quiz: Quiz): void {
        if (questionIndex < quiz.questions.length) {
            // The JavaScript in the WebView handles showing the next question
            console.log(`Showing question ${questionIndex + 1}`);
        }
    }

    /**
     * Export mind map data
     */
    private exportMindMap(panel: vscode.WebviewPanel, mindMapData: MindMapData): void {
        // This method could be extended to export the mind map as JSON, PNG, SVG, etc.
        console.log('Exporting mind map:', mindMapData.title);
        
        // For now, just show a message that export is not implemented yet
        vscode.window.showInformationMessage(`Mind map "${mindMapData.title}" export feature coming soon!`);
    }

    /**
     * Utility method to escape HTML characters
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

