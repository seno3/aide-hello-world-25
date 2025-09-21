import { TeachingCard, Context } from './telemetry';

/**
 * Mock AI service that generates teaching cards based on code patterns
 * TODO: Replace with real LLM API call in production
 */
export class AIService {
  private static instance: AIService;
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate a teaching card based on the context
   */
  public async generateTeachingCard(ctx: Context): Promise<TeachingCard> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Detect patterns and generate appropriate teaching card
    const patterns = this.detectPatterns(ctx);
    
    if (patterns.includes('debounce')) {
      return this.generateDebounceCard(ctx);
    } else if (patterns.includes('sql-param')) {
      return this.generateSQLParamCard(ctx);
    } else if (patterns.includes('async-await')) {
      return this.generateAsyncAwaitCard(ctx);
    } else if (patterns.includes('react-hook')) {
      return this.generateReactHookCard(ctx);
    } else {
      return this.generateGenericCard(ctx);
    }
  }

  private detectPatterns(ctx: Context): string[] {
    const patterns: string[] = [];
    const text = ctx.after.toLowerCase();

    if (text.includes('debounce') || text.includes('throttle')) {
      patterns.push('debounce');
    }
    if (text.includes('?') && (text.includes('select') || text.includes('insert') || text.includes('update'))) {
      patterns.push('sql-param');
    }
    if (text.includes('async') && text.includes('await')) {
      patterns.push('async-await');
    }
    if (text.includes('useeffect') || text.includes('usestate')) {
      patterns.push('react-hook');
    }

    return patterns;
  }

  private generateDebounceCard(ctx: Context): TeachingCard {
    return {
      mode: 'explain',
      risk: 'low',
      concept_tags: ['debounce', 'performance', 'event-handling'],
      summary_why: 'Debouncing prevents excessive function calls during rapid user input. This improves performance by limiting how often expensive operations (like API calls or DOM updates) execute. Without debouncing, every keystroke or scroll event would trigger the function, potentially causing lag or hitting rate limits.',
      diff: {
        unified: `+ const debouncedSearch = useMemo(
+   () => debounce((query: string) => {
+     searchAPI(query);
+   }, 300),
+   []
+ );`
      },
      callouts: [
        { anchor: 'line:1', note: 'useMemo ensures debounce function is created only once' },
        { anchor: 'line:2', note: '300ms delay prevents API calls on every keystroke' }
      ],
      micro_check: {
        type: 'mcq',
        question: 'What happens if you remove the 300ms delay from debounce?',
        choices: [
          'A) Nothing changes',
          'B) API calls happen on every keystroke',
          'C) The function stops working',
          'D) Performance improves'
        ],
        answer_index: 1,
        explain_on_wrong: 'Without the delay, debounce becomes a regular function call, defeating its purpose of batching rapid events.'
      },
      actions: {
        apply_requires_confirm: true,
        suggest_alternatives: [
          {
            label: 'Use lodash.debounce',
            diff: `+ import { debounce } from 'lodash';
+ const debouncedSearch = debounce(searchAPI, 300);`,
            tradeoff: 'Smaller bundle but less control over cleanup'
          },
          {
            label: 'Custom hook with cleanup',
            diff: `+ const useDebounce = (callback, delay) => {
+   const timeoutRef = useRef();
+   return useCallback((...args) => {
+     clearTimeout(timeoutRef.current);
+     timeoutRef.current = setTimeout(() => callback(...args), delay);
+   }, [callback, delay]);
+ };`,
            tradeoff: 'More code but better memory management'
          }
        ],
        next_step: 'Test with rapid typing in the search input to see the difference'
      },
      telemetry: {
        confidence: 0.85,
        estimated_read_time_s: 20,
        patterns_detected: ['debounce', 'performance', 'react-hooks']
      }
    };
  }

  private generateSQLParamCard(ctx: Context): TeachingCard {
    return {
      mode: 'explain',
      risk: 'high',
      concept_tags: ['sql-injection', 'security', 'parameterized-queries'],
      summary_why: 'SQL injection attacks occur when user input is directly concatenated into SQL queries. Parameterized queries separate the query structure from the data, preventing malicious input from being executed as code. This is critical for any application handling user data.',
      diff: {
        unified: `- const query = \`SELECT * FROM users WHERE name = '\${name}'\`;
+ const query = 'SELECT * FROM users WHERE name = ?';
+ const result = await db.query(query, [name]);`
      },
      callouts: [
        { anchor: 'line:1', note: 'Parameterized query with placeholder' },
        { anchor: 'line:2', note: 'User input passed as separate parameter array' }
      ],
      micro_check: {
        type: 'fill',
        question: 'What would happen if a user entered "\'; DROP TABLE users; --" in the name field with the old code?',
        answer_fill: 'The entire users table would be deleted',
        explain_on_wrong: 'SQL injection allows attackers to execute arbitrary SQL commands, potentially destroying or stealing data.'
      },
      actions: {
        apply_requires_confirm: true,
        suggest_alternatives: [
          {
            label: 'Use ORM with built-in protection',
            diff: `+ const user = await User.findOne({ where: { name } });`,
            tradeoff: 'Less SQL control but automatic protection'
          },
          {
            label: 'Input validation + escaping',
            diff: `+ const sanitizedName = escape(name);
+ const query = \`SELECT * FROM users WHERE name = '\${sanitizedName}'\`;`,
            tradeoff: 'More complex but allows custom SQL'
          }
        ],
        next_step: 'Review all other SQL queries in the codebase for similar vulnerabilities'
      },
      telemetry: {
        confidence: 0.95,
        estimated_read_time_s: 25,
        patterns_detected: ['sql-injection', 'security', 'database']
      }
    };
  }

  private generateAsyncAwaitCard(ctx: Context): TeachingCard {
    return {
      mode: 'explain',
      risk: 'medium',
      concept_tags: ['async-await', 'error-handling', 'promises'],
      summary_why: 'Async/await makes asynchronous code look synchronous, improving readability. However, missing await keywords can cause race conditions where code continues before async operations complete. This often leads to undefined values or unhandled promise rejections.',
      diff: {
        unified: `- const data = fetchUserData(userId);
+ const data = await fetchUserData(userId);
  console.log(data.name); // Now data is guaranteed to be loaded`
      },
      callouts: [
        { anchor: 'line:1', note: 'await ensures the promise resolves before continuing' },
        { anchor: 'line:2', note: 'data.name is now safe to access' }
      ],
      micro_check: {
        type: 'mcq',
        question: 'What would console.log show without the await keyword?',
        choices: [
          'A) The user data object',
          'B) A Promise object',
          'C) undefined',
          'D) An error'
        ],
        answer_index: 1,
        explain_on_wrong: 'Without await, fetchUserData returns a Promise, not the resolved data.'
      },
      actions: {
        apply_requires_confirm: true,
        suggest_alternatives: [
          {
            label: 'Add error handling',
            diff: `+ try {
+   const data = await fetchUserData(userId);
+   console.log(data.name);
+ } catch (error) {
+   console.error('Failed to fetch user:', error);
+ }`,
            tradeoff: 'More verbose but handles failures gracefully'
          },
          {
            label: 'Use Promise.all for multiple calls',
            diff: `+ const [user, posts] = await Promise.all([
+   fetchUserData(userId),
+   fetchUserPosts(userId)
+ ]);`,
            tradeoff: 'Faster for parallel operations but more complex'
          }
        ],
        next_step: 'Add try-catch blocks around all async operations'
      },
      telemetry: {
        confidence: 0.80,
        estimated_read_time_s: 18,
        patterns_detected: ['async-await', 'promises', 'error-handling']
      }
    };
  }

  private generateReactHookCard(ctx: Context): TeachingCard {
    return {
      mode: 'explain',
      risk: 'low',
      concept_tags: ['react-hooks', 'useeffect', 'dependency-array'],
      summary_why: 'useEffect dependency arrays control when effects re-run. Missing dependencies can cause stale closures or infinite loops. Including all referenced variables ensures the effect always has access to current values and runs when dependencies change.',
      diff: {
        unified: `- useEffect(() => {
-   fetchData(userId);
- }, []); // Missing userId dependency
+ useEffect(() => {
+   fetchData(userId);
+ }, [userId]); // Now re-runs when userId changes`
      },
      callouts: [
        { anchor: 'line:3', note: 'userId in dependency array ensures effect re-runs when it changes' },
        { anchor: 'line:1', note: 'Effect will now fetch fresh data for each user' }
      ],
      micro_check: {
        type: 'mcq',
        question: 'What happens if userId changes but is not in the dependency array?',
        choices: [
          'A) Effect re-runs with new userId',
          'B) Effect uses stale userId value',
          'C) Effect stops working',
          'D) Nothing changes'
        ],
        answer_index: 1,
        explain_on_wrong: 'Without userId in dependencies, the effect captures the initial userId value and never updates.'
      },
      actions: {
        apply_requires_confirm: true,
        suggest_alternatives: [
          {
            label: 'Add cleanup function',
            diff: `+ useEffect(() => {
+   const controller = new AbortController();
+   fetchData(userId, { signal: controller.signal });
+   return () => controller.abort();
+ }, [userId]);`,
            tradeoff: 'Prevents memory leaks but more complex'
          },
          {
            label: 'Use useCallback for stable reference',
            diff: `+ const fetchDataCallback = useCallback(() => {
+   fetchData(userId);
+ }, [userId]);
+ useEffect(fetchDataCallback, [fetchDataCallback]);`,
            tradeoff: 'More stable but requires useCallback'
          }
        ],
        next_step: 'Run ESLint with exhaustive-deps rule to catch similar issues'
      },
      telemetry: {
        confidence: 0.90,
        estimated_read_time_s: 22,
        patterns_detected: ['react-hooks', 'useeffect', 'dependency-array']
      }
    };
  }

  private generateGenericCard(ctx: Context): TeachingCard {
    return {
      mode: 'explain',
      risk: 'low',
      concept_tags: ['code-quality', 'best-practices'],
      summary_why: 'This code change introduces a new pattern or concept. Understanding the reasoning behind the implementation helps build intuition for similar situations. Good code is not just functional, but also maintainable and follows established patterns.',
      diff: {
        unified: ctx.unifiedDiff || '// Code change detected'
      },
      callouts: [
        { anchor: 'line:1', note: 'Consider the trade-offs of this approach' }
      ],
      micro_check: {
        type: 'mcq',
        question: 'What is the most important aspect of this code change?',
        choices: [
          'A) It works correctly',
          'B) It follows best practices',
          'C) It is maintainable',
          'D) All of the above'
        ],
        answer_index: 3,
        explain_on_wrong: 'Good code balances correctness, best practices, and maintainability.'
      },
      actions: {
        apply_requires_confirm: true,
        suggest_alternatives: [
          {
            label: 'Add comments',
            diff: ctx.unifiedDiff + '\n// TODO: Add documentation',
            tradeoff: 'Better for future developers but more text'
          },
          {
            label: 'Extract to function',
            diff: '// Consider extracting complex logic to a separate function',
            tradeoff: 'More modular but requires refactoring'
          }
        ],
        next_step: 'Review the change and consider if it follows team coding standards'
      },
      telemetry: {
        confidence: 0.60,
        estimated_read_time_s: 15,
        patterns_detected: ['generic-pattern']
      }
    };
  }
}
