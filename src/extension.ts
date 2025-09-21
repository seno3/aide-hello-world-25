import * as vscode from 'vscode';
import { AIService } from './core/ai';
import { RiskClassifier } from './core/risk';
import { BossFightManager } from './core/boss';
import { LearningLogger } from './storage/logger';
import { CommandManager } from './vscode/commands';
import { Context } from './core/telemetry';
import { CodeExplainer } from './core/codeExplainer';

export class TBAExtension {
  private static instance: TBAExtension;
  private aiService: AIService;
  private riskClassifier: RiskClassifier;
  private bossManager: BossFightManager;
  private logger: LearningLogger;
  private commandManager: CommandManager;
  private codeExplainer: CodeExplainer;
  private webviewPanel: vscode.WebviewPanel | null = null;
  private changeTimeout: NodeJS.Timeout | null = null;
  private lastDocumentContent: string = '';
  private lastDocumentPath: string = '';

  private constructor() {
    this.aiService = AIService.getInstance();
    this.riskClassifier = RiskClassifier.getInstance();
    this.bossManager = BossFightManager.getInstance();
    this.logger = LearningLogger.getInstance();
    this.commandManager = CommandManager.getInstance();
    this.codeExplainer = new CodeExplainer();
  }

  public static getInstance(): TBAExtension {
    if (!TBAExtension.instance) {
      TBAExtension.instance = new TBAExtension();
    }
    return TBAExtension.instance;
  }

  /**
   * Activate the extension
   */
  public activate(context: vscode.ExtensionContext): void {
    console.log('🎓 Teach-Before-Apply extension is now active!');

    // Register commands
    this.commandManager.registerCommands(context);

    // Set up event listeners
    this.setupEventListeners(context);

    // Show welcome message
    this.showWelcomeMessage();
  }

