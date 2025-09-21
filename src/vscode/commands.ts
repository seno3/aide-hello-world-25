import * as vscode from 'vscode';
import { PersonalTextbookExporter } from '../storage/export';
import { BossFightManager } from '../core/boss';
import { LearningLogger } from '../storage/logger';

export class CommandManager {
  private static instance: CommandManager;
  private exporter: PersonalTextbookExporter;
  private bossManager: BossFightManager;
  private logger: LearningLogger;

  private constructor() {
    this.exporter = PersonalTextbookExporter.getInstance();
    this.bossManager = BossFightManager.getInstance();
    this.logger = LearningLogger.getInstance();
  }

  public static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  /**
   * Register all TBA commands
   */
  public registerCommands(context: vscode.ExtensionContext): void {
    // Open Learning Panel command
    const openPanelCommand = vscode.commands.registerCommand('tba.openPanel', () => {
      this.openLearningPanel(context);
    });

    // Export Today's Learnings command
    const exportCommand = vscode.commands.registerCommand('tba.export', async () => {
      await this.exportTodaysLearnings();
    });

    // Toggle Boss Fight Mode command
    const toggleBossCommand = vscode.commands.registerCommand('tba.toggleBoss', () => {
      this.toggleBossMode();
    });

    // Explain Code command
    const explainCodeCommand = vscode.commands.registerCommand('tba.explainCode', async () => {
      await this.explainCode();
    });

    // Add commands to context
    context.subscriptions.push(openPanelCommand, exportCommand, toggleBossCommand, explainCodeCommand);
  }

  /**
   * Open or refresh the learning panel
   */
  private async openLearningPanel(context: vscode.ExtensionContext): Promise<void> {
    try {
      // Create and show webview panel
      const panel = vscode.window.createWebviewPanel(
        'tbaLearningPanel',
        'Teach-Before-Apply',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, 'media'),
            vscode.Uri.joinPath(context.extensionUri, 'src', 'client')
          ]
        }
      );

      // Set webview content
      panel.webview.html = this.getWebviewContent(context.extensionUri, panel.webview);

      // Handle messages from webview
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.type) {
            case 'exportLearnings':
              await this.exportTodaysLearnings();
              break;
            case 'requestStats':
              await this.sendStatsToWebview(panel.webview);
              break;
            default:
              console.log('Unknown message type:', message.type);
          }
        },
        undefined,
        context.subscriptions
      );

      // Send initial data to webview
      await this.sendInitialDataToWebview(panel.webview);

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open learning panel: ${error}`);
    }
  }

  /**
   * Export today's learnings to Markdown and PDF
   */
  private async exportTodaysLearnings(): Promise<void> {
    try {
      vscode.window.showInformationMessage('Generating your personal textbook...');

      // Get today's date for filename
      const today = new Date().toISOString().split('T')[0];
      const outputPath = `tba_session_${today}`;

      // Export to file
      const result = await this.exporter.exportToFile(outputPath, {
        includeTodayOnly: true,
        includeQuizzes: true,
        includeDiffs: true,
        includeStats: true
      });

      // Show success message
      let message = `📚 Personal textbook generated!\n\nMarkdown: ${result.markdownPath}`;
      if (result.pdfPath) {
        message += `\nPDF: ${result.pdfPath}`;
      }

      const action = await vscode.window.showInformationMessage(
        message,
        'Open Markdown',
        'Open PDF',
        'Open Folder'
      );

      if (action === 'Open Markdown') {
        const doc = await vscode.workspace.openTextDocument(result.markdownPath);
        await vscode.window.showTextDocument(doc);
      } else if (action === 'Open PDF' && result.pdfPath) {
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(result.pdfPath));
      } else if (action === 'Open Folder') {
        const folderPath = result.markdownPath.substring(0, result.markdownPath.lastIndexOf('/'));
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(folderPath));
      }

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to export learnings: ${error}`);
    }
  }

  /**
   * Toggle Boss Fight Mode on/off
   */
  private toggleBossMode(): void {
    const isEnabled = this.bossManager.toggleBossMode();
    const message = isEnabled 
      ? '🐉 Boss Fight Mode enabled! Every 5 accepted changes will trigger a challenge.'
      : '😴 Boss Fight Mode disabled. No more boss challenges.';
    
    vscode.window.showInformationMessage(message);
  }

  /**
   * Get webview HTML content
   */
  private getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview): string {
    // Get paths to resources
    const d3Path = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'd3.min.js'));
    const stylesPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'client', 'styles.css'));
    const panelScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'client', 'panel.js'));
    const visualizerScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'client', 'visualizer.js'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teach-Before-Apply</title>
    <link rel="stylesheet" href="${stylesPath}">
