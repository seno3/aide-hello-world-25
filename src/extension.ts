import * as vscode from 'vscode';
import { QuizGenerator } from './quizGenerator';
import { CodeExplainer } from './codeExplainer';
import { UIManager } from './uiManager';

/**
 * Main extension activation function
 * Called when the extension is first activated
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Code Quiz & Explainer extension is now active!');
    
    // Show a modern notification to confirm extension is loaded
    vscode.window.showInformationMessage('🚀 Code Quiz & Explainer is ready to blow your mind!');

    // Initialize our core modules
    const quizGenerator = new QuizGenerator();
    const codeExplainer = new CodeExplainer();
    const uiManager = new UIManager(context);

    // Register the "Quiz Me on This Code" command
    const quizCommand = vscode.commands.registerCommand('codeQuizExplainer.quizMe', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found. Please open a file with code.');
            return;
        }

        // Get selected text or entire document if nothing is selected
        const selection = activeEditor.selection;
        const code = selection.isEmpty 
            ? activeEditor.document.getText()
            : activeEditor.document.getText(selection);

        if (!code.trim()) {
            vscode.window.showErrorMessage('No code found to quiz on.');
            return;
        }

        try {
            // Generate quiz questions for the code
            const quiz = await quizGenerator.generateQuiz(code);
            
            // Show the quiz in a webview panel
            await uiManager.showQuizPanel(quiz, code);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating quiz: ${error}`);
        }
    });

    // Register the "Explain This Code" command
    const explainCommand = vscode.commands.registerCommand('codeQuizExplainer.explainCode', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found. Please open a file with code.');
            return;
        }

        // Get selected text or entire document if nothing is selected
        const selection = activeEditor.selection;
        const code = selection.isEmpty 
            ? activeEditor.document.getText()
            : activeEditor.document.getText(selection);

        if (!code.trim()) {
            vscode.window.showErrorMessage('No code found to explain.');
            return;
        }

        try {
            // Generate explanation for the code
            const explanation = await codeExplainer.explainCode(code);
            
            // Show the explanation in a webview panel
            await uiManager.showExplanationPanel(explanation, code);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating explanation: ${error}`);
        }
    });

    // Set up paste detection for automatic quiz activation
    setupPasteDetection(context, quizGenerator, uiManager);

    // Add commands to the context so they can be disposed when extension is deactivated
    context.subscriptions.push(quizCommand, explainCommand);
}

/**
 * Sets up detection for when user pastes code
 * Shows a prompt to quiz them on the pasted content
 */
function setupPasteDetection(
    context: vscode.ExtensionContext, 
    quizGenerator: QuizGenerator, 
    uiManager: UIManager
) {
    // Listen for text document changes to detect pastes
    const changeListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
        // Only proceed if there are content changes (not just cursor movements)
        if (event.contentChanges.length === 0) {
            return;
        }

        // Check if this looks like a paste operation (large text insertion)
        const largeInsert = event.contentChanges.some(change => 
            change.text.length > 50 && // More than 50 characters
            change.text.includes('\n') && // Contains newlines (multi-line)
            change.rangeLength === 0 // Insertion, not replacement
        );

        if (largeInsert) {
            // Show a non-intrusive prompt to quiz on the pasted code
            const action = await vscode.window.showInformationMessage(
                'Looks like you pasted some code! Want to quiz yourself on it?',
                'Quiz Me!',
                'Not Now'
            );

            if (action === 'Quiz Me!') {
                // Get the recently pasted content
                const pastedText = event.contentChanges
                    .filter(change => change.text.length > 50)
                    .map(change => change.text)
                    .join('\n');

                try {
                    const quiz = await quizGenerator.generateQuiz(pastedText);
                    await uiManager.showQuizPanel(quiz, pastedText);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error generating quiz: ${error}`);
                }
            }
        }
    });

    context.subscriptions.push(changeListener);
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
    console.log('Code Quiz & Explainer extension is now deactivated.');
}

