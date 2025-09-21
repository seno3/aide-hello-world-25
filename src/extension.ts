import * as vscode from 'vscode';
import { QuizGenerator } from './quizGenerator';
import { CodeExplainer } from './codeExplainer';
import { UIManager } from './uiManager';

/**
 * Main extension activation function
 * Called when the extension is first activated
 */
export function activate(context: vscode.ExtensionContext) {
    try {
        console.log('🚀 EXTENSION ACTIVATING - Code Quiz & Explainer extension is now active!');
        
        // Show a modern notification to confirm extension is loaded
        vscode.window.showInformationMessage('🚀 Code Quiz & Explainer is ready to blow your mind!');
        console.log('🚀 Notification shown');

        // Initialize our core modules
        console.log('🚀 Initializing core modules...');
        const quizGenerator = new QuizGenerator();
        console.log('🚀 QuizGenerator created');
        const codeExplainer = new CodeExplainer();
        console.log('🚀 CodeExplainer created');
        const uiManager = new UIManager(context, codeExplainer);
        console.log('🚀 UIManager created');

    // Register the "Quiz Me on This Code" command
    console.log('🚀 Registering quizMe command...');
    const quizCommand = vscode.commands.registerCommand('codeQuizExplainer.quizMe', async () => {
        console.log('🚀 QUIZ COMMAND TRIGGERED!');
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
            console.log('🚀 Generating quiz for code length:', code.length, 'extension:', fileExtension);
            
            // Generate quiz questions for the code
            const quiz = await quizGenerator.generateQuiz(code, fileExtension);
            console.log('🚀 Quiz generated:', quiz.title, 'Questions:', quiz.totalQuestions);
            
            // Show the quiz in a webview panel
            console.log('🚀 Showing quiz panel...');
            await uiManager.showQuizPanel(quiz, code);
            console.log('🚀 Quiz panel shown successfully');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating quiz: ${error}`);
        }
    });

    // Register the "Explain This Code" command
    console.log('🚀 Registering explainCode command...');
    const explainCommand = vscode.commands.registerCommand('codeQuizExplainer.explainCode', async () => {
        console.log('🚀 EXPLAIN COMMAND TRIGGERED!');
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
            console.log('🚀 Generating explanation for code length:', code.length, 'extension:', fileExtension);
            
            // Generate explanation for the code
            const explanation = await codeExplainer.explainCode(code, fileExtension);
            console.log('🚀 Explanation generated:', explanation.title, 'Lines:', explanation.lineByLineExplanations.length);
            
            // Show the explanation in a webview panel
            console.log('🚀 Showing explanation panel...');
            await uiManager.showExplanationPanel(explanation, code);
            console.log('🚀 Explanation panel shown successfully');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating explanation: ${error}`);
        }
    });

    // Set up paste detection for automatic quiz activation
    setupPasteDetection(context, quizGenerator, uiManager);

    // Set up poke feature (blocks pasting if enabled)
    setupPokeFeature(context, quizGenerator, codeExplainer, uiManager);

    // Register a test command for debugging poke functionality
    const testPokeCommand = vscode.commands.registerCommand('codeQuizExplainer.testPoke', async () => {
        console.log('🔍 Test poke command triggered');
        const testCode = `function hello() {
    console.log("Hello, World!");
}`;
        
        try {
            const action = await uiManager.showPokeModal(testCode);
            console.log('🔍 Test poke modal returned:', action);
            
            if (action === 'paste') {
                const success = await pasteTextToEditor(testCode);
                console.log('🔍 Test paste result:', success);
                if (success) {
                    vscode.window.showInformationMessage('Test paste successful! 🎉');
                }
            } else if (action !== 'cancel') {
                vscode.window.showInformationMessage(`You selected: ${action}`);
            }
        } catch (error) {
            console.error('🔍 Test poke error:', error);
            vscode.window.showErrorMessage(`Test failed: ${error}`);
        }
    });

        // Add commands to the context so they can be disposed when extension is deactivated
        console.log('🚀 Adding commands to subscriptions...');
        context.subscriptions.push(quizCommand, explainCommand, testPokeCommand);
        console.log('🚀 Extension activation completed successfully!');
        
    } catch (error) {
        console.error('💥 EXTENSION ACTIVATION FAILED:', error);
        vscode.window.showErrorMessage(`Extension activation failed: ${error}`);
        throw error;
    }
}

/**
 * Helper function to reliably paste text into the active editor
 * 
 * Note: We use direct text insertion instead of editor.action.clipboardPasteAction
 * because the clipboard action doesn't work reliably when called programmatically,
 * especially after intercepting the original paste command.
 */
