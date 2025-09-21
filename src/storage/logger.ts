import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LearningEvent } from '../core/telemetry';

export class LearningLogger {
  private static instance: LearningLogger;
  private logDir: string;
  private logFile: string;

  private constructor() {
    this.logDir = path.join(os.homedir(), '.tba');
    this.logFile = path.join(this.logDir, 'history.jsonl');
    this.ensureLogDirectory();
  }

  public static getInstance(): LearningLogger {
    if (!LearningLogger.instance) {
      LearningLogger.instance = new LearningLogger();
    }
    return LearningLogger.instance;
  }

  /**
   * Log a learning event to the JSONL file
   */
  public async logEvent(event: Omit<LearningEvent, 'timestamp'>): Promise<void> {
    const fullEvent: LearningEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    const logLine = JSON.stringify(fullEvent) + '\n';
    
    try {
      await fs.promises.appendFile(this.logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to log learning event:', error);
    }
  }

  /**
   * Get all learning events from today
   */
  public async getTodaysEvents(): Promise<LearningEvent[]> {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = await fs.promises.readFile(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      const events: LearningEvent[] = lines.map(line => {
        try {
          return JSON.parse(line) as LearningEvent;
        } catch (error) {
          console.error('Failed to parse log line:', line, error);
          return null;
        }
      }).filter(event => event !== null) as LearningEvent[];

      // Filter to today's events
      const today = new Date().toDateString();
      return events.filter(event => {
        const eventDate = new Date(event.timestamp).toDateString();
        return eventDate === today;
      });
    } catch (error) {
      console.error('Failed to read learning events:', error);
      return [];
    }
  }

  /**
   * Get all learning events (not just today's)
   */
  public async getAllEvents(): Promise<LearningEvent[]> {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = await fs.promises.readFile(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          return JSON.parse(line) as LearningEvent;
        } catch (error) {
          console.error('Failed to parse log line:', line, error);
          return null;
        }
      }).filter(event => event !== null) as LearningEvent[];
    } catch (error) {
      console.error('Failed to read learning events:', error);
      return [];
    }
  }

  /**
   * Get learning events for a specific date range
   */
  public async getEventsInRange(startDate: Date, endDate: Date): Promise<LearningEvent[]> {
    const allEvents = await this.getAllEvents();
    
    return allEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  /**
   * Get concept statistics from all events
   */
  public async getConceptStats(): Promise<Map<string, number>> {
    const events = await this.getAllEvents();
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
   * Get learning progress statistics
   */
  public async getLearningStats(): Promise<{
    totalEvents: number;
    appliedChanges: number;
    correctQuizzes: number;
    totalQuizzes: number;
    averageLatency: number;
    riskDistribution: { low: number; medium: number; high: number };
  }> {
    const events = await this.getAllEvents();
    
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
      averageLatency,
      riskDistribution
    };
  }

  /**
   * Clear all learning history
   */
  public async clearHistory(): Promise<void> {
    try {
      if (fs.existsSync(this.logFile)) {
        await fs.promises.unlink(this.logFile);
      }
    } catch (error) {
      console.error('Failed to clear learning history:', error);
    }
  }

  /**
   * Export learning history to a specific file
   */
  public async exportHistory(outputPath: string): Promise<void> {
    try {
      if (!fs.existsSync(this.logFile)) {
        throw new Error('No learning history found');
      }

      const content = await fs.promises.readFile(this.logFile, 'utf8');
      await fs.promises.writeFile(outputPath, content, 'utf8');
    } catch (error) {
      console.error('Failed to export learning history:', error);
      throw error;
    }
  }

  /**
   * Get the path to the log file
   */
  public getLogFilePath(): string {
    return this.logFile;
  }

  /**
   * Get the path to the log directory
   */
  public getLogDirectory(): string {
    return this.logDir;
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Log a teaching card interaction
   */
  public async logTeachingCardInteraction(
    file: string,
    mode: string,
    risk: string,
    conceptTags: string[],
    quizCorrect: boolean | null,
    applied: boolean,
    latencyMs: number
  ): Promise<void> {
    await this.logEvent({
      file,
      mode,
      risk,
      concept_tags: conceptTags,
      quiz_correct: quizCorrect,
      applied,
      latency_ms: latencyMs
    });
  }

  /**
   * Log a boss fight interaction
   */
  public async logBossFight(
    bossId: string,
    concept: string,
    passed: boolean,
    latencyMs: number
  ): Promise<void> {
    await this.logEvent({
      file: `boss-${bossId}`,
      mode: 'boss-fight',
      risk: 'low',
      concept_tags: [concept, 'boss-fight'],
      quiz_correct: passed,
      applied: passed,
      latency_ms: latencyMs
    });
  }
}