</head>
<body>
    <div id="app">
        <!-- Header -->
        <header class="header">
            <h1>🎓 Teach-Before-Apply</h1>
            <div class="header-controls">
                <button id="toggleVisualizer" class="btn btn-secondary">📊 Learning Map</button>
                <button id="exportLearnings" class="btn btn-secondary">📚 Export</button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Teaching Card -->
            <div id="teachingCard" class="teaching-card hidden">
                <div class="card-header">
                    <h2 id="cardTitle">Learning Card</h2>
                    <div class="risk-badge" id="riskBadge"></div>
                </div>

                <!-- Risk Warning Banner -->
                <div id="riskWarning" class="risk-warning hidden">
                    <div class="warning-content">
                        <span class="warning-icon">⚠️</span>
                        <span id="warningText">High risk operation detected</span>
                    </div>
                </div>

                <!-- Why Section -->
                <div class="why-section">
                    <h3>🤔 Why?</h3>
                    <p id="summaryWhy"></p>
                </div>

                <!-- Code Diff -->
                <div class="diff-section">
                    <h3>📝 Code Changes</h3>
                    <pre id="codeDiff" class="code-block"></pre>
                    <div id="callouts" class="callouts"></div>
                </div>

                <!-- Micro Quiz -->
                <div class="quiz-section">
                    <h3>🧠 Quick Check</h3>
                    <div id="quizQuestion" class="quiz-question"></div>
                    <div id="quizChoices" class="quiz-choices"></div>
                    <div id="quizFill" class="quiz-fill hidden">
                        <input type="text" id="fillInput" placeholder="Your answer...">
                    </div>
                    <div id="quizFeedback" class="quiz-feedback hidden"></div>
                </div>

                <!-- Alternatives -->
                <div class="alternatives-section">
                    <h3>🔄 Alternative Approaches</h3>
                    <div id="alternatives" class="alternatives"></div>
                </div>

                <!-- Actions -->
                <div class="actions-section">
                    <div class="action-buttons">
                        <button id="applyBtn" class="btn btn-primary">✅ Apply</button>
                        <button id="skipBtn" class="btn btn-secondary">⏭️ Skip</button>
                        <button id="hintBtn" class="btn btn-outline">💡 Hint</button>
                        <button id="deepDiveBtn" class="btn btn-outline">🔍 Deep Dive</button>
                    </div>
                    <div class="next-step">
                        <strong>Next Step:</strong> <span id="nextStep"></span>
                    </div>
                </div>
            </div>

            <!-- Boss Fight Card -->
            <div id="bossCard" class="boss-card hidden">
                <div class="boss-header">
                    <h2 id="bossTitle">🐉 Boss Fight!</h2>
                    <div class="boss-health">
                        <div class="health-bar">
                            <div class="health-fill" id="bossHealth"></div>
                        </div>
                        <span id="bossHealthText">100%</span>
                    </div>
                </div>

                <div class="boss-content">
                    <div class="boss-description">
                        <h3 id="bossDescription"></h3>
                        <p id="bossChallenge"></p>
                    </div>

                    <div class="boss-code">
                        <h4>🐛 Buggy Code:</h4>
                        <pre id="buggyCode" class="code-block"></pre>
                    </div>

                    <div class="boss-test">
                        <h4>🧪 Test Output:</h4>
                        <pre id="testOutput" class="test-output"></pre>
                    </div>

                    <div class="boss-solution">
                        <h4>💡 Your Solution:</h4>
                        <textarea id="bossSolution" class="solution-input" placeholder="Fix the bug here..."></textarea>
                    </div>

                    <div class="boss-actions">
                        <button id="testSolution" class="btn btn-primary">⚔️ Test Solution</button>
                        <button id="getHint" class="btn btn-secondary">💡 Get Hint</button>
                        <button id="skipBoss" class="btn btn-outline">🏃 Skip Boss</button>
                    </div>

                    <div id="bossFeedback" class="boss-feedback hidden"></div>
                </div>
            </div>

            <!-- Learning Visualizer -->
            <div id="visualizer" class="visualizer hidden">
                <div class="visualizer-header">
                    <h3>🧬 Learning DNA Spiral</h3>
                    <button id="closeVisualizer" class="btn btn-outline">✕</button>
                </div>
                <div id="d3Container" class="d3-container"></div>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="empty-state">
                <div class="empty-content">
                    <h2>🎯 Ready to Learn!</h2>
                    <p>Start coding and I'll help you understand what you're doing.</p>
                    <div class="empty-features">
                        <div class="feature">
                            <span class="feature-icon">📚</span>
                            <span>Learn before applying</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🧠</span>
                            <span>Quick knowledge checks</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🐉</span>
                            <span>Boss fight challenges</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Loading State -->
        <div id="loading" class="loading hidden">
            <div class="loading-spinner"></div>
            <p>Analyzing your code...</p>
        </div>
    </div>

    <!-- Scripts -->
    <script src="${d3Path}"></script>
    <script src="${visualizerScriptPath}"></script>
    <script src="${panelScriptPath}"></script>