async function pasteTextToEditor(text: string, targetDocumentUri?: vscode.Uri, targetPosition?: vscode.Position): Promise<boolean> {
    console.log('🔍 pasteTextToEditor called with text length:', text.length);
    
    let activeEditor = vscode.window.activeTextEditor;
    console.log('🔍 Current active editor found:', !!activeEditor);
    
    // If no active editor but we have target info, try to find the target editor
    if (!activeEditor && targetDocumentUri) {
        console.log('🔍 No active editor, searching for target document:', targetDocumentUri.toString());
        
        // Find the editor with the target document
        const targetEditor = vscode.window.visibleTextEditors.find(
            editor => editor.document.uri.toString() === targetDocumentUri.toString()
        );
        
        if (targetEditor) {
            console.log('🔍 Found target editor in visible editors');
            activeEditor = targetEditor;
            
            // Try to focus the target editor
            await vscode.window.showTextDocument(targetEditor.document, targetEditor.viewColumn);
            console.log('🔍 Focused target editor');
        }
    }
    
    if (!activeEditor) {
        console.log('🔍 No active editor available and could not find target');
        vscode.window.showErrorMessage('No active editor found. Please click in a file first.');
        return false;
    }
    
    try {
        // Check if the editor is still valid
        if (activeEditor.document.isClosed) {
            console.log('🔍 Active editor document is closed');
            vscode.window.showErrorMessage('The target file is closed. Please open a file first.');
            return false;
        }
        
        // Use target position if provided, otherwise use current cursor position
        const position = targetPosition || activeEditor.selection.active;
        console.log('🔍 Inserting at position:', position.line, position.character, 
                    targetPosition ? '(from target)' : '(current cursor)');
        
        // Direct text insertion - most reliable method
        const success = await activeEditor.edit(editBuilder => {
            editBuilder.insert(position, text);
        });
        
        if (success) {
            // Move cursor to end of inserted text
            const lines = text.split('\n');
            const lastLine = lines[lines.length - 1];
            const newPosition = new vscode.Position(
                position.line + lines.length - 1,
                lines.length === 1 ? position.character + lastLine.length : lastLine.length
            );
            activeEditor.selection = new vscode.Selection(newPosition, newPosition);
            console.log('🔍 Text inserted successfully, cursor moved to:', newPosition.line, newPosition.character);
            return true;
        } else {
            console.log('🔍 Edit operation returned false');
            vscode.window.showErrorMessage('Failed to paste code - edit operation was rejected');
            return false;
        }
    } catch (error) {
        console.error('🔍 Error during paste operation:', error);
        vscode.window.showErrorMessage(`Failed to paste code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
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
        console.log('🔍 Poke command triggered');
        const config = vscode.workspace.getConfiguration('codeQuizExplainer');
        const pokeEnabled = config.get<boolean>('poke', false);
        console.log('🔍 Poke enabled:', pokeEnabled);
        
        if (!pokeEnabled) {
            console.log('🔍 Poke disabled, doing normal paste');
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

            // Store target document info before showing modal
            const targetEditor = vscode.window.activeTextEditor;
            const targetDocumentUri = targetEditor?.document.uri;
            const targetPosition = targetEditor?.selection.active;
            console.log('Target editor info:', {
                hasEditor: !!targetEditor,
                documentUri: targetDocumentUri?.toString(),
                position: targetPosition ? `${targetPosition.line}:${targetPosition.character}` : 'none'
            });

            // Show poke modal - encourages quiz but allows bypass
            const action = await uiManager.showPokeModal(clipboardText);
            console.log('Poke modal returned action:', action);

            switch (action) {
                case 'quiz':
                    try {
                        const quiz = await quizGenerator.generateQuiz(clipboardText);
                        await uiManager.showQuizPanel(quiz, clipboardText);
                        
                        // After quiz, automatically paste (they proved they understand)
                        console.log('🎯 Quiz completed, attempting paste...');
                        const pasteSuccess = await pasteTextToEditor(clipboardText, targetDocumentUri, targetPosition);
                        if (pasteSuccess) {
                            vscode.window.showInformationMessage('Great job! Code pasted successfully. 🎉');
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(`Error generating quiz: ${error}`);
                    }
                    break;

                case 'explain-quiz':
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
                            const pasteSuccess = await pasteTextToEditor(clipboardText, targetDocumentUri, targetPosition);
                            if (pasteSuccess) {
                                vscode.window.showInformationMessage('Excellent! Code pasted successfully. 🎉');
                            }
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(`Error: ${error}`);
                    }
                    break;

                case 'paste':
                    console.log('🔴 Processing PASTE ANYWAY action, clipboard text length:', clipboardText.length);
                    console.log('🔴 Target info for paste anyway:', {
                        hasTargetUri: !!targetDocumentUri,
                        targetUri: targetDocumentUri?.toString(),
                        hasTargetPosition: !!targetPosition,
                        targetPosition: targetPosition ? `${targetPosition.line}:${targetPosition.character}` : 'none'
                    });
                    
                    // Add a small delay to allow modal to fully close and editor to regain focus
                    console.log('🔴 Waiting 200ms for modal to fully close...');
                    await new Promise(resolve => setTimeout(resolve, 200));
                    console.log('🔴 Attempting paste after delay...');
                    
                    // Try to explicitly open and focus the target document first
                    if (targetDocumentUri) {
                        try {
                            console.log('🔴 Explicitly opening target document...');
                            const targetDoc = await vscode.workspace.openTextDocument(targetDocumentUri);
                            await vscode.window.showTextDocument(targetDoc, { 
                                preserveFocus: false,
                                selection: targetPosition ? new vscode.Range(targetPosition, targetPosition) : undefined
                            });
                            console.log('🔴 Target document opened and focused');
                            
                            // Small additional delay after focusing
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (error) {
                            console.log('🔴 Error opening target document:', error);
                        }
                    }
                    
                    const pasteSuccess = await pasteTextToEditor(clipboardText, targetDocumentUri, targetPosition);
                    if (pasteSuccess) {
                        vscode.window.showInformationMessage('Code pasted successfully! 📋');
                        console.log('🔴 Paste anyway completed successfully');
                    } else {
                        console.log('🔴 Paste anyway FAILED');
                    }
                    break;

                case 'cancel':
                default:
                    // User cancelled or closed modal, don't paste
                    console.log('User cancelled or closed poke modal');
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
        console.log('🔍 Intercept paste command triggered');
        const config = vscode.workspace.getConfiguration('codeQuizExplainer');
        const pokeEnabled = config.get<boolean>('poke', false);
        console.log('🔍 Poke enabled in intercept:', pokeEnabled);
        
        if (pokeEnabled) {
            console.log('🔍 Calling pokePaste command');
            await vscode.commands.executeCommand('codeQuizExplainer.pokePaste');
        } else {
            console.log('🔍 Doing normal paste');
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

