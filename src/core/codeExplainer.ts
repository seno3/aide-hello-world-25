/**
 * Code Explanation Module
 * This module handles breaking down code line by line and providing explanations.
 * Now supports AI-powered explanations with fallback to rule-based analysis,
 * detailed line-by-line insights, and a code structure mindmap.
 */

import * as vscode from 'vscode';
import { AIService } from './ai';

export interface CodeExplanation {
    title: string;
    overview: string;
    lineByLineExplanations: LineExplanation[];
    summary: CodeSummary;
    mindmap: MindmapNode;
}

export interface LineExplanation {
    lineNumber: number;
    code: string;
    explanation: string;
    category: 'declaration' | 'assignment' | 'function-call' | 'control-flow' | 'comment' | 'other';
    importance: 'high' | 'medium' | 'low';
    insights: Insight[];
}

export interface Insight {
    type: string;
    text: string;
}

export interface CodeSummary {
    totalLines: number;
    functions: string[];
    variables: string[];
    classes: string[];
    keyPurpose: string;
    complexity: 'simple' | 'moderate' | 'complex';
}

export interface MindmapNode {
    name: string;
    type: 'root' | 'class' | 'function' | 'variable' | 'control-flow';
    children: MindmapNode[];
}

export class CodeExplainer {
    private aiService: AIService;
    
    constructor() {
        this.aiService = AIService.getInstance();
    }
    
    /**
     * Main method to generate explanations for code
     * Uses AI when configured, falls back to rule-based analysis
     */
    async explainCode(code: string, context?: any): Promise<CodeExplanation> {
        console.log('Generating explanation for code:', code.substring(0, 100) + '...');
        
        try {
            // Get user preferences
            const config = vscode.workspace.getConfiguration('tba');
            const detailLevel = config.get('explanationDetail', 'detailed') as 'basic' | 'detailed' | 'expert';
            const language = this.detectLanguage(code);
            
            // Try AI generation first using our existing AI service
            const teachingCard = await this.aiService.generateTeachingCard({
                event: 'explain',
                filePath: context?.filePath || 'unknown',
                before: '',
                after: code,
                unifiedDiff: `+ ${code}`,
                frameworksHint: [language],
                terminalTail: '',
                testsTail: '',
                riskHint: 'low',
                userMode: 'learning'
            });
            
            // Convert teaching card to code explanation format
            const aiExplanation = this.convertTeachingCardToExplanation(teachingCard, code);
            
            // Add mindmap to AI explanation
            aiExplanation.mindmap = this.generateMindmap(code);
            
            return aiExplanation;
            
        } catch (error) {
            console.log('AI explanation failed, using fallback:', error);
            
            // Fallback to rule-based analysis
            return this.generateFallbackExplanation(code);
        }
    }

    /**
     * Provide a follow-up clarification using AI
     */
    async clarify(code: string, question: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('tba');
        const detailLevel = config.get('explanationDetail', 'detailed') as 'basic' | 'detailed' | 'expert';
        const language = this.detectLanguage(code);
        
        // Use our existing AI service for clarification
        const teachingCard = await this.aiService.generateTeachingCard({
            event: 'clarify',
            filePath: 'clarification',
            before: '',
            after: code,
            unifiedDiff: `+ ${code}`,
            frameworksHint: [language],
            terminalTail: '',
            testsTail: '',
            riskHint: 'low',
            userMode: 'learning'
        });
        
        return teachingCard.summary_why || 'Unable to provide clarification at this time.';
    }

    /**
     * Convert teaching card to code explanation format
     */
    private convertTeachingCardToExplanation(teachingCard: any, code: string): CodeExplanation {
        const lines = code.split('\n');
        const lineExplanations = this.analyzeLines(lines);
        const summary = this.generateSummary(code, lineExplanations);
        
        return {
            title: teachingCard.concept_tags?.[0] || 'Code Explanation',
            overview: teachingCard.summary_why || 'This code performs various operations.',
            lineByLineExplanations: lineExplanations,
            summary: summary,
            mindmap: this.generateMindmap(code)
        };
    }