  /**
   * Deactivate the extension
   */
  public deactivate(): void {
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }
    console.log('🎓 Teach-Before-Apply extension deactivated');
  }

  private setupEventListeners(context: vscode.ExtensionContext): void {
    // Listen for document changes
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument(
      (event) => this.handleDocumentChange(event),
      null,
      context.subscriptions
    );

    // Listen for active editor changes
    const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(
      (editor) => this.handleActiveEditorChange(editor),
      null,
      context.subscriptions
    );

    // Listen for save events
    const saveListener = vscode.workspace.onDidSaveTextDocument(
      (document) => this.handleDocumentSave(document),
      null,
      context.subscriptions
    );

    context.subscriptions.push(documentChangeListener, activeEditorListener, saveListener);
  }

  private async handleDocumentChange(event: vscode.TextDocumentChangeEvent): Promise<void> {
    // Debounce rapid changes
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }

    this.changeTimeout = setTimeout(async () => {
      await this.processDocumentChange(event);
    }, 2000); // 2 second debounce
  }

  private async handleActiveEditorChange(editor: vscode.TextEditor | undefined): Promise<void> {
    if (editor) {
      this.lastDocumentPath = editor.document.uri.fsPath;
      this.lastDocumentContent = editor.document.getText();
    }
  }

  private async handleDocumentSave(document: vscode.TextDocument): Promise<void> {
    // Process save events for learning opportunities
    const context = this.buildContext(document, 'save');
    await this.processContext(context);
  }

  private async processDocumentChange(event: vscode.TextDocumentChangeEvent): Promise<void> {
    const document = event.document;
    
    // Only process supported languages
    if (!this.isSupportedLanguage(document.languageId)) {
            return;
        }

    // Skip if no meaningful changes
    if (event.contentChanges.length === 0) {
            return;
        }

    const context = this.buildContext(document, 'edit');
    await this.processContext(context);
  }

  private buildContext(document: vscode.TextDocument, eventType: string): Context {
    const currentContent = document.getText();
    const before = this.lastDocumentContent;
    const after = currentContent;

    // Generate unified diff
    const unifiedDiff = this.generateUnifiedDiff(before, after);

    // Detect frameworks
    const frameworksHint = this.detectFrameworks(currentContent);

    // Get risk hint
    const riskHint = this.riskClassifier.classifyRisk(currentContent);

    return {
      event: eventType,
      filePath: document.uri.fsPath,
      before,
      after,
      unifiedDiff,
      frameworksHint,
      terminalTail: '', // Could be enhanced to capture terminal output
      testsTail: '', // Could be enhanced to capture test output
      riskHint,
      userMode: 'learning' // Could be enhanced based on user preferences
    };
  }

  private async processContext(context: Context): Promise<void> {
    try {
      const startTime = Date.now();

      // Generate teaching card
      const teachingCard = await this.aiService.generateTeachingCard(context);

      // Calculate latency
      const latency = Date.now() - startTime;

      // Log the event
      await this.logger.logTeachingCardInteraction(
        context.filePath,
        teachingCard.mode,
        teachingCard.risk,
        teachingCard.concept_tags,
        null, // quiz_correct will be set when user answers
        false, // applied will be set when user applies
        latency
      );

      // Show teaching card in webview
      await this.showTeachingCard(teachingCard);

      // Update last document content
      this.lastDocumentContent = context.after;
      this.lastDocumentPath = context.filePath;
            
        } catch (error) {
      console.error('Failed to process context:', error);
      vscode.window.showErrorMessage(`Failed to analyze code: ${error}`);
    }
  }

  private async showTeachingCard(card: any): Promise<void> {
    // Create or update webview panel
    if (!this.webviewPanel) {
      this.webviewPanel = vscode.window.createWebviewPanel(
        'tbaTeachingCard',
        'Learning Card',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      // Handle messages from webview
      this.webviewPanel.webview.onDidReceiveMessage(
        async (message) => {
          await this.handleWebviewMessage(message, card);
        }
      );
    }

    // Set webview content
    this.webviewPanel.webview.html = this.getTeachingCardHTML(card);

    // Show the panel
    this.webviewPanel.reveal();
  }

  private async handleWebviewMessage(message: any, card: any): Promise<void> {
    switch (message.type) {
      case 'apply':
        await this.handleApplyCard(card, message.quizCorrect);
        break;
      case 'skip':
        await this.handleSkipCard(card);
        break;
      case 'quizResult':
        await this.handleQuizResult(card, message.correct);
        break;
      case 'deepDive':
        await this.handleDeepDive(card);
        break;
    }
  }

  private async handleApplyCard(card: any, quizCorrect: boolean | null): Promise<void> {
    try {
      // Log the application
      await this.logger.logTeachingCardInteraction(
        this.lastDocumentPath,
        card.mode,
        card.risk,
        card.concept_tags,
        quizCorrect,
        true,
        0 // latency not relevant for application
      );

      // Check for boss fight trigger
      const bossChallenge = this.bossManager.onChangeAccepted({
        event: 'apply',
        filePath: this.lastDocumentPath,
        before: this.lastDocumentContent,
        after: this.lastDocumentContent, // This would be the new content
        unifiedDiff: card.diff.unified,
        frameworksHint: [],
        terminalTail: '',
        testsTail: '',
        riskHint: card.risk,
        userMode: 'learning'
      });

      if (bossChallenge) {
        await this.showBossFight(bossChallenge);
      }

      // Show success message
      vscode.window.showInformationMessage('✅ Code applied successfully!');

      // Close the teaching card
      if (this.webviewPanel) {
        this.webviewPanel.dispose();
        this.webviewPanel = null;
      }

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to apply changes: ${error}`);
    }
  }

  private async handleSkipCard(card: any): Promise<void> {
    // Log the skip
    await this.logger.logTeachingCardInteraction(
      this.lastDocumentPath,
      card.mode,
      card.risk,
      card.concept_tags,
      null,
      false,
      0
    );

    // Close the teaching card
    if (this.webviewPanel) {
      this.webviewPanel.dispose();
      this.webviewPanel = null;
    }
  }

  private async handleQuizResult(card: any, correct: boolean): Promise<void> {
    // Log the quiz result
    await this.logger.logTeachingCardInteraction(
      this.lastDocumentPath,
      card.mode,
      card.risk,
      card.concept_tags,
      correct,
      false,
      0
    );
  }

  private async handleDeepDive(card: any): Promise<void> {
    // Open a new document with detailed explanation
    const doc = await vscode.workspace.openTextDocument({
      content: `# Deep Dive: ${card.concept_tags.join(', ')}

## Why?
${card.summary_why}

## Code Changes
\`\`\`
${card.diff.unified}
\`\`\`

## Alternative Approaches
${card.actions.suggest_alternatives.map((alt: any, i: number) => `
### ${i + 1}. ${alt.label}
${alt.tradeoff}

\`\`\`
${alt.diff}
\`\`\`
`).join('\n')}

## Next Steps
${card.actions.next_step}

## Additional Resources
- [MDN Documentation](https://developer.mozilla.org/)
- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Examples](https://github.com/)
`,
      language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);
  }

  private async showBossFight(boss: any): Promise<void> {
    // Create boss fight webview
    const bossPanel = vscode.window.createWebviewPanel(
      'tbaBossFight',
      'Boss Fight!',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    bossPanel.webview.html = this.getBossFightHTML(boss);

    // Handle boss fight messages
    bossPanel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'testBossSolution':
            const result = this.bossManager.testBossSolution(message.userCode);
            bossPanel.webview.postMessage({
              type: 'bossTestResult',
              result
            });
            break;
          case 'skipBoss':
            bossPanel.dispose();
            break;
        }
      }
    );

    bossPanel.reveal();
  }

  private getTeachingCardHTML(card: any): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning Card</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; line-height: 1.6; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .risk-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .risk-low { background: #d4edda; color: #155724; }
        .risk-medium { background: #fff3cd; color: #856404; }
        .risk-high { background: #f8d7da; color: #721c24; }
        .code { background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; white-space: pre-wrap; }
        .actions { display: flex; gap: 10px; margin-top: 20px; }
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-outline { background: transparent; color: #007bff; border: 1px solid #007bff; }
        .quiz { margin: 20px 0; }
        .quiz-choice { padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin: 5px 0; cursor: pointer; }
        .quiz-choice:hover { background: #f8f9fa; }
        .quiz-choice.selected { background: #e3f2fd; border-color: #2196f3; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h2>🎓 Learning Card</h2>
            <div class="risk-badge risk-${card.risk}">${card.risk.toUpperCase()}</div>
        </div>
        
        <h3>🤔 Why?</h3>
        <p>${card.summary_why}</p>
        
        <h3>📝 Code Changes</h3>
        <div class="code">${card.diff.unified}</div>
        
        <div class="quiz">
            <h3>🧠 Quick Check</h3>
            <p>${card.micro_check.question}</p>
            ${card.micro_check.type === 'mcq' ? 
              card.micro_check.choices.map((choice: string, i: number) => 
                `<div class="quiz-choice" onclick="selectAnswer(${i})">${choice}</div>`
              ).join('') :
              `<input type="text" id="fillAnswer" placeholder="Your answer..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">`
            }
        </div>
        
        <div class="actions">
            <button class="btn btn-primary" onclick="applyCard()">✅ Apply</button>
            <button class="btn btn-secondary" onclick="skipCard()">⏭️ Skip</button>
            <button class="btn btn-outline" onclick="deepDive()">🔍 Deep Dive</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let selectedAnswer = null;
        
        function selectAnswer(index) {
            selectedAnswer = index;
            document.querySelectorAll('.quiz-choice').forEach((el, i) => {
                el.classList.toggle('selected', i === index);
            });
        }
        
        function applyCard() {
            vscode.postMessage({
                type: 'apply',
                quizCorrect: selectedAnswer === ${card.micro_check.answer_index || 0}
            });
        }
        
        function skipCard() {
            vscode.postMessage({ type: 'skip' });
        }
        
        function deepDive() {
            vscode.postMessage({ type: 'deepDive' });
        }
    </script>
</body>
</html>`;
  }

  private getBossFightHTML(boss: any): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boss Fight</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; }
        .boss-card { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .boss-header { text-align: center; margin-bottom: 20px; }
        .code { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; white-space: pre-wrap; margin: 10px 0; }
        .solution-input { width: 100%; min-height: 100px; padding: 15px; border: 2px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.1); color: white; font-family: 'Monaco', 'Menlo', monospace; }
        .actions { display: flex; gap: 10px; margin-top: 20px; }
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
        .btn-primary { background: #28a745; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-outline { background: transparent; color: white; border: 1px solid white; }
    </style>
</head>
<body>
    <div class="boss-card">
        <div class="boss-header">
            <h1>🐉 ${boss.title}</h1>
            <p>${boss.description}</p>
        </div>
        
        <h3>🐛 Buggy Code:</h3>
        <div class="code">${boss.buggyCode}</div>
        
        <h3>🧪 Test Output:</h3>
        <div class="code">${boss.testOutput}</div>
        
        <h3>💡 Your Solution:</h3>
        <textarea class="solution-input" id="solution" placeholder="Fix the bug here..."></textarea>
        
        <div class="actions">
            <button class="btn btn-primary" onclick="testSolution()">⚔️ Test Solution</button>
            <button class="btn btn-secondary" onclick="getHint()">💡 Get Hint</button>
            <button class="btn btn-outline" onclick="skipBoss()">🏃 Skip Boss</button>
        </div>
        
        <div id="feedback" style="margin-top: 20px; padding: 15px; border-radius: 6px; display: none;"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function testSolution() {
            const solution = document.getElementById('solution').value;
            vscode.postMessage({
                type: 'testBossSolution',
                userCode: solution
            });
        }
        
        function getHint() {
            document.getElementById('feedback').style.display = 'block';
            document.getElementById('feedback').textContent = '💡 Hint: ' + '${boss.hint}';
            document.getElementById('feedback').style.background = 'rgba(255, 193, 7, 0.2)';
        }
        
        function skipBoss() {
            vscode.postMessage({ type: 'skipBoss' });
        }
        
        // Listen for test results
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'bossTestResult') {
                const feedback = document.getElementById('feedback');
                feedback.style.display = 'block';
                if (message.result.passed) {
                    feedback.textContent = '🎉 Boss defeated! Great job!';
                    feedback.style.background = 'rgba(40, 167, 69, 0.2)';
                } else {
                    feedback.textContent = '❌ ' + (message.result.hint || 'Try again!');
                    feedback.style.background = 'rgba(220, 53, 69, 0.2)';
                }
            }
        });
    </script>