</body>
</html>`;
  }

  /**
   * Send initial data to webview
   */
  private async sendInitialDataToWebview(webview: vscode.Webview): Promise<void> {
    try {
      // Get learning stats
      const stats = await this.logger.getLearningStats();
      const conceptStats = await this.logger.getConceptStats();
      
      // Send stats to webview
      webview.postMessage({
        type: 'initialStats',
        stats,
        conceptStats: Array.from(conceptStats.entries())
      });

    } catch (error) {
      console.error('Failed to send initial data to webview:', error);
    }
  }

  /**
   * Send updated stats to webview
   */
  private async sendStatsToWebview(webview: vscode.Webview): Promise<void> {
    try {
      const stats = await this.logger.getLearningStats();
      const conceptStats = await this.logger.getConceptStats();
      
      webview.postMessage({
        type: 'updateStats',
        stats,
        conceptStats: Array.from(conceptStats.entries())
      });

    } catch (error) {
      console.error('Failed to send stats to webview:', error);
    }
  }

  /**
   * Explain selected code or entire document
   */
  private async explainCode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    const selection = editor.selection;
    const code = selection.isEmpty 
      ? editor.document.getText() 
      : editor.document.getText(selection);

    if (!code.trim()) {
      vscode.window.showWarningMessage('No code selected or document is empty');
      return;
    }

    try {
      // Import the extension instance to access CodeExplainer
      const { TBAExtension } = await import('../extension');
      const extension = TBAExtension.getInstance();
      
      const explanation = await extension.explainCode(code, {
        filePath: editor.document.uri.fsPath,
        language: editor.document.languageId
      });

      // Show explanation in a new document
      const doc = await vscode.workspace.openTextDocument({
        content: this.formatExplanation(explanation),
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(doc);
      
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to explain code: ${error}`);
    }
  }

  /**
   * Format explanation for display
   */
  private formatExplanation(explanation: any): string {
    let content = `# ${explanation.title}\n\n`;
    content += `## Overview\n${explanation.overview}\n\n`;
    
    if (explanation.summary) {
      content += `## Summary\n`;
      content += `- **Total Lines**: ${explanation.summary.totalLines}\n`;
      content += `- **Complexity**: ${explanation.summary.complexity}\n`;
      content += `- **Purpose**: ${explanation.summary.keyPurpose}\n\n`;
      
      if (explanation.summary.functions.length > 0) {
        content += `- **Functions**: ${explanation.summary.functions.join(', ')}\n`;
      }
      if (explanation.summary.variables.length > 0) {
        content += `- **Variables**: ${explanation.summary.variables.join(', ')}\n`;
      }
      if (explanation.summary.classes.length > 0) {
        content += `- **Classes**: ${explanation.summary.classes.join(', ')}\n`;
      }
      content += '\n';
    }

    if (explanation.lineByLineExplanations && explanation.lineByLineExplanations.length > 0) {
      content += `## Line-by-Line Explanation\n\n`;
      explanation.lineByLineExplanations.forEach((lineExp: any) => {
        content += `**Line ${lineExp.lineNumber}** (${lineExp.category}):\n`;
        content += `\`\`\`\n${lineExp.code}\n\`\`\`\n`;
        content += `${lineExp.explanation}\n\n`;
        
        if (lineExp.insights && lineExp.insights.length > 0) {
          lineExp.insights.forEach((insight: any) => {
            content += `- 💡 **${insight.type}**: ${insight.text}\n`;
          });
          content += '\n';
        }
      });
    }

    return content;
  }
}
