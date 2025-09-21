/**
 * Quiz Generation Module
 * 
 * This module handles parsing code and generating quiz questions.
 * Now supports AI-powered quiz generation with fallback to mock data.
 */

import * as vscode from 'vscode';
import { AIService } from './aiService';

export interface QuizQuestion {
    id: string;
    type: 'multiple-choice' | 'open-ended' | 'code-modification';
    question: string;
    options?: string[]; // For multiple choice questions
    correctAnswer: string;
    explanation: string;
    codeSnippet?: string; // The specific code this question refers to
    startingCode?: string; // For code modification questions
    requirement?: string; // What the code should be modified to do
}

export interface Quiz {
    title: string;
    questions: QuizQuestion[];
    totalQuestions: number;
}

export class QuizGenerator {
    private aiService: AIService;
    
    constructor() {
        this.aiService = new AIService();
    }
    
    /**
     * Main method to generate a quiz from code
     * Uses AI when configured, falls back to rule-based generation
     */
    async generateQuiz(code: string, fileExtension?: string): Promise<Quiz> {
        console.log('Generating quiz for code:', code.substring(0, 100) + '...');
        
        try {
            // Get user preferences
            const config = vscode.workspace.getConfiguration('codeQuizExplainer');
            const difficulty = config.get('quizDifficulty', 'intermediate') as 'beginner' | 'intermediate' | 'advanced';
            const questionCount = config.get('questionCount', 5) as number;
            const language = this.detectLanguageFromExtension(fileExtension) || 'JavaScript';
            
            console.log(`Detected language: ${language} (from extension: ${fileExtension})`);
            
            // Try AI generation first
            const aiQuiz = await this.aiService.generateQuiz({
                code,
                language,
                difficulty,
                questionCount
            });
            
            return aiQuiz;
            
        } catch (error) {
            console.log('AI generation failed, using fallback:', error);
            
            // Fallback to rule-based generation
            const language = this.detectLanguageFromExtension(fileExtension) || 'JavaScript';
            return this.generateFallbackQuiz(code, language);
        }
    }

