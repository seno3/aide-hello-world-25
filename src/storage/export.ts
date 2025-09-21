import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LearningEvent } from '../core/telemetry';
import { LearningLogger } from './logger';

export interface ExportOptions {
  includeTodayOnly?: boolean;
  includeQuizzes?: boolean;
  includeDiffs?: boolean;
  includeStats?: boolean;
  format?: 'markdown' | 'html';
}

export class PersonalTextbookExporter {
  private static instance: PersonalTextbookExporter;
  private logger: LearningLogger;

  private constructor() {
    this.logger = LearningLogger.getInstance();
  }

  public static getInstance(): PersonalTextbookExporter {
    if (!PersonalTextbookExporter.instance) {
      PersonalTextbookExporter.instance = new PersonalTextbookExporter();
    }
    return PersonalTextbookExporter.instance;
  }

  /**
   * Export today's learnings to Markdown
   */
  public async exportTodaysLearnings(options: ExportOptions = {}): Promise<string> {
    const events = await this.logger.getTodaysEvents();
    return this.generateMarkdown(events, {
      ...options,
      includeTodayOnly: true
    });
  }

  /**
   * Export all learnings to Markdown
   */
  public async exportAllLearnings(options: ExportOptions = {}): Promise<string> {
    const events = await this.logger.getAllEvents();
    return this.generateMarkdown(events, options);
  }

  /**
   * Export learnings to file (Markdown and optionally PDF)
   */
  public async exportToFile(
    outputPath: string,
    options: ExportOptions = {}
  ): Promise<{ markdownPath: string; pdfPath?: string }> {
    const events = options.includeTodayOnly 
      ? await this.logger.getTodaysEvents()
      : await this.logger.getAllEvents();

    const markdown = this.generateMarkdown(events, options);
    const markdownPath = outputPath.endsWith('.md') ? outputPath : `${outputPath}.md`;
    
    // Write Markdown file
    await fs.promises.writeFile(markdownPath, markdown, 'utf8');

    let pdfPath: string | undefined;
    
    // Try to generate PDF if puppeteer is available
    try {
      pdfPath = await this.generatePDF(markdown, markdownPath.replace('.md', '.pdf'));
    } catch (error) {
      console.warn('PDF generation failed, only Markdown will be available:', error);
    }

    return { markdownPath, pdfPath };
  }

  /**
   * Generate Markdown content from learning events
   */
  private generateMarkdown(events: LearningEvent[], options: ExportOptions): string {
    const stats = this.calculateStats(events);
    const conceptCounts = this.getConceptCounts(events);
    
    let markdown = '# Personal Learning Textbook\n\n';
    markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;

    // Summary section
    if (options.includeStats !== false) {
      markdown += this.generateSummarySection(stats, conceptCounts);
    }

    // Accepted changes section
    const appliedEvents = events.filter(e => e.applied);
    if (appliedEvents.length > 0 && options.includeDiffs !== false) {
      markdown += this.generateAcceptedChangesSection(appliedEvents);
    }

    // Quizzes section
    const quizEvents = events.filter(e => e.quiz_correct !== null);
    if (quizEvents.length > 0 && options.includeQuizzes !== false) {
      markdown += this.generateQuizzesSection(quizEvents);
    }

    // Next steps section
    markdown += this.generateNextStepsSection(events);

    // Learning insights
    markdown += this.generateInsightsSection(events, conceptCounts);

    return markdown;
  }

