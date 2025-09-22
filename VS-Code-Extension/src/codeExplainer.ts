/**
 * Code Explanation Module
 * 
 * This module handles breaking down code line by line and providing explanations.
 * Now supports AI-powered explanations with fallback to rule-based analysis.
 */

import * as vscode from 'vscode';
import { AIService } from './aiService';

export interface CodeExplanation {
    title: string;
    overview: string;
    lineByLineExplanations: LineExplanation[];
    summary: CodeSummary;
}

export interface LineExplanation {
    lineNumber: number;
    code: string;
    explanation: string;
    category: 'declaration' | 'assignment' | 'function-call' | 'control-flow' | 'comment' | 'other';
    importance: 'high' | 'medium' | 'low';
}

export interface CodeSummary {
    totalLines: number;
    functions: string[];
    variables: string[];
    classes: string[];
    keyPurpose: string;
    complexity: 'simple' | 'moderate' | 'complex';
}

export class CodeExplainer {
    private aiService: AIService;
    
    constructor() {
        this.aiService = new AIService();
    }
    
    /**
     * Main method to generate explanations for code
     * Uses AI when configured, falls back to rule-based analysis
     */
    async explainCode(code: string, fileExtension?: string): Promise<CodeExplanation> {
        console.log('Generating explanation for code:', code.substring(0, 100) + '...');
        
        try {
            // Get user preferences
            const config = vscode.workspace.getConfiguration('codeQuizExplainer');
            const detailLevel = config.get('explanationDetail', 'detailed') as 'basic' | 'detailed' | 'expert';
            const language = this.detectLanguageFromExtension(fileExtension) || this.detectLanguage(code);
            
            console.log(`Detected language: ${language} (from extension: ${fileExtension})`);
            
            // Try AI generation first
            const aiExplanation = await this.aiService.generateExplanation({
                code,
                language,
                detailLevel
            });
            
            return aiExplanation;
            
        } catch (error) {
            console.log('AI explanation failed, using fallback:', error);
            
            // Fallback to rule-based analysis
            const language = this.detectLanguageFromExtension(fileExtension) || this.detectLanguage(code);
            return this.generateFallbackExplanation(code, language);
        }
    }


    /**
     * Fallback explanation generation using rule-based approach
     */
    private generateFallbackExplanation(code: string, language: string): CodeExplanation {
        // Parse the code into lines and analyze each one
        const lines = code.split('\n');
        const lineExplanations = this.analyzeLines(lines);
        
        // Generate summary information
        const summary = this.generateSummary(code, lineExplanations);
        
        // Create overview
        const overview = this.generateOverview(code, summary);
        
        return {
            title: 'Code Explanation',
            overview: overview,
            lineByLineExplanations: lineExplanations,
            summary: summary
        };
    }