    /**
     * Parse code to identify functions, variables, classes, etc.
     * This is a simple implementation - can be enhanced with proper AST parsing
     */
    private parseCodeComponents(code: string): CodeComponent[] {
        const components: CodeComponent[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detect function declarations (simple regex patterns)
            if (line.match(/^(function|const|let|var)\s+\w+.*=.*\(|^function\s+\w+\s*\(/)) {
                components.push({
                    type: 'function',
                    name: this.extractFunctionName(line),
                    line: i + 1,
                    content: line
                });
            }
            
            // Detect variable declarations
            else if (line.match(/^(const|let|var)\s+\w+\s*=/)) {
                components.push({
                    type: 'variable',
                    name: this.extractVariableName(line),
                    line: i + 1,
                    content: line
                });
            }
            
            // Detect class declarations
            else if (line.match(/^class\s+\w+/)) {
                components.push({
                    type: 'class',
                    name: this.extractClassName(line),
                    line: i + 1,
                    content: line
                });
            }
            
            // Detect control flow statements
            else if (line.match(/^(if|for|while|switch)\s*\(/)) {
                components.push({
                    type: 'control-flow',
                    name: line.split('(')[0].trim(),
                    line: i + 1,
                    content: line
                });
            }
        }

        return components;
    }

    /**
     * Fallback quiz generation using rule-based approach
     */
    private generateFallbackQuiz(code: string, language: string): Quiz {
        // Parse the code to identify different components
        const codeComponents = this.parseCodeComponents(code);
        
        // Generate questions based on the components found
        const questions = this.generateQuestionsFromComponents(codeComponents, code, language);
        
        return {
            title: 'Code Understanding Quiz',
            questions: questions,
            totalQuestions: questions.length
        };
    }

    /**
     * Generate quiz questions based on identified code components
     * Used as fallback when AI is not available
     */
    private generateQuestionsFromComponents(components: CodeComponent[], originalCode: string, language: string): QuizQuestion[] {
        const questions: QuizQuestion[] = [];

        // Add some general questions about the code structure
        questions.push(...this.generateGeneralQuestions(originalCode, language));

        // Generate specific questions for each component
        components.forEach((component, index) => {
            questions.push(...this.generateComponentQuestions(component, index));
        });

        // Limit to 5 questions maximum for better UX
        return questions.slice(0, 5);
    }

    /**
     * Generate general questions about the overall code
     */
    private generateGeneralQuestions(code: string, language: string): QuizQuestion[] {
        const questions: QuizQuestion[] = [];

        // Count lines for a basic question
        const lineCount = code.split('\n').length;
        
        questions.push({
            id: 'general-1',
            type: 'multiple-choice',
            question: 'How many lines of code are in this snippet?',
            options: [
                `${Math.max(1, lineCount - 2)} lines`,
                `${lineCount} lines`,
                `${lineCount + 2} lines`,
                `${lineCount + 5} lines`
            ],
            correctAnswer: `${lineCount} lines`,
            explanation: `The code snippet contains exactly ${lineCount} lines of code.`,
            codeSnippet: code.substring(0, 200) + '...'
        });

        // Add language detection question using the detected language
        questions.push({
            id: 'general-2',
            type: 'multiple-choice',
            question: 'What programming language is this code written in?',
            options: ['JavaScript', 'Python', 'Java', 'C++'],
            correctAnswer: language,
            explanation: `This appears to be ${language} code based on the file extension and syntax patterns.`,
            codeSnippet: code.substring(0, 200) + '...'
        });

        return questions;
    }

    /**
     * Generate questions specific to a code component
     */
    private generateComponentQuestions(component: CodeComponent, index: number): QuizQuestion[] {
        const questions: QuizQuestion[] = [];

        switch (component.type) {
            case 'function':
                questions.push({
                    id: `function-${index}`,
                    type: 'multiple-choice',
                    question: `What is the name of the function on line ${component.line}?`,
                    options: [
                        component.name,
                        component.name + 'Alt',
                        'main',
                        'execute'
                    ],
                    correctAnswer: component.name,
                    explanation: `The function is named "${component.name}" as declared on line ${component.line}.`,
                    codeSnippet: component.content
                });
                break;

            case 'variable':
                questions.push({
                    id: `variable-${index}`,
                    type: 'open-ended',
                    question: `What is the purpose of the variable "${component.name}" on line ${component.line}?`,
                    correctAnswer: `This variable stores a value for use in the program.`,
                    explanation: `The variable "${component.name}" is declared to store data that can be used throughout the program.`,
                    codeSnippet: component.content
                });
                break;

            case 'class':
                questions.push({
                    id: `class-${index}`,
                    type: 'multiple-choice',
                    question: `What type of declaration is on line ${component.line}?`,
                    options: ['Function', 'Variable', 'Class', 'Import'],
                    correctAnswer: 'Class',
                    explanation: `Line ${component.line} contains a class declaration for "${component.name}".`,
                    codeSnippet: component.content
                });
                break;

            case 'control-flow':
                questions.push({
                    id: `control-${index}`,
                    type: 'multiple-choice',
                    question: `What type of control flow statement is used on line ${component.line}?`,
                    options: ['if statement', 'for loop', 'while loop', 'switch statement'],
                    correctAnswer: this.getControlFlowType(component.name),
                    explanation: `Line ${component.line} uses a ${component.name} statement to control program flow.`,
                    codeSnippet: component.content
                });
                break;
        }

        return questions;
    }

    // Helper methods for parsing code components

    private extractFunctionName(line: string): string {
        const match = line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/);
        return match ? (match[1] || match[2]) : 'unknownFunction';
    }

    private extractVariableName(line: string): string {
        const match = line.match(/(?:const|let|var)\s+(\w+)/);
        return match ? match[1] : 'unknownVariable';
    }

    private extractClassName(line: string): string {
        const match = line.match(/class\s+(\w+)/);
        return match ? match[1] : 'UnknownClass';
    }


    /**
     * Detect language from file extension (more reliable than pattern matching)
     */
    private detectLanguageFromExtension(extension?: string): string | null {
        if (!extension) return null;
        
        const ext = extension.toLowerCase();
        
        switch (ext) {
            case 'js':
            case 'jsx':
            case 'mjs':
                return 'JavaScript';
            
            case 'ts':
            case 'tsx':
                return 'TypeScript';
            
            case 'py':
            case 'pyw':
            case 'pyc':
                return 'Python';
            
            case 'java':
                return 'Java';
            
            case 'cs':
                return 'C#';
            
            case 'cpp':
            case 'cc':
            case 'cxx':
            case 'c++':
                return 'C++';
            
            case 'c':
            case 'h':
                return 'C';
            
            case 'go':
                return 'Go';
            
            case 'rs':
                return 'Rust';
            
            case 'php':
                return 'PHP';
            
            case 'rb':
                return 'Ruby';
            
            case 'swift':
                return 'Swift';
            
            case 'kt':
            case 'kts':
                return 'Kotlin';
            
            case 'scala':
                return 'Scala';
            
            case 'r':
                return 'R';
            
            case 'dart':
                return 'Dart';
            
            case 'lua':
                return 'Lua';
            
            case 'pl':
            case 'pm':
                return 'Perl';
            
            case 'sh':
            case 'bash':
                return 'Shell';
            
            case 'ps1':
                return 'PowerShell';
            
            case 'sql':
                return 'SQL';
            
            case 'html':
            case 'htm':
                return 'HTML';
            
            case 'css':
                return 'CSS';
            
            case 'json':
                return 'JSON';
            
            case 'xml':
                return 'XML';
            
            case 'yaml':
            case 'yml':
                return 'YAML';
            
            default:
                return null; // Unknown extension
        }
    }

    private getControlFlowType(controlName: string): string {
        switch (controlName) {
            case 'if': return 'if statement';
            case 'for': return 'for loop';
            case 'while': return 'while loop';
            case 'switch': return 'switch statement';
            default: return 'if statement';
        }
    }
}

/**
 * Interface representing a parsed code component
 */
interface CodeComponent {
    type: 'function' | 'variable' | 'class' | 'control-flow';
    name: string;
    line: number;
    content: string;
}

