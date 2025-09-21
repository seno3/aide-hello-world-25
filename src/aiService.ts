/**
 * AI Service Module
 * 
 * This module handles AI integration for quiz generation and code explanation.
 * Supports multiple AI providers: OpenAI, Anthropic, local models, etc.
 */

import OpenAI from 'openai';
import * as vscode from 'vscode';

export interface AIConfig {
    provider: 'openai' | 'anthropic' | 'local' | 'mock';
    apiKey?: string;
    model?: string;
    baseURL?: string;
}

export interface AIQuizRequest {
    code: string;
    language?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    questionCount?: number;
}

export interface AIExplanationRequest {
    code: string;
    language?: string;
    detailLevel?: 'basic' | 'detailed' | 'expert';
}

export interface AIClarifyRequest {
    code: string;
    question: string;
    language?: string;
    detailLevel?: 'basic' | 'detailed' | 'expert';
}

export class AIService {
    private openai?: OpenAI;
    private config: AIConfig;

    constructor() {
        this.config = this.loadConfiguration();
        this.initializeAI();
    }

    /**
     * Load AI configuration from VS Code settings
     */
    private loadConfiguration(): AIConfig {
        const config = vscode.workspace.getConfiguration('codeQuizExplainer');
        
        return {
            provider: config.get('aiProvider', 'openai'),
            apiKey: config.get('openaiApiKey', process.env.OPENAI_API_KEY),
            model: config.get('openaiModel', 'gpt-4'),
            baseURL: config.get('openaiBaseURL')
        };
    }

    /**
     * Initialize AI service based on configuration
     */
    private initializeAI(): void {
        if (this.config.provider === 'openai' && this.config.apiKey) {
            this.openai = new OpenAI({
                apiKey: this.config.apiKey,
                baseURL: this.config.baseURL
            });
        }
    }

    /**
     * Generate quiz questions using AI
     */
    async generateQuiz(request: AIQuizRequest): Promise<any> {
        if (!this.isConfigured()) {
            console.log('AI not configured, falling back to mock data');
            return this.generateMockQuiz(request.code);
        }

        try {
            const prompt = this.buildQuizPrompt(request);
            
            if (this.config.provider === 'openai' && this.openai) {
                return await this.generateOpenAIQuiz(prompt);
            }
            
            // Fallback to mock if provider not supported
            return this.generateMockQuiz(request.code);
            
        } catch (error: any) {
            console.error('AI quiz generation failed:', error);
            
            // Provide specific error messages
            if (error.status === 429) {
                if (error.code === 'rate_limit_exceeded') {
                    vscode.window.showWarningMessage('Rate limit exceeded. Please wait a moment and try again.');
                } else if (error.code === 'insufficient_quota') {
                    vscode.window.showWarningMessage('OpenAI quota exceeded. Check your billing at platform.openai.com');
                } else {
                    vscode.window.showWarningMessage('OpenAI rate limit hit. Using fallback generation.');
                }
            } else if (error.status === 401) {
                vscode.window.showErrorMessage('Invalid OpenAI API key. Please check your settings.');
            } else {
                vscode.window.showWarningMessage('AI service unavailable, using fallback quiz generation');
            }
            
            return this.generateMockQuiz(request.code);
        }
    }

    /**
     * Generate code explanation using AI
     */
    async generateExplanation(request: AIExplanationRequest): Promise<any> {
        if (!this.isConfigured()) {
            console.log('AI not configured, falling back to mock data');
            return this.generateMockExplanation(request.code);
        }

        try {
            const prompt = this.buildExplanationPrompt(request);
            
            if (this.config.provider === 'openai' && this.openai) {
                return await this.generateOpenAIExplanation(prompt);
            }
            
            // Fallback to mock if provider not supported
            return this.generateMockExplanation(request.code);
            
        } catch (error: any) {
            console.error('AI explanation generation failed:', error);
            
            // Provide specific error messages
            if (error.status === 429) {
                if (error.code === 'rate_limit_exceeded') {
                    vscode.window.showWarningMessage('Rate limit exceeded. Please wait a moment and try again.');
                } else if (error.code === 'insufficient_quota') {
                    vscode.window.showWarningMessage('OpenAI quota exceeded. Check your billing at platform.openai.com');
                } else {
                    vscode.window.showWarningMessage('OpenAI rate limit hit. Using fallback generation.');
                }
            } else if (error.status === 401) {
                vscode.window.showErrorMessage('Invalid OpenAI API key. Please check your settings.');
            } else {
                vscode.window.showWarningMessage('AI service unavailable, using fallback explanation');
            }
            
            return this.generateMockExplanation(request.code);
        }
    }