    /**
     * Analyze each line of code and provide explanations (fallback method)
     */
    private analyzeLines(lines: string[]): LineExplanation[] {
        const explanations: LineExplanation[] = [];

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // Skip empty lines
            if (!trimmedLine) {
                return;
            }

            const explanation = this.explainLine(trimmedLine, index + 1);
            explanations.push(explanation);
        });

        return explanations;
    }

    /**
     * Explain a single line of code
     * This uses pattern matching - can be replaced with AI analysis
     */
    private explainLine(line: string, lineNumber: number): LineExplanation {
        // Remove leading/trailing whitespace for analysis
        const cleanLine = line.trim();
        
        // Determine the category and explanation
        let category: LineExplanation['category'] = 'other';
        let explanation = '';
        let importance: LineExplanation['importance'] = 'medium';

        // Comment detection
        if (cleanLine.startsWith('//') || cleanLine.startsWith('/*') || cleanLine.startsWith('*')) {
            category = 'comment';
            explanation = 'This is a comment that explains the code but doesn\'t execute.';
            importance = 'low';
        }
        // Function declarations
        else if (cleanLine.match(/^(function|const|let|var)\s+\w+.*=.*\(|^function\s+\w+\s*\(/)) {
            category = 'declaration';
            const functionName = this.extractFunctionName(cleanLine);
            explanation = `This declares a function named "${functionName}" that can be called to execute specific logic.`;
            importance = 'high';
        }
        // Class declarations
        else if (cleanLine.match(/^class\s+\w+/)) {
            category = 'declaration';
            const className = this.extractClassName(cleanLine);
            explanation = `This declares a class named "${className}" which serves as a blueprint for creating objects.`;
            importance = 'high';
        }
        // Variable declarations
        else if (cleanLine.match(/^(const|let|var)\s+\w+\s*=/)) {
            category = 'declaration';
            const varName = this.extractVariableName(cleanLine);
            const varType = cleanLine.startsWith('const') ? 'constant' : 'variable';
            explanation = `This declares a ${varType} named "${varName}" and assigns it a value.`;
            importance = 'medium';
        }
        // Control flow statements
        else if (cleanLine.match(/^(if|for|while|switch)\s*\(/)) {
            category = 'control-flow';
            const controlType = cleanLine.split('(')[0].trim();
            explanation = this.explainControlFlow(controlType);
            importance = 'high';
        }
        // Return statements
        else if (cleanLine.startsWith('return')) {
            category = 'control-flow';
            explanation = 'This returns a value from the function and exits the function execution.';
            importance = 'high';
        }
        // Function calls
        else if (cleanLine.match(/\w+\s*\(/)) {
            category = 'function-call';
            const functionName = this.extractCalledFunction(cleanLine);
            explanation = `This calls the function "${functionName}" to execute its code.`;
            importance = 'medium';
        }
        // Assignment operations
        else if (cleanLine.includes('=') && !cleanLine.includes('==') && !cleanLine.includes('===')) {
            category = 'assignment';
            explanation = 'This assigns a new value to an existing variable.';
            importance = 'medium';
        }
        // Import/export statements
        else if (cleanLine.startsWith('import') || cleanLine.startsWith('export')) {
            category = 'declaration';
            explanation = cleanLine.startsWith('import') 
                ? 'This imports functionality from another file or module.'
                : 'This exports functionality to make it available to other files.';
            importance = 'medium';
        }
        // Closing braces and other structural elements
        else if (cleanLine === '}' || cleanLine === '};') {
            category = 'other';
            explanation = 'This closes a code block (function, class, or control structure).';
            importance = 'low';
        }
        // Default case
        else {
            category = 'other';
            explanation = 'This line contains code logic that performs a specific operation.';
            importance = 'medium';
        }

        return {
            lineNumber: lineNumber,
            code: line, // Keep original formatting
            explanation: explanation,
            category: category,
            importance: importance
        };
    }

    /**
     * Generate a summary of the entire code
     */
    private generateSummary(code: string, lineExplanations: LineExplanation[]): CodeSummary {
        const lines = code.split('\n');
        
        // Extract functions, variables, and classes
        const functions = this.extractFunctions(code);
        const variables = this.extractVariables(code);
        const classes = this.extractClasses(code);
        
        // Determine complexity based on various factors
        const complexity = this.determineComplexity(lineExplanations, functions, classes);
        
        // Generate key purpose description
        const keyPurpose = this.determineKeyPurpose(functions, variables, classes, lineExplanations);
        
        return {
            totalLines: lines.filter(line => line.trim() !== '').length,
            functions: functions,
            variables: variables,
            classes: classes,
            keyPurpose: keyPurpose,
            complexity: complexity
        };
    }

    /**
     * Generate an overview of the code
     */
    private generateOverview(code: string, summary: CodeSummary): string {
        let overview = `This code contains ${summary.totalLines} lines and `;
        
        const components = [];
        if (summary.functions.length > 0) {
            components.push(`${summary.functions.length} function${summary.functions.length > 1 ? 's' : ''}`);
        }
        if (summary.variables.length > 0) {
            components.push(`${summary.variables.length} variable${summary.variables.length > 1 ? 's' : ''}`);
        }
        if (summary.classes.length > 0) {
            components.push(`${summary.classes.length} class${summary.classes.length > 1 ? 'es' : ''}`);
        }
        
        if (components.length > 0) {
            overview += components.join(', ') + '. ';
        } else {
            overview += 'appears to be a simple script. ';
        }
        
        overview += `The complexity level is ${summary.complexity}. `;
        overview += summary.keyPurpose;
        
        return overview;
    }

    // Helper methods for code analysis

    private extractFunctionName(line: string): string {
        const match = line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/);
        return match ? (match[1] || match[2]) : 'unnamed';
    }

    private extractClassName(line: string): string {
        const match = line.match(/class\s+(\w+)/);
        return match ? match[1] : 'UnknownClass';
    }

    private extractVariableName(line: string): string {
        const match = line.match(/(?:const|let|var)\s+(\w+)/);
        return match ? match[1] : 'unnamed';
    }

    private extractCalledFunction(line: string): string {
        const match = line.match(/(\w+)\s*\(/);
        return match ? match[1] : 'unknown';
    }

    private explainControlFlow(controlType: string): string {
        switch (controlType) {
            case 'if':
                return 'This is a conditional statement that executes code only if a condition is true.';
            case 'for':
                return 'This is a loop that repeats code a specific number of times.';
            case 'while':
                return 'This is a loop that repeats code as long as a condition remains true.';
            case 'switch':
                return 'This is a switch statement that executes different code based on different values.';
            default:
                return 'This is a control flow statement that affects how the program executes.';
        }
    }

    private extractFunctions(code: string): string[] {
        const functions: string[] = [];
        const lines = code.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=.*function)/);
            if (match) {
                functions.push(match[1] || match[2]);
            }
        });
        
        return functions;
    }

    private extractVariables(code: string): string[] {
        const variables: string[] = [];
        const lines = code.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/(?:const|let|var)\s+(\w+)(?!\s*=.*function)/);
            if (match) {
                variables.push(match[1]);
            }
        });
        
        return variables;
    }

    private extractClasses(code: string): string[] {
        const classes: string[] = [];
        const lines = code.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/class\s+(\w+)/);
            if (match) {
                classes.push(match[1]);
            }
        });
        
        return classes;
    }

    private determineComplexity(
        lineExplanations: LineExplanation[], 
        functions: string[], 
        classes: string[]
    ): 'simple' | 'moderate' | 'complex' {
        const totalLines = lineExplanations.length;
        const controlFlowCount = lineExplanations.filter(line => line.category === 'control-flow').length;
        
        if (totalLines > 50 || functions.length > 5 || classes.length > 2 || controlFlowCount > 10) {
            return 'complex';
        } else if (totalLines > 20 || functions.length > 2 || classes.length > 0 || controlFlowCount > 3) {
            return 'moderate';
        } else {
            return 'simple';
        }
    }

    private determineKeyPurpose(
        functions: string[], 
        variables: string[], 
        classes: string[], 
        lineExplanations: LineExplanation[]
    ): string {
        if (classes.length > 0) {
            return `This appears to be object-oriented code that defines ${classes.length > 1 ? 'classes' : 'a class'} for creating and managing objects.`;
        } else if (functions.length > 0) {
            return `This code defines ${functions.length > 1 ? 'functions' : 'a function'} to perform specific tasks or calculations.`;
        } else if (variables.length > 0) {
            return 'This code primarily works with variables to store and manipulate data.';
        } else {
            return 'This appears to be a simple script that performs basic operations.';
        }
    }

    /**
     * Simple language detection based on syntax patterns
     */
    private detectLanguage(code: string): string {
        // Simple language detection based on common patterns
        if (code.includes('function') || code.includes('const') || code.includes('let') || code.includes('=>')) {
            return 'JavaScript';
        } else if (code.includes('def ') || code.includes('import ') || code.includes('print(')) {
            return 'Python';
        } else if (code.includes('public class') || code.includes('private ') || code.includes('System.out')) {
            return 'Java';
        } else if (code.includes('#include') || code.includes('std::')) {
            return 'C++';
        } else if (code.includes('fn ') || code.includes('let mut')) {
            return 'Rust';
        } else if (code.includes('func ') || code.includes('package main')) {
            return 'Go';
        }
        return 'JavaScript'; // Default fallback
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
}

