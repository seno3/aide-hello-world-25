/**
 * UI Manager Module
 * 
 * This module handles creating and managing WebView panels for displaying
 * quizzes and code explanations with clean, minimal UI.
 */

import * as vscode from 'vscode';
import { Quiz, QuizQuestion } from './quizGenerator';
import { CodeExplanation } from './codeExplainer';

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
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .quiz-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid var(--vscode-panel-border);
                }
                
                .quiz-progress {
                    background-color: var(--vscode-progressBar-background);
                    height: 8px;
                    border-radius: 4px;
                    margin: 10px 0;
                }
                
                .quiz-progress-fill {
                    background-color: var(--vscode-progressBar-foreground);
                    height: 100%;
                    border-radius: 4px;
                    width: 0%;
                    transition: width 0.3s ease;
                }
                
                .question-container {
                    margin-bottom: 30px;
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                    border-radius: 8px;
                    border: 1px solid var(--vscode-panel-border);
                }
                
                .question-text {
                    font-size: 1.2em;
                    margin-bottom: 20px;
                    font-weight: 500;
                }
                
                .code-snippet {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 4px;
                    margin: 15px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                    border-left: 4px solid var(--vscode-textLink-foreground);
                    overflow-x: auto;
                    white-space: pre;
                }
                
                .options-container {
                    margin: 20px 0;
                }
                
                .option {
                    display: block;
                    margin: 10px 0;
                    padding: 12px 15px;
                    background-color: var(--vscode-button-secondaryBackground);
                    border: 1px solid var(--vscode-button-border);
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .option:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .option.selected {
                    background-color: var(--vscode-button-background);
                    border-color: var(--vscode-button-foreground);
                }
                
                .option.correct {
                    background-color: var(--vscode-testing-iconPassed);
                    color: white;
                }
                
                .option.incorrect {
                    background-color: var(--vscode-testing-iconFailed);
                    color: white;
                }
                
                .text-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-size: 1em;
                    margin: 10px 0;
                }
                
                .explanation {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: var(--vscode-editorInfo-background);
                    border-left: 4px solid var(--vscode-editorInfo-foreground);
                    border-radius: 4px;
                    display: none;
                }
                
                .quiz-complete {
                    text-align: center;
                    padding: 40px 20px;
                    display: none;
                }
                
                .score-display {
                    font-size: 2em;
                    margin: 20px 0;
                    font-weight: bold;
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
                    <p>Question <span id="currentQuestion">1</span> of ${quiz.totalQuestions}</p>
                </div>
                
                <div id="questionContainer">
                    ${this.generateQuestionHTML(firstQuestion, 0)}
                </div>
                
                <div class="quiz-complete" id="quizComplete">
                    <h2>🎉 Quiz Complete!</h2>
                    <div class="score-display" id="scoreDisplay"></div>
                    <p>Great job learning about the code!</p>
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
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .overview {
                    background-color: var(--vscode-editorInfo-background);
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    border-left: 4px solid var(--vscode-editorInfo-foreground);
                }
                
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .summary-item {
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    border-radius: 4px;
                    border: 1px solid var(--vscode-panel-border);
                    text-align: center;
                }
                
                .summary-number {
                    font-size: 2em;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                }
                
                .line-explanations {
                    margin-top: 30px;
                }
                
                .line-explanation {
                    display: flex;
                    margin: 15px 0;
                    padding: 15px;
                    background-color: var(--vscode-editor-background);
                    border-radius: 4px;
                    border: 1px solid var(--vscode-panel-border);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .line-explanation:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                
                .line-number {
                    flex-shrink: 0;
                    width: 40px;
                    text-align: right;
                    padding-right: 15px;
                    color: var(--vscode-editorLineNumber-foreground);
                    font-family: 'Courier New', monospace;
                }
                
                .line-code {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 8px 12px;
                    border-radius: 4px;
                    margin-right: 15px;
                    overflow-x: auto;
                    white-space: pre;
                }
                
                .line-explanation-text {
                    flex: 2;
                    padding-left: 15px;
                    border-left: 2px solid var(--vscode-panel-border);
                }
                
                .importance-high {
                    border-left-color: var(--vscode-testing-iconFailed);
                }
                
                .importance-medium {
                    border-left-color: var(--vscode-editorWarning-foreground);
                }
                
                .importance-low {
                    border-left-color: var(--vscode-editorInfo-foreground);
                }
                
                .category-tag {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    margin-bottom: 5px;
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                }
            </style>
        </head>
        <body>
            <div class="explanation-container">
                <h1>${explanation.title}</h1>
                
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
     * Get common CSS styles used across all panels
     */
    private getCommonStyles(): string {
        return `
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
                padding: 0;
                line-height: 1.6;
            }
            
            h1, h2, h3 {
                color: var(--vscode-foreground);
                margin-top: 0;
            }
            
            .button {
                padding: 10px 20px;
                border: 1px solid var(--vscode-button-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 1em;
                transition: all 0.2s ease;
                margin: 5px;
            }
            
            .button-primary {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
            
            .button-primary:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .button-secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }
            
            .button-secondary:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
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