    /**
     * Provide a follow-up clarification for an existing explanation
     */
    async clarifyExplanation(request: AIClarifyRequest): Promise<string> {
        if (!this.isConfigured()) {
            console.log('AI not configured, returning mock clarification');
            return this.generateMockClarification(request);
        }

        try {
            const prompt = this.buildClarifyPrompt(request);
            if (this.config.provider === 'openai' && this.openai) {
                return await this.generateOpenAIClarification(prompt);
            }
            return this.generateMockClarification(request);
        } catch (error: any) {
            console.error('AI clarification failed:', error);
            if (error.status === 429) {
                vscode.window.showWarningMessage('Rate limit exceeded. Please wait a moment and try again.');
            } else if (error.status === 401) {
                vscode.window.showErrorMessage('Invalid OpenAI API key. Please check your settings.');
            } else {
                vscode.window.showWarningMessage('AI service unavailable, using fallback clarification');
            }
            return this.generateMockClarification(request);
        }
    }

    /**
     * Check if AI service is properly configured
     */
    private isConfigured(): boolean {
        console.log('AI Configuration Check:', {
            provider: this.config.provider,
            hasApiKey: !!this.config.apiKey,
            apiKeyStart: this.config.apiKey?.substring(0, 10) + '...',
            model: this.config.model
        });
        return !!(this.config.apiKey && this.config.provider !== 'mock');
    }

    /**
     * Build quiz generation prompt
     */
    private buildQuizPrompt(request: AIQuizRequest): string {
        const difficulty = request.difficulty || 'intermediate';
        const questionCount = request.questionCount || 5;
        const language = request.language || 'JavaScript';

        return `
You are an expert coding instructor. Analyze the following ${language} code and generate exactly ${questionCount} quiz questions to test understanding.

CODE:
\`\`\`${language.toLowerCase()}
${request.code}
\`\`\`

Requirements:
- Difficulty level: ${difficulty}
- Mix of multiple-choice and open-ended questions
- Focus on: function names, variable purposes, control flow, syntax, and overall logic
- Include brief explanations for each answer
- Return JSON format matching this structure:

{
  "title": "Code Understanding Quiz",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice" | "open-ended",
      "question": "Question text here",
      "options": ["option1", "option2", "option3", "option4"], // only for multiple-choice
      "correctAnswer": "correct answer",
      "explanation": "Brief explanation of why this is correct",
      "codeSnippet": "relevant code snippet if applicable"
    }
  ],
  "totalQuestions": ${questionCount}
}

Generate questions that help the user understand what this code does, how it works, and why it's structured this way.`;
    }

    /**
     * Build explanation generation prompt
     */
    private buildExplanationPrompt(request: AIExplanationRequest): string {
        const detailLevel = request.detailLevel || 'detailed';
        const language = request.language || 'JavaScript';

        return `
You are an expert coding instructor. Provide a comprehensive explanation of the following ${language} code.

CODE:
\`\`\`${language.toLowerCase()}
${request.code}
\`\`\`

Detail level: ${detailLevel}

Please analyze the code and return JSON in this exact format:

{
  "title": "Code Explanation",
  "overview": "High-level summary of what this code does and its purpose",
  "lineByLineExplanations": [
    {
      "lineNumber": 1,
      "code": "actual line of code",
      "explanation": "What this line does and why",
      "category": "declaration" | "assignment" | "function-call" | "control-flow" | "comment" | "other",
      "importance": "high" | "medium" | "low"
    }
  ],
  "summary": {
    "totalLines": 0,
    "functions": ["function names found"],
    "variables": ["variable names found"],
    "classes": ["class names found"],
    "keyPurpose": "Main purpose of this code",
    "complexity": "simple" | "moderate" | "complex"
  }
}

Focus on:
- Clear explanations for beginners to intermediate programmers
- Why each line is important
- How the pieces work together
- Best practices demonstrated or violated
- Potential improvements`;
    }