</body>
</html>`;
  }

  private isSupportedLanguage(languageId: string): boolean {
    const supportedLanguages = ['javascript', 'typescript', 'python', 'sql', 'java', 'csharp', 'cpp', 'go', 'rust'];
    return supportedLanguages.includes(languageId);
  }

  private detectFrameworks(content: string): string[] {
    const frameworks: string[] = [];
    
    if (content.includes('react') || content.includes('jsx')) frameworks.push('react');
    if (content.includes('vue')) frameworks.push('vue');
    if (content.includes('angular')) frameworks.push('angular');
    if (content.includes('express')) frameworks.push('express');
    if (content.includes('django')) frameworks.push('django');
    if (content.includes('flask')) frameworks.push('flask');
    if (content.includes('spring')) frameworks.push('spring');
    
    return frameworks;
  }

  private generateUnifiedDiff(before: string, after: string): string {
    // Simple diff generation - in a real implementation, you'd use a proper diff library
    if (before === after) return '';
    
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    
    let diff = '';
    const maxLines = Math.max(beforeLines.length, afterLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const beforeLine = beforeLines[i] || '';
      const afterLine = afterLines[i] || '';
      
      if (beforeLine !== afterLine) {
        if (beforeLine) diff += `-${beforeLine}\n`;
        if (afterLine) diff += `+${afterLine}\n`;
      }
    }
    
    return diff;
  }

  private showWelcomeMessage(): void {
    vscode.window.showInformationMessage(
      '🎓 Teach-Before-Apply is ready! Start coding and I\'ll help you learn.',
      'Open Learning Panel',
      'Export Learnings',
      'Toggle Boss Mode'
    ).then(selection => {
      switch (selection) {
        case 'Open Learning Panel':
          vscode.commands.executeCommand('tba.openPanel');
          break;
        case 'Export Learnings':
          vscode.commands.executeCommand('tba.export');
          break;
        case 'Toggle Boss Mode':
          vscode.commands.executeCommand('tba.toggleBoss');
          break;
      }
    });
  }

  /**
   * Public method to get code explanation
   */
  public async explainCode(code: string, context?: any): Promise<any> {
    return await this.codeExplainer.explainCode(code, context);
  }

  /**
   * Public method to get code clarification
   */
  public async clarifyCode(code: string, question: string): Promise<string> {
    return await this.codeExplainer.clarify(code, question);
  }
}

// Extension activation
export function activate(context: vscode.ExtensionContext): void {
  const extension = TBAExtension.getInstance();
  extension.activate(context);
}

// Extension deactivation
export function deactivate(): void {
  const extension = TBAExtension.getInstance();
  extension.deactivate();
}