  private generateSummarySection(stats: any, conceptCounts: Map<string, number>): string {
    let section = '## 📊 Learning Summary\n\n';
    
    section += `- **Total Learning Events**: ${stats.totalEvents}\n`;
    section += `- **Applied Changes**: ${stats.appliedChanges}\n`;
    section += `- **Quiz Accuracy**: ${stats.quizAccuracy}%\n`;
    section += `- **Average Response Time**: ${stats.averageLatency}ms\n\n`;

    // Top concepts
    const topConcepts = Array.from(conceptCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topConcepts.length > 0) {
      section += '### 🏆 Top Learning Concepts\n\n';
      topConcepts.forEach(([concept, count], index) => {
        section += `${index + 1}. **${concept}** (${count} times)\n`;
      });
      section += '\n';
    }

    // Risk distribution
    section += '### ⚠️ Risk Distribution\n\n';
    section += `- **Low Risk**: ${stats.riskDistribution.low} events\n`;
    section += `- **Medium Risk**: ${stats.riskDistribution.medium} events\n`;
    section += `- **High Risk**: ${stats.riskDistribution.high} events\n\n`;

    return section;
  }

  private generateAcceptedChangesSection(events: LearningEvent[]): string {
    let section = '## ✅ Applied Changes\n\n';
    
    events.forEach((event, index) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      section += `### ${index + 1}. ${path.basename(event.file)} (${time})\n\n`;
      section += `- **Mode**: ${event.mode}\n`;
      section += `- **Risk**: ${event.risk}\n`;
      section += `- **Concepts**: ${event.concept_tags.join(', ')}\n`;
      section += `- **Response Time**: ${event.latency_ms}ms\n\n`;
    });