    /**
     * Build clarification prompt
     */
    private buildClarifyPrompt(request: AIClarifyRequest): string {
        const detailLevel = request.detailLevel || 'detailed';
        const language = request.language || 'JavaScript';
        return `
You are an expert coding instructor. The user has a follow-up question about the following ${language} code.

CODE:
\`\`\`${language.toLowerCase()}
${request.code}
\`\`\`

USER QUESTION:
"""
${request.question}
"""

Answer directly and concisely at a ${detailLevel} level. Use clear, structured paragraphs and bullet points where helpful. Do not return JSON, just the explanation text.`;
    }

    /**
     * Generate quiz using OpenAI
     */
    private async generateOpenAIQuiz(prompt: string): Promise<any> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }

        const completion = await this.openai.chat.completions.create({
            model: this.config.model || 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful coding instructor that generates educational quizzes. Always return valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }

        try {
            return JSON.parse(content);
        } catch (error) {
            console.error('Failed to parse OpenAI response:', content);
            throw new Error('Invalid JSON response from OpenAI');
        }
    }

    /**
     * Generate explanation using OpenAI
     */
    private async generateOpenAIExplanation(prompt: string): Promise<any> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }

        const completion = await this.openai.chat.completions.create({
            model: this.config.model || 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful coding instructor that explains code clearly. Always return valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 3000
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }

        try {
            return JSON.parse(content);
        } catch (error) {
            console.error('Failed to parse OpenAI response:', content);
            throw new Error('Invalid JSON response from OpenAI');
        }
    }

    /**
     * Generate clarification using OpenAI
     */
    private async generateOpenAIClarification(prompt: string): Promise<string> {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }

        const completion = await this.openai.chat.completions.create({
            model: this.config.model || 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a helpful coding instructor. Answer clearly and concisely.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 800
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }
        return content.trim();
    }

    /**
     * Fallback mock quiz generation (existing logic)
     */
    private generateMockQuiz(code: string): any {
        const lines = code.split('\n').filter(line => line.trim() !== '');
        
        return {
            title: 'Code Understanding Quiz (Mock)',
            questions: [
                {
                    id: 'mock-1',
                    type: 'multiple-choice',
                    question: 'How many lines of code are in this snippet?',
                    options: [
                        `${Math.max(1, lines.length - 2)} lines`,
                        `${lines.length} lines`,
                        `${lines.length + 2} lines`,
                        `${lines.length + 5} lines`
                    ],
                    correctAnswer: `${lines.length} lines`,
                    explanation: `The code snippet contains exactly ${lines.length} lines of code.`,
                    codeSnippet: code.substring(0, 200) + '...'
                },
                {
                    id: 'mock-2',
                    type: 'open-ended',
                    question: 'What is the main purpose of this code?',
                    correctAnswer: 'This code performs various operations including function definitions and data manipulation.',
                    explanation: 'The code demonstrates programming concepts and performs specific computational tasks.',
                    codeSnippet: code.substring(0, 200) + '...'
                }
            ],
            totalQuestions: 2
        };
    }

    /**
     * Fallback mock explanation generation (existing logic)
     */
    private generateMockExplanation(code: string): any {
        const lines = code.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim() !== '');
        
        const lineExplanations = lines.map((line, index) => {
            if (!line.trim()) return null;
            
            return {
                lineNumber: index + 1,
                code: line,
                explanation: 'This line contains code logic that performs a specific operation.',
                category: 'other' as const,
                importance: 'medium' as const
            };
        }).filter(exp => exp !== null);

        return {
            title: 'Code Explanation (Mock)',
            overview: 'This code demonstrates various programming concepts and performs computational tasks.',
            lineByLineExplanations: lineExplanations,
            summary: {
                totalLines: nonEmptyLines.length,
                functions: [],
                variables: [],
                classes: [],
                keyPurpose: 'This code performs various programming operations.',
                complexity: 'simple' as const
            }
        };
    }

    /**
     * Fallback mock clarification
     */
    private generateMockClarification(request: AIClarifyRequest): string {
        return `Here is a clarification for your question: "${request.question}"\n\n- The code operates over ${request.language || 'JavaScript'} constructs.\n- Think about inputs, outputs, and side effects in each function.\n- Focus on how data flows between variables and functions.`;
    }

    /**
     * Update configuration (useful for settings changes)
     */
    updateConfiguration(): void {
        this.config = this.loadConfiguration();
        this.initializeAI();
    }
}