    /**
     * Fallback explanation generation using rule-based approach
     */
    private generateFallbackExplanation(code: string): CodeExplanation {
        const lines = code.split('\n');
        const lineExplanations = this.analyzeLines(lines);
        const summary = this.generateSummary(code, lineExplanations);
        const overview = this.generateOverview(code, summary);
        const mindmap = this.generateMindmap(code);
        
        return {
            title: 'Code Explanation',
            overview: overview,
            lineByLineExplanations: lineExplanations,
            summary: summary,
            mindmap: mindmap
        };
    }

    /**
     * Analyze each line of code and provide explanations (fallback method)
     */
    private analyzeLines(lines: string[]): LineExplanation[] {
        const explanations: LineExplanation[] = [];

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                return;
            }
            const explanation = this.explainLine(line, index + 1);
            explanations.push(explanation);
        });

        return explanations;
    }

    /**
     * Explain a single line of code with detailed insights.
     */
    private explainLine(line: string, lineNumber: number): LineExplanation {
        const cleanLine = line.trim();
        let category: LineExplanation['category'] = 'other';
        let explanation = '';
        let importance: LineExplanation['importance'] = 'medium';
        const insights: Insight[] = [];

        // Basic Categorization
        if (cleanLine.startsWith('//') || cleanLine.startsWith('/*') || cleanLine.startsWith('*') || cleanLine.startsWith('#')) {
            category = 'comment';
            explanation = 'This is a comment that explains the code but doesn\'t execute.';
            importance = 'low';
        } else if (cleanLine.match(/^(function|const|let|var)\s+\w+.*=.*\(|^function\s+\w+\s*\(/)) {
            category = 'declaration';
            explanation = `This declares a function named "${this.extractFunctionName(cleanLine)}".`;
            importance = 'high';
        } else if (cleanLine.match(/^class\s+\w+/)) {
            category = 'declaration';
            explanation = `This declares a class named "${this.extractClassName(cleanLine)}".`;
            importance = 'high';
        } else if (cleanLine.match(/^(const|let|var)\s+\w+\s*=/)) {
            category = 'declaration';
            explanation = `This declares a variable named "${this.extractVariableName(cleanLine)}".`;
            importance = 'medium';
        } else if (cleanLine.match(/^(if|for|while|switch)\s*\(/)) {
            category = 'control-flow';
            explanation = 'This is a control flow statement.';
            importance = 'high';
        } else if (cleanLine.match(/\w+\s*\(/)) {
            category = 'function-call';
            explanation = `This calls the function "${this.extractCalledFunction(cleanLine)}".`;
            importance = 'medium';
        }

        // Add insights based on patterns
        if (cleanLine.includes('async') || cleanLine.includes('await')) {
            insights.push({
                type: 'async',
                text: 'This involves asynchronous programming.'
            });
        }

        if (cleanLine.includes('try') || cleanLine.includes('catch')) {
            insights.push({
                type: 'error-handling',
                text: 'This handles potential errors.'
            });
        }

        if (cleanLine.includes('=>')) {
            insights.push({
                type: 'arrow-function',
                text: 'This uses arrow function syntax.'
            });
        }

        return {
            lineNumber,
            code: line,
            explanation,
            category,
            importance,
            insights
        };
    }

    /**
     * Generate a summary of the code
     */
    private generateSummary(code: string, lineExplanations: LineExplanation[]): CodeSummary {
        const functions = lineExplanations
            .filter(exp => exp.category === 'declaration' && exp.explanation.includes('function'))
            .map(exp => this.extractFunctionName(exp.code));

        const variables = lineExplanations
            .filter(exp => exp.category === 'declaration' && exp.explanation.includes('variable'))
            .map(exp => this.extractVariableName(exp.code));

        const classes = lineExplanations
            .filter(exp => exp.category === 'declaration' && exp.explanation.includes('class'))
            .map(exp => this.extractClassName(exp.code));

        const complexity = this.assessComplexity(lineExplanations);

        return {
            totalLines: lineExplanations.length,
            functions,
            variables,
            classes,
            keyPurpose: this.determinePurpose(lineExplanations),
            complexity
        };
    }

    /**
     * Generate an overview of the code
     */
    private generateOverview(code: string, summary: CodeSummary): string {
        let overview = `This code contains ${summary.totalLines} lines with `;
        
        if (summary.functions.length > 0) {
            overview += `${summary.functions.length} function(s), `;
        }
        
        if (summary.variables.length > 0) {
            overview += `${summary.variables.length} variable(s), `;
        }
        
        if (summary.classes.length > 0) {
            overview += `${summary.classes.length} class(es), `;
        }
        
        overview += `and has ${summary.complexity} complexity. ${summary.keyPurpose}`;
        
        return overview;
    }

    /**
     * Generate a mindmap of the code structure
     */
    private generateMindmap(code: string): MindmapNode {
        const lines = code.split('\n');
        const root: MindmapNode = {
            name: 'Code Structure',
            type: 'root',
            children: []
        };

        let currentFunction: MindmapNode | null = null;
        let currentClass: MindmapNode | null = null;

        lines.forEach((line, index) => {
            const cleanLine = line.trim();
            
            if (cleanLine.match(/^class\s+\w+/)) {
                const className = this.extractClassName(cleanLine);
                currentClass = {
                    name: className,
                    type: 'class',
                    children: []
                };
                root.children.push(currentClass);
            } else if (cleanLine.match(/^(function|const|let|var)\s+\w+.*=.*\(|^function\s+\w+\s*\(/)) {
                const functionName = this.extractFunctionName(cleanLine);
                const functionNode: MindmapNode = {
                    name: functionName,
                    type: 'function',
                    children: []
                };
                
                if (currentClass) {
                    currentClass.children.push(functionNode);
                } else {
                    root.children.push(functionNode);
                }
                currentFunction = functionNode;
            } else if (cleanLine.match(/^(const|let|var)\s+\w+\s*=/)) {
                const variableName = this.extractVariableName(cleanLine);
                const variableNode: MindmapNode = {
                    name: variableName,
                    type: 'variable',
                    children: []
                };
                
                if (currentFunction) {
                    currentFunction.children.push(variableNode);
                } else if (currentClass) {
                    currentClass.children.push(variableNode);
                } else {
                    root.children.push(variableNode);
                }
            }
        });

        return root;
    }

    /**
     * Helper methods for extracting names and patterns
     */
    private extractFunctionName(line: string): string {
        const match = line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+).*=.*\(|(\w+)\s*\(/);
        return match ? (match[1] || match[2] || match[3]) : 'unknown';
    }

    private extractClassName(line: string): string {
        const match = line.match(/class\s+(\w+)/);
        return match ? match[1] : 'unknown';
    }

    private extractVariableName(line: string): string {
        const match = line.match(/(?:const|let|var)\s+(\w+)/);
        return match ? match[1] : 'unknown';
    }

    private extractCalledFunction(line: string): string {
        const match = line.match(/(\w+)\s*\(/);
        return match ? match[1] : 'unknown';
    }

    private detectLanguage(code: string): string {
        if (code.includes('import') && code.includes('from')) return 'typescript';
        if (code.includes('function') && code.includes('=>')) return 'javascript';
        if (code.includes('class') && code.includes('extends')) return 'typescript';
        if (code.includes('interface') || code.includes('type')) return 'typescript';
        return 'javascript';
    }

    private assessComplexity(lineExplanations: LineExplanation[]): 'simple' | 'moderate' | 'complex' {
        const highImportanceCount = lineExplanations.filter(exp => exp.importance === 'high').length;
        const totalLines = lineExplanations.length;
        
        if (highImportanceCount / totalLines > 0.3) return 'complex';
        if (highImportanceCount / totalLines > 0.1) return 'moderate';
        return 'simple';
    }

    private determinePurpose(lineExplanations: LineExplanation[]): string {
        const hasAsync = lineExplanations.some(exp => exp.insights.some(insight => insight.type === 'async'));
        const hasErrorHandling = lineExplanations.some(exp => exp.insights.some(insight => insight.type === 'error-handling'));
        const hasFunctions = lineExplanations.some(exp => exp.category === 'declaration' && exp.explanation.includes('function'));
        
        if (hasAsync && hasErrorHandling) return 'This code handles asynchronous operations with error handling.';
        if (hasAsync) return 'This code performs asynchronous operations.';
        if (hasErrorHandling) return 'This code includes error handling mechanisms.';
        if (hasFunctions) return 'This code defines and uses functions.';
        return 'This code performs various operations.';
    }
}