    return section;
  }

  private generateQuizzesSection(events: LearningEvent[]): string {
    let section = '## 🧠 Quiz Results\n\n';
    
    const correctQuizzes = events.filter(e => e.quiz_correct === true);
    const incorrectQuizzes = events.filter(e => e.quiz_correct === false);
    
    section += `- **Total Quizzes**: ${events.length}\n`;
    section += `- **Correct**: ${correctQuizzes.length}\n`;
    section += `- **Incorrect**: ${incorrectQuizzes.length}\n`;
    section += `- **Accuracy**: ${((correctQuizzes.length / events.length) * 100).toFixed(1)}%\n\n`;

    // Show incorrect answers for review
    if (incorrectQuizzes.length > 0) {
      section += '### 📝 Review Incorrect Answers\n\n';
      incorrectQuizzes.forEach((event, index) => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        section += `${index + 1}. **${path.basename(event.file)}** (${time})\n`;
        section += `   - Concepts: ${event.concept_tags.join(', ')}\n`;
        section += `   - Mode: ${event.mode}\n\n`;
      });
    }

    return section;
  }

  private generateNextStepsSection(events: LearningEvent[]): string {
    let section = '## 🎯 Next Steps\n\n';
    
    const conceptCounts = this.getConceptCounts(events);
    const weakConcepts = Array.from(conceptCounts.entries())
      .filter(([_, count]) => count === 1)
      .map(([concept, _]) => concept);

    if (weakConcepts.length > 0) {
      section += '### 🔄 Concepts to Reinforce\n\n';
      section += 'These concepts appeared only once - consider practicing them more:\n\n';
      weakConcepts.forEach(concept => {
        section += `- ${concept}\n`;
      });
      section += '\n';
    }

    // Suggest learning paths
    section += '### 📚 Suggested Learning Paths\n\n';
    section += 'Based on your learning patterns, consider exploring:\n\n';
    
    const allConcepts = Array.from(conceptCounts.keys());
    if (allConcepts.includes('async-await')) {
      section += '- **Advanced Async Patterns**: Promises, async iterators, error handling\n';
    }
    if (allConcepts.includes('react-hooks')) {
      section += '- **React Performance**: useMemo, useCallback, React.memo\n';
    }
    if (allConcepts.includes('sql-security')) {
      section += '- **Database Security**: ORMs, query optimization, data validation\n';
    }
    if (allConcepts.includes('performance')) {
      section += '- **Web Performance**: Bundle optimization, lazy loading, caching\n';
    }

    section += '\n';
    return section;
  }

  private generateInsightsSection(events: LearningEvent[], conceptCounts: Map<string, number>): string {
    let section = '## 💡 Learning Insights\n\n';
    
    // Learning patterns
    const morningEvents = events.filter(e => new Date(e.timestamp).getHours() < 12).length;
    const afternoonEvents = events.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour >= 12 && hour < 18;
    }).length;
    const eveningEvents = events.filter(e => new Date(e.timestamp).getHours() >= 18).length;

    section += '### ⏰ Learning Patterns\n\n';
    section += `- **Morning Learning**: ${morningEvents} events\n`;
    section += `- **Afternoon Learning**: ${afternoonEvents} events\n`;
    section += `- **Evening Learning**: ${eveningEvents} events\n\n`;

    // Most challenging concepts
    const challengingConcepts = events
      .filter(e => e.quiz_correct === false)
      .flatMap(e => e.concept_tags);
    
    const challengeCounts = new Map<string, number>();
    challengingConcepts.forEach(concept => {
      challengeCounts.set(concept, (challengeCounts.get(concept) || 0) + 1);
    });

    if (challengeCounts.size > 0) {
      section += '### 🎯 Most Challenging Concepts\n\n';
      const sortedChallenges = Array.from(challengeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      sortedChallenges.forEach(([concept, count]) => {
        section += `- **${concept}**: ${count} incorrect attempts\n`;
      });
      section += '\n';
    }

    // Learning velocity
    const totalTime = events.reduce((sum, e) => sum + e.latency_ms, 0);
    const averageTime = events.length > 0 ? totalTime / events.length : 0;
    
    section += '### 🚀 Learning Velocity\n\n';
    if (averageTime < 1000) {
      section += 'You\'re learning quickly! Your average response time is under 1 second.\n';
    } else if (averageTime < 3000) {
      section += 'Good learning pace! You\'re taking time to understand concepts thoroughly.\n';
    } else {
      section += 'You\'re being very thoughtful in your learning. Consider if you need more background knowledge.\n';
    }
    section += '\n';

    return section;
  }

  private calculateStats(events: LearningEvent[]): any {
    const appliedChanges = events.filter(e => e.applied).length;
    const quizEvents = events.filter(e => e.quiz_correct !== null);
    const correctQuizzes = quizEvents.filter(e => e.quiz_correct === true).length;
    const totalLatency = events.reduce((sum, e) => sum + e.latency_ms, 0);
    const averageLatency = events.length > 0 ? totalLatency / events.length : 0;

    const riskDistribution = events.reduce((acc, e) => {
      acc[e.risk as keyof typeof acc]++;
      return acc;
    }, { low: 0, medium: 0, high: 0 });

    return {
      totalEvents: events.length,
      appliedChanges,
      correctQuizzes,
      totalQuizzes: quizEvents.length,
      quizAccuracy: quizEvents.length > 0 ? (correctQuizzes / quizEvents.length) * 100 : 0,
      averageLatency: Math.round(averageLatency),
      riskDistribution
    };
  }

  private getConceptCounts(events: LearningEvent[]): Map<string, number> {
    const conceptCounts = new Map<string, number>();
    
    events.forEach(event => {
      event.concept_tags.forEach(concept => {
        const currentCount = conceptCounts.get(concept) || 0;
        conceptCounts.set(concept, currentCount + 1);
      });
    });

    return conceptCounts;
  }

  /**
   * Generate PDF from Markdown using puppeteer
   */
  private async generatePDF(markdown: string, outputPath: string): Promise<string> {
    try {
      // Convert markdown to HTML
      const html = this.markdownToHtml(markdown);
      
      // Use puppeteer to generate PDF
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await browser.close();
      return outputPath;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error}`);
    }
  }

  /**
   * Convert Markdown to HTML for PDF generation
   */
  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    let html = markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');

    // Wrap in proper HTML structure
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Personal Learning Textbook</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1, h2, h3 { color: #2c3e50; }
          h1 { border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          h2 { border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; }
          li { margin-bottom: 5px; }
          code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-family: 'Monaco', 'Menlo', monospace; }
          pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <p>${html}</p>
      </body>
      </html>
    `;
  }
}
