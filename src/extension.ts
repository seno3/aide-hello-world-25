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
    const uiManager = new UIManager(context, codeExplainer);

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
            // Get file extension for language detection
            const fileExtension = activeEditor.document.fileName.split('.').pop() || '';
            
            // Generate quiz questions for the code
            const quiz = await quizGenerator.generateQuiz(code, fileExtension);
            
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
            // Get file extension for language detection
            const fileExtension = activeEditor.document.fileName.split('.').pop() || '';
            
            // Generate explanation for the code
            const explanation = await codeExplainer.explainCode(code, fileExtension);
            
            // Show the explanation in a webview panel
            await uiManager.showExplanationPanel(explanation, code);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating explanation: ${error}`);
        }
    });

    // Set up paste detection for automatic quiz activation
    setupPasteDetection(context, quizGenerator, uiManager);

    // Set up poke feature (blocks pasting if enabled)
    setupPokeFeature(context, quizGenerator, codeExplainer, uiManager);

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
 * Sets up the "poke" feature that blocks pasting and prompts with explanation + quiz
 */
function setupPokeFeature(
    context: vscode.ExtensionContext,
    quizGenerator: QuizGenerator,
    codeExplainer: CodeExplainer,
    uiManager: UIManager
) {
    // Register a custom paste command that intercepts the default paste
    const pokeCommand = vscode.commands.registerCommand('codeQuizExplainer.pokePaste', async () => {
        const config = vscode.workspace.getConfiguration('codeQuizExplainer');
        const pokeEnabled = config.get<boolean>('poke', false);
        
        if (!pokeEnabled) {
            // If poke is disabled, just do normal paste
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            return;
        }

        try {
            // Get clipboard content
            const clipboardText = await vscode.env.clipboard.readText();
            
            if (!clipboardText || clipboardText.trim().length < 30) {
                // For short text, just paste normally
                await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                return;
            }

            // Check if it looks like code (has typical code patterns)
            const looksLikeCode = /[{}();=]/.test(clipboardText) || 
                                  clipboardText.includes('\n') ||
                                  /\b(function|class|const|let|var|if|for|while)\b/.test(clipboardText);

            if (!looksLikeCode) {
                // Not code, just paste normally
                await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                return;
            }

            // Show poke notification (red/warning style) - encourages quiz but allows bypass
            const action = await vscode.window.showWarningMessage(
                `🧠 Found code in clipboard (${clipboardText.length} chars). Do you understand it?`,
                'Take Quiz First 🧠',
                'Explain & Quiz 📚',
                'Paste Anyway 📋'
            );

            switch (action) {
                case 'Take Quiz First 🧠':
                    try {
                        const quiz = await quizGenerator.generateQuiz(clipboardText);
                        await uiManager.showQuizPanel(quiz, clipboardText);
                        
                        // After quiz, automatically paste (they proved they understand)
                        const activeEditor = vscode.window.activeTextEditor;
                        if (activeEditor) {
                            const position = activeEditor.selection.active;
                            await activeEditor.edit(editBuilder => {
                                editBuilder.insert(position, clipboardText);
                            });
                            vscode.window.showInformationMessage('Great job! Code pasted successfully. 🎉');
                        } else {
                            vscode.window.showErrorMessage('No active editor to paste into.');
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(`Error generating quiz: ${error}`);
                    }
                    break;

                case 'Explain & Quiz 📚':
                    try {
                        // First show explanation
                        const explanation = await codeExplainer.explainCode(clipboardText);
                        await uiManager.showExplanationPanel(explanation, clipboardText);
                        
                        // Then require quiz to paste
                        const takeQuiz = await vscode.window.showInformationMessage(
                            'Now that you\'ve read the explanation, take the quiz to paste!',
                            'Take Quiz 🧠',
                            'Cancel'
                        );
                        
                        if (takeQuiz === 'Take Quiz 🧠') {
                            const quiz = await quizGenerator.generateQuiz(clipboardText);
                            await uiManager.showQuizPanel(quiz, clipboardText);
                            
                            // After quiz, automatically paste
                            const activeEditor2 = vscode.window.activeTextEditor;
                            if (activeEditor2) {
                                const position = activeEditor2.selection.active;
                                await activeEditor2.edit(editBuilder => {
                                    editBuilder.insert(position, clipboardText);
                                });
                                vscode.window.showInformationMessage('Excellent! Code pasted successfully. 🎉');
                            } else {
                                vscode.window.showErrorMessage('No active editor to paste into.');
                            }
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(`Error: ${error}`);
                    }
                    break;

                case 'Paste Anyway 📋':
                    try {
                        const activeEditor = vscode.window.activeTextEditor;
                        if (activeEditor) {
                            const position = activeEditor.selection.active;
                            await activeEditor.edit(editBuilder => {
                                editBuilder.insert(position, clipboardText);
                            });
                            vscode.window.showInformationMessage('Code pasted! 📋');
                        } else {
                            vscode.window.showErrorMessage('No active editor to paste into.');
                        }
                    } catch (error) {
                        console.error('Error pasting:', error);
                        vscode.window.showErrorMessage(`Error pasting: ${error}`);
                    }
                    break;

                default:
                    // User cancelled, don't paste
                    break;
            }

        } catch (error) {
            console.error('Poke feature error:', error);
            // Fallback to normal paste
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        }
    });

    // Register keybinding to override default paste when poke is enabled
    const pasteKeybinding = vscode.commands.registerCommand('codeQuizExplainer.interceptPaste', async () => {
        const config = vscode.workspace.getConfiguration('codeQuizExplainer');
        const pokeEnabled = config.get<boolean>('poke', false);
        
        if (pokeEnabled) {
            await vscode.commands.executeCommand('codeQuizExplainer.pokePaste');
        } else {
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        }
    });

    context.subscriptions.push(pokeCommand, pasteKeybinding);
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
    console.log('Code Quiz & Explainer extension is now deactivated.');
}

